import type { PrismaClient } from "@prisma/client";
import { TeamRole } from "@prisma/client";

/** Remove user from team; promote owner or delete empty team. */
export async function leaveTeam(
  prisma: PrismaClient,
  userId: string,
  teamId: string,
) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!membership) {
    return { ok: false as const, error: "عضو این تیم نیستید" };
  }

  const count = await prisma.teamMember.count({ where: { teamId } });

  if (count === 1) {
    await prisma.team.delete({ where: { id: teamId } });
    return { ok: true as const, teamDeleted: true };
  }

  if (membership.role === TeamRole.OWNER) {
    const successor = await prisma.teamMember.findFirst({
      where: { teamId, userId: { not: userId } },
      orderBy: { joinedAt: "asc" },
    });
    if (successor) {
      await prisma.teamMember.update({
        where: { id: successor.id },
        data: { role: TeamRole.OWNER },
      });
    }
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });

  return { ok: true as const, teamDeleted: false };
}
