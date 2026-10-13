import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { not: "system@learn-together.local" } },
    select: { id: true, email: true, name: true },
  });
  const teams = await prisma.team.findMany({
    include: {
      members: { include: { user: { select: { email: true, name: true } } } },
    },
  });
  const topics = await prisma.topic.findMany({
    where: { scope: "TEAM" },
    include: { _count: { select: { chapters: true } } },
  });
  console.log(JSON.stringify({ users, teams, topics }, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
