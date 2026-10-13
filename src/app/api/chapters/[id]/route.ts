import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";

type Params = { params: { id: string } };

async function chapterWithAccess(chapterId: string, userId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { topic: true },
  });
  if (!chapter) return null;
  const ok = await getTopicIfAccessible(chapter.topicId, userId);
  return ok ? chapter : null;
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = params;

  const chapter = await chapterWithAccess(id, auth.user.id);
  if (!chapter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await prisma.chapter.update({
    where: { id },
    data: {
      number: body.number !== undefined ? body.number?.toString() || null : undefined,
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

  const chapter = await chapterWithAccess(id, auth.user.id);
  if (!chapter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chapter.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
