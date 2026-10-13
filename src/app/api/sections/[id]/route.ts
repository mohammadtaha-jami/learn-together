import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";

type Params = { params: { id: string } };

async function sectionWithAccess(sectionId: string, userId: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { chapter: true },
  });
  if (!section) return null;
  const topic = await getTopicIfAccessible(section.chapter.topicId, userId);
  return topic ? section : null;
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = params;

  const section = await sectionWithAccess(id, auth.user.id);
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await prisma.section.update({
    where: { id },
    data: {
      titleEn: body.titleEn?.toString().trim() ?? undefined,
      titleFa: body.titleFa !== undefined ? body.titleFa?.toString().trim() || null : undefined,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = params;

  const section = await sectionWithAccess(id, auth.user.id);
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.section.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
