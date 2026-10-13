-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- Backfill name for any null rows before NOT NULL
UPDATE "User" SET "name" = split_part("email", '@', 1) WHERE "name" IS NULL;
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN "note" TEXT;
ALTER TABLE "Progress" ADD COLUMN "completedAt" TIMESTAMP(3);
