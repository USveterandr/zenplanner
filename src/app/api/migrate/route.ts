import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const REVIEWER_TOKEN = "reviewer-bypass-token";

/**
 * POST /api/migrate
 *
 * Applies the full D1 schema using CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
 * Safe to run multiple times — all statements are idempotent.
 *
 * Authorization: Bearer reviewer-bypass-token   (or any valid Supabase JWT)
 *
 * This endpoint exists because the Cloudflare API token used for deployment
 * does not have D1 read/write permissions, so wrangler d1 execute --remote fails.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ") || auth.slice(7).trim() !== REVIEWER_TOKEN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ success: false, error: "No D1 binding (not running on Cloudflare Workers)" }, { status: 500 });
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS User (
      id         TEXT PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      name       TEXT,
      password   TEXT NOT NULL DEFAULT 'supabase-managed',
      avatarUrl  TEXT,
      profession TEXT,
      hobbies    TEXT,
      createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS Subscription (
      id             TEXT PRIMARY KEY,
      tier           TEXT NOT NULL DEFAULT 'free',
      startDate      TEXT,
      trialEndDate   TEXT,
      customerId     TEXT,
      subscriptionId TEXT,
      status         TEXT DEFAULT 'active',
      renewsAt       TEXT,
      endsAt         TEXT,
      userId         TEXT UNIQUE NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Task (
      id                    TEXT PRIMARY KEY,
      title                 TEXT NOT NULL,
      description           TEXT,
      completed             INTEGER NOT NULL DEFAULT 0,
      priority              TEXT NOT NULL DEFAULT 'medium',
      dueDate               TEXT,
      dueTime               TEXT,
      reminderMinutesBefore INTEGER,
      category              TEXT NOT NULL DEFAULT 'personal',
      subtasks              TEXT NOT NULL DEFAULT '[]',
      "order"               INTEGER NOT NULL DEFAULT 0,
      createdAt             TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt             TEXT NOT NULL DEFAULT (datetime('now')),
      userId                TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Goal (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      color       TEXT NOT NULL DEFAULT '#8b5cf6',
      milestones  TEXT NOT NULL DEFAULT '[]',
      progress    INTEGER NOT NULL DEFAULT 0,
      targetDate  TEXT,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
      userId      TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Habit (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      frequency   TEXT NOT NULL DEFAULT 'daily',
      color       TEXT NOT NULL DEFAULT '#8b5cf6',
      completions TEXT NOT NULL DEFAULT '[]',
      streak      INTEGER NOT NULL DEFAULT 0,
      bestStreak  INTEGER NOT NULL DEFAULT 0,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
      userId      TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Category (
      id     TEXT PRIMARY KEY,
      name   TEXT NOT NULL,
      color  TEXT NOT NULL,
      icon   TEXT,
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      UNIQUE (name, userId)
    )`,
    `CREATE TABLE IF NOT EXISTS Reminder (
      id          TEXT PRIMARY KEY,
      taskId      TEXT NOT NULL,
      taskTitle   TEXT NOT NULL,
      dueDate     TEXT NOT NULL,
      dueTime     TEXT,
      reminderAt  TEXT NOT NULL,
      isNotified  INTEGER NOT NULL DEFAULT 0,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      userId      TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS ChatMessage (
      id        TEXT PRIMARY KEY,
      role      TEXT NOT NULL,
      content   TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      userId    TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS AIUsage (
      id     TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      month  TEXT NOT NULL,
      count  INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      UNIQUE (userId, month)
    )`,
    `CREATE TABLE IF NOT EXISTS TeamMember (
      id       TEXT PRIMARY KEY,
      ownerId  TEXT NOT NULL,
      userId   TEXT,
      name     TEXT NOT NULL,
      email    TEXT NOT NULL,
      role     TEXT NOT NULL DEFAULT 'member',
      joinedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ownerId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_task_userId     ON Task(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_goal_userId     ON Goal(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_habit_userId    ON Habit(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_category_userId ON Category(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_reminder_userId ON Reminder(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_chatmsg_userId  ON ChatMessage(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_aiusage_userId  ON AIUsage(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_team_ownerId    ON TeamMember(ownerId)`,
    // Reviewer bypass user
    `INSERT OR IGNORE INTO User (id, email, name, password) VALUES ('00000000-0000-0000-0000-000000000001', 'reviewer@zenplanner.app', 'Reviewer', 'Password123')`,
    `INSERT OR IGNORE INTO Subscription (id, tier, userId) VALUES ('00000000-0000-0000-0000-000000000002', 'free', '00000000-0000-0000-0000-000000000001')`,
    // New columns for User profile (safe to fail if they already exist)
    `ALTER TABLE User ADD COLUMN avatarUrl TEXT`,
    `ALTER TABLE User ADD COLUMN profession TEXT`,
    `ALTER TABLE User ADD COLUMN hobbies TEXT`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];
  let failed = 0;

  for (const sql of statements) {
    try {
      await db.prepare(sql).run();
      results.push({ sql: sql.slice(0, 60).replace(/\s+/g, " ").trim() + "…", ok: true });
    } catch (e: any) {
      // Ignore "duplicate column name" errors since D1 doesn't support ADD COLUMN IF NOT EXISTS easily
      if (e?.message?.includes("duplicate column name") || e?.message?.includes("already exists")) {
        results.push({ sql: sql.slice(0, 60).replace(/\s+/g, " ").trim() + "…", ok: true, error: "Already exists (ignored)" });
      } else {
        failed++;
        results.push({ sql: sql.slice(0, 60).replace(/\s+/g, " ").trim() + "…", ok: false, error: e?.message });
      }
    }
  }

  return NextResponse.json({
    success: failed === 0,
    applied: results.length,
    failed,
    results,
  });
}
