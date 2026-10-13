import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getTopicIfAccessible } from "@/lib/learning/topic-access";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id: topicId } = params;

  const topic = await getTopicIfAccessible(topicId, auth.user.id);
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const titleEn = body.titleEn?.toString().trim();
  if (!titleEn) {
    return NextResponse.json({ error: "titleEn الزامی است" }, { status: 400 });
  }

  const maxOrder = await prisma.chapter.aggregate({
    where: { topicId },
    _max: { sortOrder: true },
  });

  const chapter = await prisma.chapter.create({
    data: {
      topicId,
      number: body.number?.toString() || null,
      titleEn,
      titleFa: body.titleFa?.toString().trim() || null,
      partLabel: body.partLabel?.toString() || null,
      sortOrder: body.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(chapter, { status: 201 });
}
