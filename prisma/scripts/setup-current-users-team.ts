/**
 * تیم seed (FSA26) + موضوع کتاب + عضویت دو کاربر واقعی فعلی
 * اجرا: npx tsx prisma/scripts/setup-current-users-team.ts
 */
import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./load-env";
import {
  enrollUsersInTeam,
  seedBookTopic,
} from "./seed-book-topic";

loadEnv();

const prisma = new PrismaClient();
const SYSTEM_EMAIL = "system@learn-together.local";

async function main() {
  const inviteCode = (process.env.SEED_TEAM_INVITE_CODE || "FSA26").toUpperCase();

  let team = await prisma.team.findUnique({ where: { inviteCode } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: "تیم یادگیری", inviteCode },
    });
    console.log("Created team", team.name, inviteCode);
  } else {
    console.log("Using team", team.name, inviteCode);
  }

  const users = await prisma.user.findMany({
    where: { email: { not: SYSTEM_EMAIL } },
    orderBy: { createdAt: "asc" },
    take: 2,
    select: { id: true, email: true, name: true },
  });

  if (users.length === 0) {
    console.error("No registered users found. Register at /register first.");
    process.exit(1);
  }

  console.log("Enrolling users:");
  users.forEach((u) => console.log(" -", u.name, u.email));

  await enrollUsersInTeam(
    prisma,
    team.id,
    users.map((u) => u.id),
  );

  const ownerId = users[0].id;
  const topic = await seedBookTopic(prisma, team.id, ownerId);

  const chapterCount = await prisma.chapter.count({
    where: { topicId: topic.id },
  });

  console.log("\nDone.");
  console.log("Team invite:", inviteCode);
  console.log("Topic:", topic.titleEn, `(${chapterCount} chapters)`);
  console.log("Owner:", users[0].email);
  if (users[1]) console.log("Member:", users[1].email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
