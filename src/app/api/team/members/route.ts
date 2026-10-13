import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveActiveTeamId } from "@/lib/team/active-team";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const paramTeamId = new URL(request.url).searchParams.get("teamId");
  const teamId = paramTeamId || (await resolveActiveTeamId(auth.user.id));

  if (!teamId) {
    return NextResponse.json({ team: null, members: [] });
  }

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: auth.user.id, teamId } },
  });
  if (!member) {
    return NextResponse.json({ error: "عضو این تیم نیستید" }, { status: 403 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({
    team,
    members: members.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  });
}
