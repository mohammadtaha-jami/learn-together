import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveActiveTeamId, setActiveTeamCookie } from "@/lib/team/active-team";
import { generateInviteCode } from "@/lib/team/helpers";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const memberships = await prisma.teamMember.findMany({
    where: { userId: auth.user.id },
    include: {
      team: {
        include: {
          _count: { select: { members: true, topics: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const teams = memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    inviteCode: m.team.inviteCode,
    role: m.role,
    joinedAt: m.joinedAt,
    memberCount: m.team._count.members,
    topicCount: m.team._count.topics,
  }));

  const activeTeamId = await resolveActiveTeamId(auth.user.id);
  const active = teams.find((t) => t.id === activeTeamId) ?? null;

  return NextResponse.json({
    teams,
    activeTeamId,
    team: active,
    role: memberships.find((m) => m.teamId === activeTeamId)?.role ?? null,
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const name = body.name?.toString().trim() || "تیم یادگیری";

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.team.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const team = await prisma.team.create({
    data: {
      name,
      inviteCode,
      members: {
        create: {
          userId: auth.user.id,
          role: "OWNER",
        },
      },
    },
  });

  setActiveTeamCookie(team.id);

  return NextResponse.json(team, { status: 201 });
}
