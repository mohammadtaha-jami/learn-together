import type { ProgressStatus, TeamRole, TopicScope } from "@prisma/client";
import { canDeleteTopic } from "@/lib/learning/topic-access";
import { prisma } from "@/lib/prisma";
import { getLeafSections } from "@/lib/learning/section-tree";

export type TopicSummary = {
  id: string;
  titleEn: string;
  titleFa: string | null;
  description: string | null;
  scope: TopicScope;
  teamId: string | null;
  teamName: string | null;
  chapterCount: number;
  total: number;
  done: number;
  inProgress: number;
  percent: number;
  canDelete: boolean;
};

export type TodayItem = {
  sectionId: string;
  titleEn: string;
  titleFa: string | null;
  parentTitle: string | null;
  chapterId: string;
  chapterNumber: string | null;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  status: ProgressStatus;
};

export type Overview = {
  stats: {
    percent: number;
    total: number;
    done: number;
    inProgress: number;
    doneToday: number;
    streak: number;
  };
  topics: TopicSummary[];
  today: TodayItem[];
  week: { key: string; label: string; count: number; isToday: boolean }[];
  team: {
    id: string;
    name: string;
    inviteCode: string;
    members: { id: string; name: string; percent: number; isMe: boolean }[];
  } | null;
};

// index = getUTCDay() of a local date key
const WEEKDAYS = ["ی", "د", "س", "چ", "پ", "ج", "ش"];

function dayKey(date: Date, tzOffset: number) {
  return new Date(date.getTime() - tzOffset * 60_000).toISOString().slice(0, 10);
}

async function loadTopics(
  userId: string,
  scope?: TopicScope | null,
  teamId?: string | null,
) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);

  const teamTopicWhere =
    scope === "TEAM" && teamId
      ? { scope: "TEAM" as const, teamId }
      : { scope: "TEAM" as const, teamId: { in: teamIds } };

  return prisma.topic.findMany({
    where: {
      AND: [
        scope ? { scope } : {},
        {
          OR: [
            { scope: "PERSONAL", ownerId: userId },
            ...(teamIds.length ? [teamTopicWhere] : []),
          ],
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      team: { select: { name: true } },
      chapters: {
        orderBy: { sortOrder: "asc" },
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              parentId: true,
              sortOrder: true,
              titleEn: true,
              titleFa: true,
              chapterId: true,
            },
          },
        },
      },
    },
  });
}

type LoadedTopic = Awaited<ReturnType<typeof loadTopics>>[number];

function leavesOf(topic: LoadedTopic) {
  return topic.chapters.flatMap((c) =>
    getLeafSections(c.sections).map((l) => ({ ...l, chapter: c })),
  );
}

export async function getTopicSummaries(
  userId: string,
  scope?: TopicScope | null,
  teamId?: string | null,
): Promise<TopicSummary[]> {
  const topics = await loadTopics(userId, scope, teamId);
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true, role: true },
  });
  const roleByTeam = new Map<string, TeamRole>(
    memberships.map((m) => [m.teamId, m.role]),
  );
  const leafIds = topics.flatMap((t) => leavesOf(t).map((l) => l.id));
  const progress = await prisma.progress.findMany({
    where: { userId, sectionId: { in: leafIds } },
    select: { sectionId: true, status: true },
  });
  const statusById = new Map(progress.map((p) => [p.sectionId, p.status]));

  return topics.map((t) => summarize(t, statusById, userId, roleByTeam));
}

function summarize(
  t: LoadedTopic,
  statusById: Map<string, ProgressStatus>,
  userId: string,
  roleByTeam: Map<string, TeamRole>,
): TopicSummary {
  const leaves = leavesOf(t);
  let done = 0;
  let inProgress = 0;
  for (const l of leaves) {
    const s = statusById.get(l.id);
    if (s === "DONE") done++;
    else if (s === "IN_PROGRESS") inProgress++;
  }
  return {
    id: t.id,
    titleEn: t.titleEn,
    titleFa: t.titleFa,
    description: t.description,
    scope: t.scope,
    teamId: t.teamId,
    teamName: t.team?.name ?? null,
    chapterCount: t.chapters.length,
    total: leaves.length,
    done,
    inProgress,
    percent: leaves.length ? Math.round((done / leaves.length) * 100) : 0,
    canDelete: canDeleteTopic(
      t,
      userId,
      t.teamId ? roleByTeam.get(t.teamId) : null,
    ),
  };
}

