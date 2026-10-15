import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";
import { requireUser } from "@/lib/session";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const prompts = await prisma.masterPrompt.findMany({
    where: { userId: auth.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      topic: { select: { id: true, titleEn: true, titleFa: true } },
    },
  });

  return NextResponse.json(prompts);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const name = body.name?.toString().trim();
  const promptBody = body.body?.toString().trim();
  const topicId = body.topicId?.toString() || null;

  if (!name || name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "نام پرامپت باید بین ۲ تا ۸۰ کاراکتر باشد" },
      { status: 400 },
    );
  }
  if (!promptBody || promptBody.length < 20) {
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

  const created = await prisma.masterPrompt.create({
    data: {
      userId: auth.user.id,
      name,
      body: promptBody,
      topicId,
    },
    include: {
      topic: { select: { id: true, titleEn: true, titleFa: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
