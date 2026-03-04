PRAGMA foreign_keys=OFF;

CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

INSERT INTO "User" ("id", "email", "passwordHash", "createdAt")
VALUES (1, 'legacy@local', 'legacy-account-reset-required', CURRENT_TIMESTAMP);

CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE "new_Job" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "company" TEXT,
    "jdText" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Job" ("id", "createdAt", "title", "company", "jdText", "userId")
SELECT "id", "createdAt", "title", "company", "jdText", 1 FROM "Job";

CREATE INDEX "Job_userId_idx" ON "new_Job"("userId");

CREATE TABLE "new_CandidateProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "skillsJson" TEXT NOT NULL,
    "voiceGuidelines" TEXT NOT NULL,
    "profileJson" TEXT,
    "rawResumeText" TEXT,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_CandidateProfile" (
    "id", "name", "headline", "summary", "skillsJson", "voiceGuidelines", "profileJson", "rawResumeText", "userId"
)
SELECT
    "id", "name", "headline", "summary", "skillsJson", "voiceGuidelines", "profileJson", "rawResumeText", 1
FROM "CandidateProfile";

CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "new_CandidateProfile"("userId");

CREATE TABLE "new_Story" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Story" ("id", "createdAt", "title", "situation", "action", "result", "tagsJson", "userId")
SELECT "id", "createdAt", "title", "situation", "action", "result", "tagsJson", 1 FROM "Story";

CREATE INDEX "Story_userId_idx" ON "new_Story"("userId");

DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";

DROP TABLE "CandidateProfile";
ALTER TABLE "new_CandidateProfile" RENAME TO "CandidateProfile";

DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
