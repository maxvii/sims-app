-- AlterTable: Add tab field to Approval
ALTER TABLE "Approval" ADD COLUMN "tab" TEXT NOT NULL DEFAULT 'artwork';

-- AlterTable: Add tab field to Comment
ALTER TABLE "Comment" ADD COLUMN "tab" TEXT NOT NULL DEFAULT 'copywriting';

-- AlterTable: Add sessionId, toolName, toolResult to ChatMessage (if table exists)
-- ChatMessage is new, so create it
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolName" TEXT,
    "toolResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_userId_fkey') THEN
        ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
