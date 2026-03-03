import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  zen_planner_db: D1Database;
  zen_planner_storage: R2Bucket;
}

const generateId = () => crypto.randomUUID();

// User functions
export async function createUser(env: Env, email: string, name: string, password: string) {
  const id = generateId();
  await env.zen_planner_db.prepare(
    "INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)"
  ).bind(id, email, name, password).run();
  
  await env.zen_planner_db.prepare(
    "INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)"
  ).bind(generateId(), "free", id).run();
  
  return { id, email, name };
}

export async function getUserByEmail(env: Env, email: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM User WHERE email = ?"
  ).bind(email).first();
  return result;
}

export async function getUserById(env: Env, id: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM User WHERE id = ?"
  ).bind(id).first();
  return result;
}

// Task functions
export async function getTasks(env: Env, userId: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM Task WHERE userId = ? ORDER BY \"order\" ASC"
  ).bind(userId).all();
  return (result.results || []).map((row: any) => ({
    ...row,
    completed: Boolean(row.completed),
    subtasks: JSON.parse(row.subtasks || "[]"),
  }));
}

export async function createTask(env: Env, userId: string, task: any) {
  const id = generateId();
  await env.zen_planner_db.prepare(`
    INSERT INTO Task (id, title, description, completed, priority, dueDate, dueTime, reminderMinutesBefore, category, subtasks, \"order\", userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    task.title,
    task.description || null,
    task.completed ? 1 : 0,
    task.priority || "medium",
    task.dueDate || null,
    task.dueTime || null,
    task.reminderMinutesBefore || null,
    task.category || "personal",
    JSON.stringify(task.subtasks || []),
    task.order || 0,
    userId
  ).run();
  return { id, ...task };
}

export async function updateTask(env: Env, id: string, updates: any) {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.completed !== undefined) { fields.push("completed = ?"); values.push(updates.completed ? 1 : 0); }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority); }
  if (updates.dueDate !== undefined) { fields.push("dueDate = ?"); values.push(updates.dueDate); }
  if (updates.dueTime !== undefined) { fields.push("dueTime = ?"); values.push(updates.dueTime); }
  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
  if (updates.subtasks !== undefined) { fields.push("subtasks = ?"); values.push(JSON.stringify(updates.subtasks)); }
  if (updates.order !== undefined) { fields.push("\"order\" = ?"); values.push(updates.order); }
  
  fields.push("updatedAt = CURRENT_TIMESTAMP");
  values.push(id);
  
  await env.zen_planner_db.prepare(`UPDATE Task SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
}

export async function deleteTask(env: Env, id: string) {
  await env.zen_planner_db.prepare("DELETE FROM Task WHERE id = ?").bind(id).run();
}

// Goal functions
export async function getGoals(env: Env, userId: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM Goal WHERE userId = ?"
  ).bind(userId).all();
  return (result.results || []).map((row: any) => ({
    ...row,
    milestones: JSON.parse(row.milestones || "[]"),
  }));
}

export async function createGoal(env: Env, userId: string, goal: any) {
  const id = generateId();
  await env.zen_planner_db.prepare(`
    INSERT INTO Goal (id, title, description, color, milestones, progress, targetDate, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    goal.title,
    goal.description || null,
    goal.color || "#8b5cf6",
    JSON.stringify(goal.milestones || []),
    0,
    goal.targetDate || null,
    userId
  ).run();
  return { id, ...goal, progress: 0 };
}

export async function updateGoal(env: Env, id: string, updates: any) {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.color !== undefined) { fields.push("color = ?"); values.push(updates.color); }
  if (updates.milestones !== undefined) { fields.push("milestones = ?"); values.push(JSON.stringify(updates.milestones)); }
  if (updates.progress !== undefined) { fields.push("progress = ?"); values.push(updates.progress); }
  if (updates.targetDate !== undefined) { fields.push("targetDate = ?"); values.push(updates.targetDate); }
  
  fields.push("updatedAt = CURRENT_TIMESTAMP");
  values.push(id);
  
  await env.zen_planner_db.prepare(`UPDATE Goal SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
}

export async function deleteGoal(env: Env, id: string) {
  await env.zen_planner_db.prepare("DELETE FROM Goal WHERE id = ?").bind(id).run();
}

// Habit functions
export async function getHabits(env: Env, userId: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM Habit WHERE userId = ?"
  ).bind(userId).all();
  return (result.results || []).map((row: any) => ({
    ...row,
    completions: JSON.parse(row.completions || "[]"),
  }));
}

