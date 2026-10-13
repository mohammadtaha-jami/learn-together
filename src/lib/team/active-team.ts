import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACTIVE_TEAM_COOKIE = "lt_active_team";
const MAX_AGE = 60 * 60 * 24 * 365;

export async function resolveActiveTeamId(userId: string): Promise<string | null> {
  const jar = cookies();
  const fromCookie = jar.get(ACTIVE_TEAM_COOKIE)?.value;

  if (fromCookie) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: fromCookie } },
    });
    if (member) return fromCookie;
  }

  const first = await prisma.teamMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { teamId: true },
  });
  return first?.teamId ?? null;
}

export function setActiveTeamCookie(teamId: string) {
  cookies().set(ACTIVE_TEAM_COOKIE, teamId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
  });
}

export function clearActiveTeamCookie() {
  cookies().delete(ACTIVE_TEAM_COOKIE);
}
