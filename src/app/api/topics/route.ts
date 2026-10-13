import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { validateTopicPayload } from "@/lib/learning/topic-access";
import { getTopicSummaries } from "@/lib/learning/overview";
import type { TopicScope } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") as TopicScope | null;
  const teamId = searchParams.get("teamId");

  if (scope === "TEAM" && teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: auth.user.id, teamId } },
    });
    if (!member) {
      return NextResponse.json({ error: "عضو این تیم نیستید" }, { status: 403 });
    }
  }

  return NextResponse.json(await getTopicSummaries(auth.user.id, scope, teamId));
}
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = await request.json();
  const scope = body.scope as TopicScope;
  const titleEn = body.titleEn?.toString().trim();
  const titleFa = body.titleFa?.toString().trim() || null;
  const description = body.description?.toString().trim() || null;
  const teamId = body.teamId?.toString() || null;

  if (!titleEn || !scope) {
    return NextResponse.json({ error: "عنوان و نوع الزامی است" }, { status: 400 });
  }

  const validation = validateTopicPayload(scope, teamId);
  if (validation) {
    return NextResponse.json({ error: validation }, { status: 400 });
  }

  if (scope === "TEAM" && teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
    });
    if (!member) {
      return NextResponse.json({ error: "عضو تیم نیستید" }, { status: 403 });
    }
  }

  const topic = await prisma.topic.create({
    data: {
      scope,
      titleEn,
      titleFa,
      description,
      ownerId: user.id,
      teamId: scope === "TEAM" ? teamId : null,
    },
  });

  return NextResponse.json(topic, { status: 201 });
}
