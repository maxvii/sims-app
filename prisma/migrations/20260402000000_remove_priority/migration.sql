-- Remove priority column from Event table
ALTER TABLE "Event" DROP COLUMN IF EXISTS "priority";

-- Remove creativeDue column (redundant with finalCreativeDue)
ALTER TABLE "Event" DROP COLUMN IF EXISTS "creativeDue";
