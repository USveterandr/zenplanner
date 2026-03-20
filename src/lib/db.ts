import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * Get the Supabase service-role client for server-side database operations.
 * Bypasses RLS — all authorization is handled by our API routes.
 */
export function getDb() {
  return getSupabaseServiceClient();
}

const generateId = () => crypto.randomUUID();

// ── User functions ───────────────────────────────────────────────────────────

export async function createUser(email: string, name: string, password: string) {
  const db = getDb();
  const id = generateId();
  await db.from("User").insert({ id, email, name, password });

  // Check if this user qualifies as an early adopter (free forever)
  const { count } = await db.from("User").select("*", { count: "exact", head: true });
  const earlyAdopterLimit = parseInt(process.env.EARLY_ADOPTER_LIMIT || '30', 10);
  const isEarlyAdopter = (count ?? 0) <= earlyAdopterLimit;

  await db.from("Subscription").insert({ id: generateId(), tier: "free", isEarlyAdopter, userId: id });

  return { id, email, name };
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  const { data } = await db.from("User").select("*").eq("email", email).single();
  return data;
}

export async function getUserById(id: string) {
  const db = getDb();
  const { data } = await db.from("User").select("*").eq("id", id).single();
  return data;
}

// ── Task functions ───────────────────────────────────────────────────────────

export async function getTasks(userId: string) {
  const db = getDb();
  const { data } = await db
    .from("Task")
    .select("*")
    .eq("userId", userId)
    .order("order", { ascending: true });
  return data || [];
}

export async function createTask(userId: string, task: any) {
  const db = getDb();
  const id = generateId();
  await db.from("Task").insert({
    id,
    title: task.title,
    description: task.description || null,
    completed: task.completed || false,
    priority: task.priority || "medium",
    dueDate: task.dueDate || null,
    dueTime: task.dueTime || null,
    reminderMinutesBefore: task.reminderMinutesBefore || null,
    category: task.category || "personal",
    subtasks: task.subtasks || [],
    order: task.order || 0,
    userId,
  });
  return { id, ...task };
}

export async function updateTask(id: string, updates: any) {
  const db = getDb();
  const fields: Record<string, any> = {};

  if (updates.title !== undefined) fields.title = updates.title;
  if (updates.description !== undefined) fields.description = updates.description;
  if (updates.completed !== undefined) fields.completed = updates.completed;
  if (updates.priority !== undefined) fields.priority = updates.priority;
  if (updates.dueDate !== undefined) fields.dueDate = updates.dueDate;
  if (updates.dueTime !== undefined) fields.dueTime = updates.dueTime;
  if (updates.category !== undefined) fields.category = updates.category;
  if (updates.subtasks !== undefined) fields.subtasks = updates.subtasks;
  if (updates.order !== undefined) fields.order = updates.order;

  fields.updatedAt = new Date().toISOString();

  await db.from("Task").update(fields).eq("id", id);
}

export async function deleteTask(id: string) {
  const db = getDb();
  await db.from("Task").delete().eq("id", id);
}

// ── Goal functions ───────────────────────────────────────────────────────────

export async function getGoals(userId: string) {
  const db = getDb();
  const { data } = await db.from("Goal").select("*").eq("userId", userId);
  return data || [];
}

export async function createGoal(userId: string, goal: any) {
  const db = getDb();
  const id = generateId();
  await db.from("Goal").insert({
    id,
    title: goal.title,
    description: goal.description || null,
    color: goal.color || "#8b5cf6",
    milestones: goal.milestones || [],
    progress: 0,
    targetDate: goal.targetDate || null,
    userId,
  });
  return { id, ...goal, progress: 0 };
}

export async function updateGoal(id: string, updates: any) {
  const db = getDb();
  const fields: Record<string, any> = {};

  if (updates.title !== undefined) fields.title = updates.title;
  if (updates.description !== undefined) fields.description = updates.description;
  if (updates.color !== undefined) fields.color = updates.color;
  if (updates.milestones !== undefined) fields.milestones = updates.milestones;
  if (updates.progress !== undefined) fields.progress = updates.progress;
  if (updates.targetDate !== undefined) fields.targetDate = updates.targetDate;

  fields.updatedAt = new Date().toISOString();

  await db.from("Goal").update(fields).eq("id", id);
}

