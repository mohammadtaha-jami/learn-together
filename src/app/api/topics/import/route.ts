import { NextResponse } from "next/server";
import type { TopicScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { validateTopicPayload } from "@/lib/learning/topic-access";
import {
  ImportValidationError,
  parseTopicImport,
  persistImportedTopic,
} from "@/lib/learning/topic-import";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const scope = body.scope as TopicScope;
    const teamId = body.teamId?.toString() || null;
    const data = body.data;

    if (!scope || (scope !== "PERSONAL" && scope !== "TEAM")) {
      return NextResponse.json({ error: "نوع موضوع (scope) نامعتبر است" }, { status: 400 });
    }

    const validation = validateTopicPayload(scope, teamId);
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 });
    }

    if (scope === "TEAM" && teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: auth.user.id, teamId } },
      });
      if (!member) {
        return NextResponse.json({ error: "عضو تیم نیستید" }, { status: 403 });
      }
    }

    const parsed = parseTopicImport(data, {
      titleEn: body.titleEn?.toString(),
      titleFa: body.titleFa?.toString(),
      description: body.description?.toString(),
    });

    const topic = await persistImportedTopic(prisma, {
      ownerId: auth.user.id,
      scope,
      teamId,
      meta: parsed.meta,
      parts: parsed.parts,
    });

    return NextResponse.json(
      {
        topic,
        stats: parsed.stats,
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof ImportValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "خطای سرور هنگام import" }, { status: 500 });
  }
}
