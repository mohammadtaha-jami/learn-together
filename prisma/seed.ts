import { PrismaClient } from "@prisma/client";
import {
  ensureSystemOwner,
  enrollUsersInTeam,
  seedBookTopic,
} from "./scripts/seed-book-topic";

const prisma = new PrismaClient();
const SYSTEM_EMAIL = "system@learn-together.local";

async function main() {
  const inviteCode = (process.env.SEED_TEAM_INVITE_CODE || "FSA26").toUpperCase();

  let team = await prisma.team.findUnique({ where: { inviteCode } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: "تیم یادگیری", inviteCode },
    });
    console.log(`Created team invite: ${inviteCode}`);
  } else {
    console.log(`Team exists invite: ${inviteCode}`);
  }

  const realUsers = await prisma.user.findMany({
    where: { email: { not: SYSTEM_EMAIL } },
    orderBy: { createdAt: "asc" },
    take: 2,
  });

  let ownerId: string;
  if (realUsers.length > 0) {
    await enrollUsersInTeam(
      prisma,
      team.id,
      realUsers.map((u) => u.id),
    );
    ownerId = realUsers[0].id;
    console.log(`Enrolled ${realUsers.length} user(s) in team.`);
  } else {
    const systemUser = await ensureSystemOwner(prisma);
    ownerId = systemUser.id;
  }

  const topic = await seedBookTopic(prisma, team.id, ownerId);
  const chapters = await prisma.chapter.count({ where: { topicId: topic.id } });
  console.log(`Topic "${topic.titleEn}" — ${chapters} chapters.`);
  console.log(`Join with invite: ${inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