export async function buildOverview(
  userId: string,
  tzOffset: number,
  activeTeamId?: string | null,
): Promise<Overview> {
  const topics = await loadTopics(userId);
  const leafIds = topics.flatMap((t) => leavesOf(t).map((l) => l.id));

  const since = new Date(Date.now() - 60 * 86_400_000);
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true, role: true },
  });
  const roleByTeam = new Map<string, TeamRole>(
    memberships.map((m) => [m.teamId, m.role]),
  );

  const [progress, doneRecent, membership] = await Promise.all([
    prisma.progress.findMany({
      where: { userId, sectionId: { in: leafIds } },
      select: { sectionId: true, status: true },
    }),
    prisma.progress.findMany({
      where: { userId, status: "DONE", completedAt: { gte: since } },
      select: { completedAt: true },
    }),
    activeTeamId
      ? prisma.teamMember.findUnique({
          where: { userId_teamId: { userId, teamId: activeTeamId } },
          include: {
            team: {
              include: { members: { include: { user: { select: { id: true, name: true } } } } },
            },
          },
        })
      : prisma.teamMember.findFirst({
          where: { userId },
          orderBy: { joinedAt: "asc" },
          include: {
            team: {
              include: { members: { include: { user: { select: { id: true, name: true } } } } },
            },
          },
        }),
  ]);

  const statusById = new Map(progress.map((p) => [p.sectionId, p.status]));
  const summaries = topics.map((t) => summarize(t, statusById, userId, roleByTeam));

  const total = summaries.reduce((a, s) => a + s.total, 0);
  const done = summaries.reduce((a, s) => a + s.done, 0);
  const inProgress = summaries.reduce((a, s) => a + s.inProgress, 0);

  // Days
  const counts = new Map<string, number>();
  for (const r of doneRecent) {
    if (!r.completedAt) continue;
    const k = dayKey(r.completedAt, tzOffset);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const now = new Date();
  const todayKey = dayKey(now, tzOffset);
  const keyAgo = (n: number) => dayKey(new Date(now.getTime() - n * 86_400_000), tzOffset);

  const week = Array.from({ length: 7 }, (_, i) => {
    const key = keyAgo(6 - i);
    const dow = new Date(key + "T00:00:00Z").getUTCDay();
    return {
      key,
      label: WEEKDAYS[dow],
      count: counts.get(key) ?? 0,
      isToday: key === todayKey,
    };
  });

  let streak = 0;
  let start = counts.get(todayKey) ? 0 : 1;
  while (start < 60 && counts.get(keyAgo(start))) {
    streak++;
    start++;
  }

  // Today's reading: in-progress first, then the next not-started ones
  const today: TodayItem[] = [];
  for (const t of topics) {
    const leaves = leavesOf(t);
    const byId = new Map(t.chapters.flatMap((c) => c.sections).map((s) => [s.id, s]));
    const pick = [
      ...leaves.filter((l) => statusById.get(l.id) === "IN_PROGRESS"),
      ...leaves.filter((l) => !statusById.get(l.id) || statusById.get(l.id) === "NOT_STARTED"),
    ].slice(0, 3);
    for (const l of pick) {
      const parent = l.parentId ? byId.get(l.parentId) : null;
      today.push({
        sectionId: l.id,
        titleEn: l.titleEn,
        titleFa: l.titleFa,
        parentTitle: parent ? parent.titleFa?.trim() || parent.titleEn : null,
        chapterId: l.chapter.id,
        chapterNumber: l.chapter.number,
        chapterTitle: l.chapter.titleFa?.trim() || l.chapter.titleEn,
        topicId: t.id,
        topicTitle: t.titleFa?.trim() || t.titleEn,
        status: statusById.get(l.id) ?? "NOT_STARTED",
      });
    }
  }

  // Team
  let team: Overview["team"] = null;
  if (membership?.team) {
    const teamTopics = topics.filter((t) => t.teamId === membership.teamId);
    const teamLeaves = teamTopics.flatMap((t) => leavesOf(t).map((l) => l.id));
    const grouped = teamLeaves.length
      ? await prisma.progress.groupBy({
          by: ["userId"],
          where: { sectionId: { in: teamLeaves }, status: "DONE" },
          _count: { _all: true },
        })
      : [];
    const doneBy = new Map(grouped.map((g) => [g.userId, g._count._all]));
    team = {
      id: membership.team.id,
      name: membership.team.name,
      inviteCode: membership.team.inviteCode,
      members: membership.team.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        isMe: m.user.id === userId,
        percent: teamLeaves.length
          ? Math.round(((doneBy.get(m.user.id) ?? 0) / teamLeaves.length) * 100)
          : 0,
      })),
    };
  }

  return {
    stats: {
      percent: total ? Math.round((done / total) * 100) : 0,
      total,
      done,
      inProgress,
      doneToday: counts.get(todayKey) ?? 0,
      streak,
    },
    topics: summaries,
    today,
    week,
    team,
  };
}
