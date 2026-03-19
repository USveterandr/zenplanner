-- ZenPlanner Supabase Postgres Schema
-- Run this in Supabase SQL Editor to create all tables
-- Migrated from D1/SQLite schema

CREATE TABLE IF NOT EXISTS "User" (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT,
  password   TEXT NOT NULL DEFAULT 'supabase-managed',
  "avatarUrl"  TEXT,
  profession TEXT,
  hobbies    TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  id               TEXT PRIMARY KEY,
  tier             TEXT NOT NULL DEFAULT 'free',
  "isEarlyAdopter" BOOLEAN NOT NULL DEFAULT FALSE,
  "startDate"      TIMESTAMPTZ,
  "trialEndDate"   TIMESTAMPTZ,
  "customerId"     TEXT,
  "subscriptionId" TEXT,
  status           TEXT DEFAULT 'active',
  "renewsAt"       TIMESTAMPTZ,
  "endsAt"         TIMESTAMPTZ,
  "userId"         TEXT UNIQUE NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Task" (
  id                      TEXT PRIMARY KEY,
  title                   TEXT NOT NULL,
  description             TEXT,
  completed               BOOLEAN NOT NULL DEFAULT FALSE,
  priority                TEXT NOT NULL DEFAULT 'medium',
  "dueDate"               TEXT,
  "dueTime"               TEXT,
  "reminderMinutesBefore" INTEGER,
  category                TEXT NOT NULL DEFAULT 'personal',
  subtasks                JSONB NOT NULL DEFAULT '[]'::jsonb,
  "order"                 INTEGER NOT NULL DEFAULT 0,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"                TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Goal" (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#8b5cf6',
  milestones  JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress    INTEGER NOT NULL DEFAULT 0,
  "targetDate"  TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"      TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Habit" (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  frequency   TEXT NOT NULL DEFAULT 'daily',
  color       TEXT NOT NULL DEFAULT '#8b5cf6',
  completions JSONB NOT NULL DEFAULT '[]'::jsonb,
  streak      INTEGER NOT NULL DEFAULT 0,
  "bestStreak"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"      TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Category" (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  color  TEXT NOT NULL,
  icon   TEXT,
  "userId" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE (name, "userId")
);

CREATE TABLE IF NOT EXISTS "Reminder" (
  id          TEXT PRIMARY KEY,
  "taskId"    TEXT NOT NULL,
  "taskTitle" TEXT NOT NULL,
  "dueDate"   TEXT NOT NULL,
  "dueTime"   TEXT,
  "reminderAt"  TEXT NOT NULL,
  "isNotified"  BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"      TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  id        TEXT PRIMARY KEY,
  role      TEXT NOT NULL,
  content   TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"  TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AIUsage" (
  id     TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  month  TEXT NOT NULL,
  count  INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE ("userId", month)
);

CREATE TABLE IF NOT EXISTS "TeamMember" (
  id        TEXT PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "userId"  TEXT,
  name      TEXT NOT NULL,
  email     TEXT NOT NULL,
  role      TEXT NOT NULL DEFAULT 'member',
  "joinedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("ownerId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_task_userId      ON "Task"("userId");
CREATE INDEX IF NOT EXISTS idx_goal_userId      ON "Goal"("userId");
CREATE INDEX IF NOT EXISTS idx_habit_userId     ON "Habit"("userId");
CREATE INDEX IF NOT EXISTS idx_category_userId  ON "Category"("userId");
CREATE INDEX IF NOT EXISTS idx_reminder_userId  ON "Reminder"("userId");
CREATE INDEX IF NOT EXISTS idx_chatmsg_userId   ON "ChatMessage"("userId");
CREATE INDEX IF NOT EXISTS idx_aiusage_userId   ON "AIUsage"("userId");
CREATE INDEX IF NOT EXISTS idx_team_ownerId     ON "TeamMember"("ownerId");

-- Reviewer bypass user (static account for testing — does not require Supabase auth)
INSERT INTO "User" (id, email, name, password)
VALUES ('00000000-0000-0000-0000-000000000001', 'reviewer@zenplanner.app', 'Reviewer', 'Password123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Subscription" (id, tier, "userId")
VALUES ('00000000-0000-0000-0000-000000000002', 'free', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
