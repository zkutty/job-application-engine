PRAGMA foreign_keys=OFF;

ALTER TABLE "Job" ADD COLUMN "applicationStage" TEXT NOT NULL DEFAULT 'exploring';

CREATE TABLE "JobNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stage" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobId" INTEGER NOT NULL,
    CONSTRAINT "JobNote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "JobNote_jobId_idx" ON "JobNote"("jobId");
CREATE INDEX "JobNote_createdAt_idx" ON "JobNote"("createdAt");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