export async function createHabit(env: Env, userId: string, habit: any) {
  const id = generateId();
  await env.zen_planner_db.prepare(`
    INSERT INTO Habit (id, title, description, frequency, color, completions, streak, bestStreak, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    habit.title,
    habit.description || null,
    habit.frequency || "daily",
    habit.color || "#8b5cf6",
    "[]",
    0,
    0,
    userId
  ).run();
  return { id, ...habit, completions: [], streak: 0, bestStreak: 0 };
}

export async function updateHabit(env: Env, id: string, updates: any) {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.frequency !== undefined) { fields.push("frequency = ?"); values.push(updates.frequency); }
  if (updates.color !== undefined) { fields.push("color = ?"); values.push(updates.color); }
  if (updates.completions !== undefined) { fields.push("completions = ?"); values.push(JSON.stringify(updates.completions)); }
  if (updates.streak !== undefined) { fields.push("streak = ?"); values.push(updates.streak); }
  if (updates.bestStreak !== undefined) { fields.push("bestStreak = ?"); values.push(updates.bestStreak); }
  
  fields.push("updatedAt = CURRENT_TIMESTAMP");
  values.push(id);
  
  await env.zen_planner_db.prepare(`UPDATE Habit SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
}

export async function deleteHabit(env: Env, id: string) {
  await env.zen_planner_db.prepare("DELETE FROM Habit WHERE id = ?").bind(id).run();
}

// Category functions
export async function getCategories(env: Env, userId: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM Category WHERE userId = ?"
  ).bind(userId).all();
  return result.results || [];
}

export async function createCategory(env: Env, userId: string, category: any) {
  const id = generateId();
  await env.zen_planner_db.prepare(`
    INSERT INTO Category (id, name, color, icon, userId)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, category.name, category.color, category.icon || null, userId).run();
  return { id, ...category };
}

// Reminder functions
export async function getReminders(env: Env, userId: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM Reminder WHERE userId = ?"
  ).bind(userId).all();
  return (result.results || []).map((row: any) => ({
    ...row,
    isNotified: Boolean(row.isNotified),
  }));
}

export async function createReminder(env: Env, userId: string, reminder: any) {
  const id = generateId();
  await env.zen_planner_db.prepare(`
    INSERT INTO Reminder (id, taskId, taskTitle, dueDate, dueTime, reminderAt, isNotified, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    reminder.taskId,
    reminder.taskTitle,
    reminder.dueDate,
    reminder.dueTime || null,
    reminder.reminderAt,
    0,
    userId
  ).run();
  return { id, ...reminder, isNotified: false };
}

export async function deleteReminder(env: Env, id: string) {
  await env.zen_planner_db.prepare("DELETE FROM Reminder WHERE id = ?").bind(id).run();
}

// Chat message functions
export async function getChatMessages(env: Env, userId: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM ChatMessage WHERE userId = ? ORDER BY timestamp ASC"
  ).bind(userId).all();
  return (result.results || []).map((row: any) => ({
    ...row,
  }));
}

export async function createChatMessage(env: Env, userId: string, message: any) {
  const id = generateId();
  await env.zen_planner_db.prepare(`
    INSERT INTO ChatMessage (id, role, content, userId)
    VALUES (?, ?, ?, ?)
  `).bind(id, message.role, message.content, userId).run();
  return { id, ...message, timestamp: new Date().toISOString() };
}

export async function clearChatMessages(env: Env, userId: string) {
  await env.zen_planner_db.prepare("DELETE FROM ChatMessage WHERE userId = ?").bind(userId).run();
}

// Subscription functions
export async function getSubscription(env: Env, userId: string) {
  const result = await env.zen_planner_db.prepare(
    "SELECT * FROM Subscription WHERE userId = ?"
  ).bind(userId).first();
  return result;
}

export async function updateSubscription(env: Env, userId: string, tier: string) {
  await env.zen_planner_db.prepare(
    "UPDATE Subscription SET tier = ? WHERE userId = ?"
  ).bind(tier, userId).run();
}

// Storage functions for R2
export async function uploadFile(env: Env, key: string, body: ArrayBuffer, contentType: string) {
  await env.zen_planner_storage.put(key, body, { httpMetadata: { contentType } });
}

export async function getFile(env: Env, key: string) {
  return await env.zen_planner_storage.get(key);
}

export async function deleteFile(env: Env, key: string) {
  await env.zen_planner_storage.delete(key);
}
