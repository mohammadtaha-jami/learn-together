import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  canDeleteTopicForUser,
  getTopicIfAccessible,
  resolveTeamRole,
  canDeleteTopic,
} from "@/lib/learning/topic-access";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = params;

  const topic = await getTopicIfAccessible(id, auth.user.id);
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const teamRole = await resolveTeamRole(auth.user.id, topic.teamId);
  return NextResponse.json({
    ...topic,
    canDelete: canDeleteTopic(topic, auth.user.id, teamRole),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = params;

  const existing = await getTopicIfAccessible(id, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const topic = await prisma.topic.update({
    where: { id },
    data: {
      titleEn: body.titleEn?.toString().trim() ?? undefined,
      titleFa: body.titleFa !== undefined ? body.titleFa?.toString().trim() || null : undefined,
      description:
        body.description !== undefined
          ? body.description?.toString().trim() || null
          : undefined,
    },
  });

  return NextResponse.json(topic);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = params;

  const existing = await getTopicIfAccessible(id, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "موضوع پیدا نشد" }, { status: 404 });
  }

  const allowed = await canDeleteTopicForUser(existing, auth.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "اجازهٔ حذف این موضوع را ندارید" },
      { status: 403 },
    );
  }

  await prisma.topic.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
