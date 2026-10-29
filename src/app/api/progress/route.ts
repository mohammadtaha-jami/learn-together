import { NextResponse } from "next/server";
import type { ProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";
import { getLeafSections, type SectionNode } from "@/lib/learning/section-tree";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const topicId = new URL(request.url).searchParams.get("topicId");
  if (!topicId) {
    return NextResponse.json({ error: "topicId required" }, { status: 400 });
  }

  const topic = await getTopicIfAccessible(topicId, auth.user.id);
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const flatSections: SectionNode[] = topic.chapters.flatMap((c) =>
    c.sections.map((s) => ({
      id: s.id,
      titleEn: s.titleEn,
      titleFa: s.titleFa,
      sortOrder: s.sortOrder,
      parentId: s.parentId,
    })),
  );
  const sectionIds = flatSections.map((s) => s.id);

  // Leaves are computed per chapter so that roots never mix across chapters
  const leafIds = topic.chapters.flatMap((c) =>
    getLeafSections(
      flatSections.filter((s) => c.sections.some((x) => x.id === s.id)),
    ).map((l) => l.id),
  );

  const myProgress = await prisma.progress.findMany({
    where: { userId: auth.user.id, sectionId: { in: sectionIds } },
  });

  const membersSummary: { userId: string; name: string; percent: number }[] = [];
  const teammateProgress: {
    userId: string;
    name: string;
    sectionId: string;
    status: "IN_PROGRESS" | "DONE";
  }[] = [];

  if (topic.scope === "TEAM" && topic.teamId) {
    const [members, grouped] = await Promise.all([
      prisma.teamMember.findMany({
        where: { teamId: topic.teamId },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.progress.groupBy({
        by: ["userId"],
        where: { sectionId: { in: leafIds }, status: "DONE" },
        _count: { _all: true },
      }),
    ]);
    const doneBy = new Map(grouped.map((g) => [g.userId, g._count._all]));
    for (const m of members) {
      membersSummary.push({
        userId: m.user.id,
        name: m.user.name,
        percent: leafIds.length
          ? Math.round(((doneBy.get(m.user.id) ?? 0) / leafIds.length) * 100)
          : 0,
      });
    }

    const teammateIds = members
      .map((m) => m.user.id)
      .filter((id) => id !== auth.user.id);
    const nameById = new Map(members.map((m) => [m.user.id, m.user.name]));

    if (teammateIds.length > 0 && leafIds.length > 0) {
      const rows = await prisma.progress.findMany({
        where: {
          userId: { in: teammateIds },
          sectionId: { in: leafIds },
          status: { in: ["IN_PROGRESS", "DONE"] },
        },
        select: { userId: true, sectionId: true, status: true },
      });
      for (const row of rows) {
        if (row.status !== "IN_PROGRESS" && row.status !== "DONE") continue;
        teammateProgress.push({
          userId: row.userId,
          name: nameById.get(row.userId) ?? "?",
          sectionId: row.sectionId,
          status: row.status,
        });
      }
    }
  }
  return NextResponse.json({
    progress: myProgress,
    membersSummary,
    teammateProgress,
    leafSectionIds: leafIds,
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const sectionId = body.sectionId?.toString();
  const status = body.status as ProgressStatus;
  const note = body.note?.toString() || null;

  if (!sectionId || !status) {
    return NextResponse.json({ error: "sectionId and status required" }, { status: 400 });
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { chapter: true },
  });
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const topic = await getTopicIfAccessible(section.chapter.topicId, auth.user.id);
  if (!topic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const completedAt = status === "DONE" ? new Date() : null;

  const progress = await prisma.progress.upsert({
    where: {
      userId_sectionId: { userId: auth.user.id, sectionId },
    },
    create: {
      userId: auth.user.id,
      sectionId,
      status,
      note,
      completedAt,
    },
    update: {
      status,
      note: note ?? undefined,
      completedAt,
    },
  });

  return NextResponse.json(progress);
}
