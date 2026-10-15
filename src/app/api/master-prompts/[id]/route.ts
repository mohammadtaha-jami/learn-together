import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";
import { requireUser } from "@/lib/session";

type Params = { params: { id: string } };

async function owned(id: string, userId: string) {
  return prisma.masterPrompt.findFirst({
    where: { id, userId },
    include: { topic: { select: { id: true, titleEn: true, titleFa: true } } },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const existing = await owned(params.id, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "پیدا نشد" }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name !== undefined ? body.name?.toString().trim() : undefined;
  const promptBody = body.body !== undefined ? body.body?.toString().trim() : undefined;
  const topicId =
    body.topicId !== undefined
      ? body.topicId?.toString().trim() || null
      : undefined;

  if (name !== undefined && (name.length < 2 || name.length > 80)) {
    return NextResponse.json(
      { error: "نام پرامپت باید بین ۲ تا ۸۰ کاراکتر باشد" },
      { status: 400 },
    );
  }
  if (promptBody !== undefined && promptBody.length < 20) {
    return NextResponse.json(
      { error: "متن پرامپت خیلی کوتاه است" },
      { status: 400 },
    );
  }

  if (topicId) {
    const topic = await getTopicIfAccessible(topicId, auth.user.id);
    if (!topic) {
      return NextResponse.json({ error: "موضوع پیدا نشد" }, { status: 404 });
    }
  }

  const updated = await prisma.masterPrompt.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(promptBody !== undefined ? { body: promptBody } : {}),
      ...(topicId !== undefined ? { topicId } : {}),
    },
    include: { topic: { select: { id: true, titleEn: true, titleFa: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const existing = await owned(params.id, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "پیدا نشد" }, { status: 404 });
  }

  await prisma.masterPrompt.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