export async function deleteGoal(id: string) {
  const db = getDb();
  await db.from("Goal").delete().eq("id", id);
}

// ── Habit functions ──────────────────────────────────────────────────────────

export async function getHabits(userId: string) {
  const db = getDb();
  const { data } = await db.from("Habit").select("*").eq("userId", userId);
  return data || [];
}

export async function createHabit(userId: string, habit: any) {
  const db = getDb();
  const id = generateId();
  await db.from("Habit").insert({
    id,
    title: habit.title,
    description: habit.description || null,
    frequency: habit.frequency || "daily",
    color: habit.color || "#8b5cf6",
    completions: [],
    streak: 0,
    bestStreak: 0,
    userId,
  });
  return { id, ...habit, completions: [], streak: 0, bestStreak: 0 };
}

export async function updateHabit(id: string, updates: any) {
  const db = getDb();
  const fields: Record<string, any> = {};

  if (updates.title !== undefined) fields.title = updates.title;
  if (updates.description !== undefined) fields.description = updates.description;
  if (updates.frequency !== undefined) fields.frequency = updates.frequency;
  if (updates.color !== undefined) fields.color = updates.color;
  if (updates.completions !== undefined) fields.completions = updates.completions;
  if (updates.streak !== undefined) fields.streak = updates.streak;
  if (updates.bestStreak !== undefined) fields.bestStreak = updates.bestStreak;

  fields.updatedAt = new Date().toISOString();

  await db.from("Habit").update(fields).eq("id", id);
}

export async function deleteHabit(id: string) {
  const db = getDb();
  await db.from("Habit").delete().eq("id", id);
}

// ── Category functions ───────────────────────────────────────────────────────

export async function getCategories(userId: string) {
  const db = getDb();
  const { data } = await db.from("Category").select("*").eq("userId", userId);
  return data || [];
}

export async function createCategory(userId: string, category: any) {
  const db = getDb();
  const id = generateId();
  await db.from("Category").insert({
    id,
    name: category.name,
    color: category.color,
    icon: category.icon || null,
    userId,
  });
  return { id, ...category };
}

// ── Reminder functions ───────────────────────────────────────────────────────

export async function getReminders(userId: string) {
  const db = getDb();
  const { data } = await db.from("Reminder").select("*").eq("userId", userId);
  return (data || []).map((row: any) => ({
    ...row,
    isNotified: Boolean(row.isNotified),
  }));
}

export async function createReminder(userId: string, reminder: any) {
  const db = getDb();
  const id = generateId();
  await db.from("Reminder").insert({
    id,
    taskId: reminder.taskId,
    taskTitle: reminder.taskTitle,
    dueDate: reminder.dueDate,
    dueTime: reminder.dueTime || null,
    reminderAt: reminder.reminderAt,
    isNotified: false,
    userId,
  });
  return { id, ...reminder, isNotified: false };
}

export async function deleteReminder(id: string) {
  const db = getDb();
  await db.from("Reminder").delete().eq("id", id);
}

// ── Chat message functions ───────────────────────────────────────────────────

export async function getChatMessages(userId: string) {
  const db = getDb();
  const { data } = await db
    .from("ChatMessage")
    .select("*")
    .eq("userId", userId)
    .order("timestamp", { ascending: true });
  return data || [];
}

export async function createChatMessage(userId: string, message: any) {
  const db = getDb();
  const id = generateId();
  await db.from("ChatMessage").insert({
    id,
    role: message.role,
    content: message.content,
    userId,
  });
  return { id, ...message, timestamp: new Date().toISOString() };
}

export async function clearChatMessages(userId: string) {
  const db = getDb();
  await db.from("ChatMessage").delete().eq("userId", userId);
}

// ── Subscription functions ───────────────────────────────────────────────────

export async function getSubscription(userId: string) {
  const db = getDb();
  const { data } = await db.from("Subscription").select("*").eq("userId", userId).single();
  return data;
}

export async function updateSubscription(userId: string, tier: string) {
  const db = getDb();
  await db.from("Subscription").update({ tier }).eq("userId", userId);
}

