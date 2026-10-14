import { prisma } from "@/lib/prisma";
import type { TeamRole, Topic, TopicScope } from "@prisma/client";

export async function getTopicIfAccessible(topicId: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      team: { select: { name: true } },
      chapters: {
        orderBy: { sortOrder: "asc" },
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!topic) return null;
  const ok = await canAccessTopic(topic, userId);
  return ok ? topic : null;
}

export async function canAccessTopic(
  topic: Pick<Topic, "scope" | "ownerId" | "teamId">,
  userId: string,
) {
  if (topic.scope === "PERSONAL") {
    return topic.ownerId === userId;
  }
  if (!topic.teamId) return false;
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: topic.teamId } },
  });
  return !!member;
}

/** Personal: creator only. Team: topic creator or team OWNER. */
export function canDeleteTopic(
  topic: Pick<Topic, "scope" | "ownerId" | "teamId">,
  userId: string,
  teamRole: TeamRole | null | undefined,
) {
  if (topic.scope === "PERSONAL") {
    return topic.ownerId === userId;
  }
  if (topic.ownerId === userId) return true;
  return teamRole === "OWNER";
}

export async function resolveTeamRole(userId: string, teamId: string | null) {
  if (!teamId) return null;
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function canDeleteTopicForUser(
  topic: Pick<Topic, "scope" | "ownerId" | "teamId">,
  userId: string,
) {
  const teamRole = await resolveTeamRole(userId, topic.teamId);
  return canDeleteTopic(topic, userId, teamRole);
}

export function validateTopicPayload(scope: TopicScope, teamId: string | null) {
  if (scope === "TEAM" && !teamId) {
    return "برای موضوع تیمی باید تیم انتخاب شود";
  }
  if (scope === "PERSONAL" && teamId) {
    return "موضوع شخصی نباید teamId داشته باشد";
  }
  return null;
}
