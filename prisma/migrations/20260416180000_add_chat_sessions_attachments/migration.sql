-- ChatSession: one row per conversation, with auto-generated title
CREATE TABLE "ChatSession" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "title"         TEXT,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatSession_userId_lastMessageAt_idx"
  ON "ChatSession"("userId", "lastMessageAt");

ALTER TABLE "ChatSession"
  ADD CONSTRAINT "ChatSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ChatAttachment: media files linked to a chat message
CREATE TABLE "ChatAttachment" (
  "id"        TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "filename"  TEXT NOT NULL,
  "mimetype"  TEXT NOT NULL,
  "size"      INTEGER NOT NULL,
  "kind"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatAttachment_messageId_idx"
  ON "ChatAttachment"("messageId");

ALTER TABLE "ChatAttachment"
  ADD CONSTRAINT "ChatAttachment_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Additional indexes on ChatMessage for faster session + user lookups
CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_idx"
  ON "ChatMessage"("sessionId");

CREATE INDEX IF NOT EXISTS "ChatMessage_userId_createdAt_idx"
  ON "ChatMessage"("userId", "createdAt");
