-- CreateTable
CREATE TABLE "MasterPrompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterPrompt_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GeneratedPrompt" ADD COLUMN "masterPromptId" TEXT;

-- CreateIndex
CREATE INDEX "MasterPrompt_userId_idx" ON "MasterPrompt"("userId");
CREATE INDEX "MasterPrompt_topicId_idx" ON "MasterPrompt"("topicId");

-- AddForeignKey
ALTER TABLE "MasterPrompt" ADD CONSTRAINT "MasterPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasterPrompt" ADD CONSTRAINT "MasterPrompt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedPrompt" ADD CONSTRAINT "GeneratedPrompt_masterPromptId_fkey" FOREIGN KEY ("masterPromptId") REFERENCES "MasterPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
