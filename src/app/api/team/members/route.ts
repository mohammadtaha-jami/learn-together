import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getPrimaryTeamForUser } from "@/lib/team/helpers";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const team = await getPrimaryTeamForUser(auth.user.id);
  if (!team) {
    return NextResponse.json({ members: [] });
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId: team.id },
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
