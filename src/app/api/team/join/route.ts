import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { setActiveTeamCookie } from "@/lib/team/active-team";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const inviteCode = body.inviteCode?.toString().trim().toUpperCase();
  if (!inviteCode) {
    return NextResponse.json({ error: "کد دعوت الزامی است" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { inviteCode } });
  if (!team) {
    return NextResponse.json({ error: "کد دعوت نامعتبر است" }, { status: 404 });
  }

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: auth.user.id, teamId: team.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "قبلاً عضو این تیم هستید" }, { status: 400 });
  }

  await prisma.teamMember.create({
    data: {
      userId: auth.user.id,
      teamId: team.id,
      role: "MEMBER",
    },
  });

  setActiveTeamCookie(team.id);

  return NextResponse.json({ team });
}
