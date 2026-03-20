import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

const REVIEWER_ID = "00000000-0000-0000-0000-000000000001";
const REVIEWER_TOKEN = "reviewer-bypass-token";
const EARLY_ADOPTER_LIMIT = parseInt(process.env.EARLY_ADOPTER_LIMIT || '30', 10);

function generateId() {
  return crypto.randomUUID();
}

/**
 * Verify the Bearer token from the Authorization header and return the
 * verified userId.  Returns null if the token is missing or invalid.
 */
async function verifyToken(request: Request): Promise<string | null> {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  // Reviewer bypass — static token, no Supabase lookup needed
  if (token === REVIEWER_TOKEN) return REVIEWER_ID;

  // Real Supabase JWT
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();

    const body = await request.json();
    const { action, type, data, id } = body as {
      userId?: string;
      action: string;
      type: string;
      data?: any;
      id?: string;
    };

    // Verify caller identity from the Authorization header
    const userId = await verifyToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }

    // Ensure the User row exists in Postgres. Google OAuth users may have a valid Supabase
    // JWT but no DB row if the OAuth callback failed or was skipped (e.g. PWA on iPhone).
    // We upsert here on every request so the app self-heals without requiring a re-login.
    const { data: existingUser } = await db.from("User").select("id").eq("id", userId).single();
    if (!existingUser) {
      // Fetch the user's email/name from Supabase so we can populate the row properly
      let email = `${userId}@unknown.local`;
      let name = "User";
      try {
        const supabase = getSupabaseClient();
        const auth = request.headers.get("Authorization") ?? "";
        const token = auth.slice(7).trim();
        if (token !== REVIEWER_TOKEN) {
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData.user) {
            email = userData.user.email || email;
            name = (userData.user.user_metadata?.full_name as string | undefined)
              || (userData.user.user_metadata?.name as string | undefined)
              || email.split("@")[0]
              || "User";
          }
        }
      } catch { /* ignore — will use fallback email/name */ }

      // Insert with ON CONFLICT DO NOTHING in case of race condition
      await db.from("User").upsert(
        { id: userId, email, name, password: "supabase-managed" },
        { onConflict: "id", ignoreDuplicates: true }
      );

      // Check if this user qualifies as an early adopter (first 30 users)
      const { count } = await db.from("User").select("*", { count: "exact", head: true });
      const isEarlyAdopter = (count ?? 0) <= EARLY_ADOPTER_LIMIT;

      await db.from("Subscription").upsert(
        { id: generateId(), tier: "free", isEarlyAdopter, userId },
        { onConflict: "userId", ignoreDuplicates: true }
      );
    }

    if (action === "get") {
      if (type === "tasks") {
        const { data: tasks } = await db.from("Task").select("*").eq("userId", userId).order("order", { ascending: true });
        return NextResponse.json({ success: true, data: tasks || [] });
      }
      if (type === "goals") {
        const { data: goals } = await db.from("Goal").select("*").eq("userId", userId);
        return NextResponse.json({ success: true, data: goals || [] });
      }
      if (type === "habits") {
        const { data: habits } = await db.from("Habit").select("*").eq("userId", userId);
        return NextResponse.json({ success: true, data: habits || [] });
      }
      if (type === "categories") {
        const { data: categories } = await db.from("Category").select("*").eq("userId", userId);
        return NextResponse.json({ success: true, data: categories || [] });
      }
      if (type === "reminders") {
        const { data: reminders } = await db.from("Reminder").select("*").eq("userId", userId);
        return NextResponse.json({ success: true, data: reminders || [] });
      }
      if (type === "chatMessages") {
        const { data: messages } = await db.from("ChatMessage").select("*").eq("userId", userId).order("timestamp", { ascending: true });
        return NextResponse.json({ success: true, data: messages || [] });
      }
      if (type === "subscription") {
        const { data: subscription } = await db.from("Subscription").select("*").eq("userId", userId).single();
        return NextResponse.json({ success: true, data: subscription || null });
      }
      if (type === "user_count") {
        const { count } = await db.from("User").select("*", { count: "exact", head: true });
        const totalUsers = count ?? 0;
        const spotsRemaining = Math.max(0, EARLY_ADOPTER_LIMIT - totalUsers);
        return NextResponse.json({ success: true, data: { totalUsers, earlyAdopterLimit: EARLY_ADOPTER_LIMIT, spotsRemaining } });
      }
    }

    if (action === "create") {
      if (type === "task") {
        const taskId = generateId();
        await db.from("Task").insert({
          id: taskId,
          title: data.title,
          description: data.description || null,
          completed: data.completed || false,
          priority: data.priority || "medium",
          dueDate: data.dueDate || null,
          dueTime: data.dueTime || null,
          reminderMinutesBefore: data.reminderMinutesBefore || null,
          category: data.category || "personal",
          subtasks: data.subtasks || [],
          order: data.order || 0,
          userId,
        });
        return NextResponse.json({ success: true, data: { id: taskId, ...data } });
      }
      if (type === "goal") {
        const goalId = generateId();
        await db.from("Goal").insert({
          id: goalId,
          title: data.title,
          description: data.description || null,
          color: data.color || "#8b5cf6",
          milestones: data.milestones || [],
          progress: 0,
          targetDate: data.targetDate || null,
          userId,
        });
        return NextResponse.json({ success: true, data: { id: goalId, ...data, progress: 0 } });
      }
      if (type === "habit") {
        const habitId = generateId();
        await db.from("Habit").insert({
          id: habitId,
          title: data.title,
          description: data.description || null,
          frequency: data.frequency || "daily",
          color: data.color || "#8b5cf6",
          completions: [],
          streak: 0,
          bestStreak: 0,
          userId,
        });
        return NextResponse.json({ success: true, data: { id: habitId, ...data, completions: [], streak: 0, bestStreak: 0 } });
      }
      if (type === "category") {
        const catId = generateId();
        await db.from("Category").insert({
          id: catId,
          name: data.name,
          color: data.color,
          icon: data.icon || null,
          userId,
        });
        return NextResponse.json({ success: true, data: { id: catId, ...data } });
      }
      if (type === "reminder") {
        const remId = generateId();
        await db.from("Reminder").insert({
          id: remId,
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          dueDate: data.dueDate,
          dueTime: data.dueTime || null,
          reminderAt: data.reminderAt,
          isNotified: false,
          userId,
        });
        return NextResponse.json({ success: true, data: { id: remId, ...data, isNotified: false } });
      }
      if (type === "chatMessage") {
        const msgId = generateId();
        await db.from("ChatMessage").insert({
          id: msgId,
          role: data.role,
          content: data.content,
          userId,
        });
        return NextResponse.json({ success: true, data: { id: msgId, ...data, timestamp: new Date().toISOString() } });
      }
    }

    if (action === "update") {
      // Subscription updates use userId, not id — handle before the id check
      if (type === "subscription") {
        await db.from("Subscription").update({ tier: data.tier }).eq("userId", userId);
        return NextResponse.json({ success: true });
      }

      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }

      if (type === "task") {
        const fields: Record<string, any> = {};
        if (data.title !== undefined) fields.title = data.title;
        if (data.description !== undefined) fields.description = data.description;
        if (data.completed !== undefined) fields.completed = data.completed;
        if (data.priority !== undefined) fields.priority = data.priority;
        if (data.dueDate !== undefined) fields.dueDate = data.dueDate;
        if (data.dueTime !== undefined) fields.dueTime = data.dueTime;
        if (data.reminderMinutesBefore !== undefined) fields.reminderMinutesBefore = data.reminderMinutesBefore;
        if (data.category !== undefined) fields.category = data.category;
        if (data.subtasks !== undefined) fields.subtasks = data.subtasks;
        if (data.order !== undefined) fields.order = data.order;

        if (Object.keys(fields).length > 0) {
          fields.updatedAt = new Date().toISOString();
          await db.from("Task").update(fields).eq("id", id).eq("userId", userId);
        }
        return NextResponse.json({ success: true });
      }
      if (type === "goal") {
        const fields: Record<string, any> = {};
        if (data.title !== undefined) fields.title = data.title;
        if (data.description !== undefined) fields.description = data.description;
        if (data.color !== undefined) fields.color = data.color;
        if (data.milestones !== undefined) fields.milestones = data.milestones;
        if (data.progress !== undefined) fields.progress = data.progress;
        if (data.targetDate !== undefined) fields.targetDate = data.targetDate;

        if (Object.keys(fields).length > 0) {
          fields.updatedAt = new Date().toISOString();
          await db.from("Goal").update(fields).eq("id", id).eq("userId", userId);
        }
        return NextResponse.json({ success: true });
      }
      if (type === "habit") {
        const fields: Record<string, any> = {};
        if (data.title !== undefined) fields.title = data.title;
        if (data.description !== undefined) fields.description = data.description;
        if (data.frequency !== undefined) fields.frequency = data.frequency;
        if (data.color !== undefined) fields.color = data.color;
        if (data.completions !== undefined) fields.completions = data.completions;
        if (data.streak !== undefined) fields.streak = data.streak;
        if (data.bestStreak !== undefined) fields.bestStreak = data.bestStreak;

        if (Object.keys(fields).length > 0) {
          fields.updatedAt = new Date().toISOString();
          await db.from("Habit").update(fields).eq("id", id).eq("userId", userId);
        }
        return NextResponse.json({ success: true });
      }
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }

      if (type === "task") {
        await db.from("Task").delete().eq("id", id).eq("userId", userId);
        return NextResponse.json({ success: true });
      }
      if (type === "goal") {
        await db.from("Goal").delete().eq("id", id).eq("userId", userId);
        return NextResponse.json({ success: true });
      }
      if (type === "habit") {
        await db.from("Habit").delete().eq("id", id).eq("userId", userId);
        return NextResponse.json({ success: true });
      }
      if (type === "reminder") {
        await db.from("Reminder").delete().eq("id", id).eq("userId", userId);
        return NextResponse.json({ success: true });
      }
      if (type === "chatMessages") {
        await db.from("ChatMessage").delete().eq("userId", userId);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action or type" }, { status: 400 });
  } catch (error: any) {
    console.error("Data API error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
