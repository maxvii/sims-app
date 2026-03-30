-- AlterTable: make fields nullable and add new columns
ALTER TABLE "Event" ALTER COLUMN "opportunityType" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "postConcept" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "visualDirection" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "captionDirection" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "platforms" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "creativeBriefDue" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "creativeDue" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

-- Add new columns
ALTER TABLE "Event" ADD COLUMN "category" TEXT;
ALTER TABLE "Event" ADD COLUMN "round1Due" TEXT;
ALTER TABLE "Event" ADD COLUMN "round2Due" TEXT;
ALTER TABLE "Event" ADD COLUMN "finalCreativeDue" TEXT;
