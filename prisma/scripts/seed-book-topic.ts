import { PrismaClient, TopicScope, TeamRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const BOOK_TITLE = "Fundamentals of Software Architecture";

type SeedSection = {
  title_en: string;
  title_fa?: string;
  subsections?: string[];
};

type SeedChapter = {
  number?: string;
  title_en: string;
  title_fa?: string;
  sections: SeedSection[];
};

type SeedPart = {
  part: string;
  chapters: SeedChapter[];
};

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

  const topic = await prisma.topic.create({
    data: {
      scope: TopicScope.TEAM,
      teamId,
      ownerId,
      titleEn: BOOK_TITLE,
      titleFa: "مبانی معماری نرم‌افزار",
      description: "Seed from book-seed-data.json",
    },
  });

  const jsonPath = path.join(
    process.cwd(),
    "prisma",
    "seed-data",
    "book-seed-data.json",
  );
  const parts = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as SeedPart[];

  let chapterOrder = 0;
  for (const part of parts) {
    for (const ch of part.chapters) {
      const chapter = await prisma.chapter.create({
        data: {
          topicId: topic.id,
          number: ch.number || null,
          titleEn: ch.title_en,
          titleFa: ch.title_fa?.trim() || null,
          partLabel: part.part,
          sortOrder: chapterOrder++,
        },
      });

      let sectionOrder = 0;
      for (const sec of ch.sections) {
        const parent = await prisma.section.create({
          data: {
            chapterId: chapter.id,
            titleEn: sec.title_en,
            titleFa: sec.title_fa?.trim() || null,
            sortOrder: sectionOrder++,
          },
        });

        if (sec.subsections?.length) {
          let subOrder = 0;
          for (const sub of sec.subsections) {
            await prisma.section.create({
              data: {
                chapterId: chapter.id,
                parentId: parent.id,
                titleEn: sub,
                sortOrder: subOrder++,
              },
            });
          }
        }
      }
    }
  }

  return topic;
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
    await prisma.teamMember.deleteMany({
      where: { userId, teamId: { not: teamId } },
    });
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
