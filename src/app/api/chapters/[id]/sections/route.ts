import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id: chapterId } = params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
  });
  if (!chapter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const topic = await getTopicIfAccessible(chapter.topicId, auth.user.id);
  if (!topic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const titleEn = body.titleEn?.toString().trim();
  if (!titleEn) {
    return NextResponse.json({ error: "titleEn الزامی است" }, { status: 400 });
  }

  const parentId = body.parentId?.toString() || null;
  if (parentId) {
    const parent = await prisma.section.findFirst({
      where: { id: parentId, chapterId },
    });
    if (!parent) {
      return NextResponse.json({ error: "والد نامعتبر" }, { status: 400 });
    }
  }

  const maxOrder = await prisma.section.aggregate({
    where: { chapterId, parentId },
    _max: { sortOrder: true },
  });

  const section = await prisma.section.create({
    data: {
      chapterId,
      parentId,
      titleEn,
      titleFa: body.titleFa?.toString().trim() || null,
      sortOrder: body.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
