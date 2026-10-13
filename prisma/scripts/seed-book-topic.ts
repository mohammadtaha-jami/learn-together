import { PrismaClient, TopicScope, TeamRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import {
  parseTopicImport,
  persistImportedTopic,
} from "../../src/lib/learning/topic-import";

const BOOK_TITLE = "Fundamentals of Software Architecture";

export async function seedBookTopic(
  prisma: PrismaClient,
  teamId: string,
  ownerId: string,
) {
  const existing = await prisma.topic.findFirst({
    where: {
      scope: TopicScope.TEAM,
      teamId,
      titleEn: BOOK_TITLE,
    },
  });
  if (existing) {
    return existing;
  }

  const jsonPath = path.join(
    process.cwd(),
    "prisma",
    "seed-data",
    "book-seed-data.json",
  );
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const parsed = parseTopicImport(raw, {
    titleEn: BOOK_TITLE,
    titleFa: "مبانی معماری نرم‌افزار",
    description: "Seed from book-seed-data.json",
  });

  return persistImportedTopic(prisma, {
    ownerId,
    scope: TopicScope.TEAM,
    teamId,
    meta: parsed.meta,
    parts: parsed.parts,
  });
}

export async function ensureSystemOwner(prisma: PrismaClient) {
  return prisma.user.upsert({
    where: { email: "system@learn-together.local" },
    create: {
      email: "system@learn-together.local",
      name: "System Seed",
      passwordHash: await bcrypt.hash("not-used-" + Date.now(), 12),
    },
    update: {},
  });
}

export async function enrollUsersInTeam(
  prisma: PrismaClient,
  teamId: string,
  userIds: string[],
) {
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    await prisma.teamMember.upsert({
      where: { userId_teamId: { userId, teamId } },
      create: {
        userId,
        teamId,
        role: i === 0 ? TeamRole.OWNER : TeamRole.MEMBER,
      },
      update: {},
    });
  }
}
