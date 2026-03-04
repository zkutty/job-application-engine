PRAGMA foreign_keys=OFF;

ALTER TABLE "Job" ADD COLUMN "rawJdInput" TEXT;
ALTER TABLE "Job" ADD COLUMN "jdSummary" TEXT;
ALTER TABLE "Job" ADD COLUMN "jdInsightsJson" TEXT;

UPDATE "Job"
SET "jdSummary" = "jdText"
WHERE "jdSummary" IS NULL;

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
