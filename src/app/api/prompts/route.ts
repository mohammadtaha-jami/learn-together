import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const prompts = await prisma.generatedPrompt.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      chapter: {
        select: { number: true, titleEn: true, titleFa: true },
      },
    },
  });

  return NextResponse.json(prompts);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const chapterId = body.chapterId?.toString();
  const sectionIds = body.sectionIds as string[];
  const emphasis = body.emphasis?.toString() || null;
  const content = body.content?.toString();
  const masterPromptId = body.masterPromptId?.toString() || null;

  if (!chapterId || !content || !Array.isArray(sectionIds) || sectionIds.length === 0) {
    return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const topic = await getTopicIfAccessible(chapter.topicId, auth.user.id);
  if (!topic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (masterPromptId) {
    const owned = await prisma.masterPrompt.findFirst({
      where: { id: masterPromptId, userId: auth.user.id },
    });
    if (!owned) {
      return NextResponse.json({ error: "پرامپت اصلی پیدا نشد" }, { status: 400 });
    }
  }

  const prompt = await prisma.generatedPrompt.create({
    data: {
      userId: auth.user.id,
      chapterId,
      masterPromptId,
      sectionIds,
      emphasis,
      content,
    },
  });

  return NextResponse.json(prompt, { status: 201 });
}
