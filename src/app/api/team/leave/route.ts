import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  clearActiveTeamCookie,
  resolveActiveTeamId,
  setActiveTeamCookie,
} from "@/lib/team/active-team";
import { leaveTeam } from "@/lib/team/leave-team";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const teamId = (await request.json()).teamId?.toString();
  if (!teamId) {
    return NextResponse.json({ error: "teamId الزامی است" }, { status: 400 });
  }

  const wasActive = (await resolveActiveTeamId(auth.user.id)) === teamId;
  const result = await leaveTeam(prisma, auth.user.id, teamId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  if (wasActive) {
    clearActiveTeamCookie();
    const nextId = await resolveActiveTeamId(auth.user.id);
    if (nextId) setActiveTeamCookie(nextId);
  }

  return NextResponse.json({ ok: true, teamDeleted: result.teamDeleted });
}
