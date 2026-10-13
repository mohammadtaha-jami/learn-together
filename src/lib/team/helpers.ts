import { prisma } from "@/lib/prisma";

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

export async function getPrimaryTeamForUser(userId: string) {
  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    include: { team: true },
    orderBy: { joinedAt: "asc" },
  });
  return membership?.team ?? null;
}

export async function getUserTeamMembership(userId: string, teamId: string) {
  return prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
}