export async function updateSubscriptionDetails(userId: string, data: {
  customerId?: string;
  subscriptionId?: string;
  tier: string;
  status?: string;
  renewsAt?: string;
  endsAt?: string;
}) {
  const db = getDb();
  const fields: Record<string, any> = { tier: data.tier };

  if (data.customerId) fields.customerId = data.customerId;
  if (data.subscriptionId) fields.subscriptionId = data.subscriptionId;
  if (data.status) fields.status = data.status;
  if (data.renewsAt) fields.renewsAt = data.renewsAt;
  if (data.endsAt) fields.endsAt = data.endsAt;

  await db.from("Subscription").update(fields).eq("userId", userId);
}

// ── AI Usage functions ───────────────────────────────────────────────────────

export async function getAIUsage(userId: string, month: string) {
  const db = getDb();
  const { data } = await db
    .from("AIUsage")
    .select("*")
    .eq("userId", userId)
    .eq("month", month)
    .single();
  return data;
}

export async function incrementAIUsage(userId: string, month: string) {
  const db = getDb();
  const existing = await getAIUsage(userId, month);
  if (existing) {
    await db
      .from("AIUsage")
      .update({ count: existing.count + 1 })
      .eq("userId", userId)
      .eq("month", month);
  } else {
    await db.from("AIUsage").insert({
      id: generateId(),
      userId,
      month,
      count: 1,
    });
  }
}

// ── Team Member functions ────────────────────────────────────────────────────

export async function getTeamMembers(userId: string) {
  const db = getDb();
  const { data } = await db
    .from("TeamMember")
    .select("*")
    .or(`ownerId.eq.${userId},userId.eq.${userId}`)
    .order("joinedAt", { ascending: false });
  return data || [];
}

export async function addTeamMember(ownerId: string, member: { name: string; email: string; role: string }) {
  const db = getDb();
  const id = generateId();
  const joinedAt = new Date().toISOString();
  await db.from("TeamMember").insert({
    id,
    ownerId,
    name: member.name,
    email: member.email,
    role: member.role,
    joinedAt,
  });
  return { id, ...member, joinedAt };
}

export async function removeTeamMember(id: string) {
  const db = getDb();
  await db.from("TeamMember").delete().eq("id", id);
}

export async function updateTeamMember(id: string, updates: { name?: string; email?: string; role?: string }) {
  const db = getDb();
  const fields: Record<string, any> = {};

  if (updates.name) fields.name = updates.name;
  if (updates.email) fields.email = updates.email;
  if (updates.role) fields.role = updates.role;

  await db.from("TeamMember").update(fields).eq("id", id);
}

// ── Calendar Connection functions ─────────────────────────────────────────────────

export type CalendarProvider = 'google' | 'microsoft' | 'apple';

export interface CalendarConnection {
  id: string;
  userId: string;
  provider: CalendarProvider;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  calendarId?: string;
  calendarName?: string;
  isPrimary: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCalendarConnections(userId: string): Promise<CalendarConnection[]> {
  const db = getDb();
  const { data } = await db.from("CalendarConnection").select("*").eq("userId", userId);
  return data || [];
}

export async function getCalendarConnection(userId: string, provider: CalendarProvider): Promise<CalendarConnection | null> {
  const db = getDb();
  const { data } = await db.from("CalendarConnection").select("*").eq("userId", userId).eq("provider", provider).single();
  return data;
}

export async function createCalendarConnection(userId: string, connection: Omit<CalendarConnection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  const id = generateId();
  await db.from("CalendarConnection").insert({
    ...connection,
    id,
    userId,
  });
  return { id, ...connection };
}

export async function updateCalendarConnection(id: string, updates: Partial<Omit<CalendarConnection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = getDb();
  const fields: Record<string, any> = { ...updates, updatedAt: new Date().toISOString() };
  await db.from("CalendarConnection").update(fields).eq("id", id);
}

export async function deleteCalendarConnection(id: string) {
  const db = getDb();
  await db.from("CalendarConnection").delete().eq("id", id);
}

export async function deleteCalendarConnectionByProvider(userId: string, provider: CalendarProvider) {
  const db = getDb();
  await db.from("CalendarConnection").delete().eq("userId", userId).eq("provider", provider);
}
