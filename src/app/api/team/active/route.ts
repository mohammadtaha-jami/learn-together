import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveActiveTeamId, setActiveTeamCookie } from "@/lib/team/active-team";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const teamId = (await request.json()).teamId?.toString();
  if (!teamId) {
    return NextResponse.json({ error: "teamId الزامی است" }, { status: 400 });
  }

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: auth.user.id, teamId } },
    include: { team: true },
  });
  if (!member) {
    return NextResponse.json({ error: "عضو این تیم نیستید" }, { status: 403 });
  }

  setActiveTeamCookie(teamId);
  return NextResponse.json({
    activeTeamId: teamId,
    team: member.team,
    role: member.role,
  });
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const activeTeamId = await resolveActiveTeamId(auth.user.id);
  return NextResponse.json({ activeTeamId });
}
