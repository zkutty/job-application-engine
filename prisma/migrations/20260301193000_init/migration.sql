-- CreateTable
CREATE TABLE "Job" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "company" TEXT,
    "jdText" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'cover_letter',
    "content" TEXT NOT NULL,
    "jobId" INTEGER NOT NULL,
    CONSTRAINT "Artifact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Artifact_jobId_idx" ON "Artifact"("jobId");

-- CreateIndex
CREATE INDEX "Artifact_createdAt_idx" ON "Artifact"("createdAt");
