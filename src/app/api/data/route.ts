import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function generateId() {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const env = getCloudflareContext().env;
    const db = env.zen_planner_db;
    
    const body = await request.json();
    const { userId, action, type, data, id } = body as {
      userId: string;
      action: string;
      type: string;
      data?: any;
      id?: string;
    };
    
    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    
    if (action === "get") {
      if (type === "tasks") {
        const tasks = await db.prepare("SELECT * FROM Task WHERE userId = ? ORDER BY \"order\" ASC").bind(userId).all();
        return NextResponse.json({ success: true, data: (tasks.results || []).map((t: any) => ({ ...t, completed: Boolean(t.completed), subtasks: JSON.parse(t.subtasks || "[]") })) });
      }
      if (type === "goals") {
        const goals = await db.prepare("SELECT * FROM Goal WHERE userId = ?").bind(userId).all();
        return NextResponse.json({ success: true, data: (goals.results || []).map((g: any) => ({ ...g, milestones: JSON.parse(g.milestones || "[]") })) });
      }
      if (type === "habits") {
        const habits = await db.prepare("SELECT * FROM Habit WHERE userId = ?").bind(userId).all();
        return NextResponse.json({ success: true, data: (habits.results || []).map((h: any) => ({ ...h, completions: JSON.parse(h.completions || "[]") })) });
      }
      if (type === "categories") {
        const categories = await db.prepare("SELECT * FROM Category WHERE userId = ?").bind(userId).all();
        return NextResponse.json({ success: true, data: categories.results || [] });
      }
      if (type === "reminders") {
        const reminders = await db.prepare("SELECT * FROM Reminder WHERE userId = ?").bind(userId).all();
        return NextResponse.json({ success: true, data: (reminders.results || []).map((r: any) => ({ ...r, isNotified: Boolean(r.isNotified) })) });
      }
      if (type === "chatMessages") {
        const messages = await db.prepare("SELECT * FROM ChatMessage WHERE userId = ? ORDER BY timestamp ASC").bind(userId).all();
        return NextResponse.json({ success: true, data: messages.results || [] });
      }
      if (type === "subscription") {
        const subscription = await db.prepare("SELECT * FROM Subscription WHERE userId = ?").bind(userId).first();
        return NextResponse.json({ success: true, data: subscription || null });
      }
    }
    
    if (action === "create") {
      if (type === "task") {
        const taskId = generateId();
        await db.prepare(
          `INSERT INTO Task (id, title, description, completed, priority, dueDate, dueTime, reminderMinutesBefore, category, subtasks, "order", userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(taskId, data.title, data.description || null, data.completed ? 1 : 0, data.priority || "medium", data.dueDate || null, data.dueTime || null, data.reminderMinutesBefore || null, data.category || "personal", JSON.stringify(data.subtasks || []), data.order || 0, userId).run();
        return NextResponse.json({ success: true, data: { id: taskId, ...data } });
      }
      if (type === "goal") {
        const goalId = generateId();
        await db.prepare(
          `INSERT INTO Goal (id, title, description, color, milestones, progress, targetDate, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(goalId, data.title, data.description || null, data.color || "#8b5cf6", JSON.stringify(data.milestones || []), 0, data.targetDate || null, userId).run();
        return NextResponse.json({ success: true, data: { id: goalId, ...data, progress: 0 } });
      }
      if (type === "habit") {
        const habitId = generateId();
        await db.prepare(
          `INSERT INTO Habit (id, title, description, frequency, color, completions, streak, bestStreak, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(habitId, data.title, data.description || null, data.frequency || "daily", data.color || "#8b5cf6", "[]", 0, 0, userId).run();
        return NextResponse.json({ success: true, data: { id: habitId, ...data, completions: [], streak: 0, bestStreak: 0 } });
      }
      if (type === "category") {
        const catId = generateId();
        await db.prepare(`INSERT INTO Category (id, name, color, icon, userId) VALUES (?, ?, ?, ?, ?)`).bind(catId, data.name, data.color, data.icon || null, userId).run();
        return NextResponse.json({ success: true, data: { id: catId, ...data } });
      }
      if (type === "reminder") {
        const remId = generateId();
        await db.prepare(
          `INSERT INTO Reminder (id, taskId, taskTitle, dueDate, dueTime, reminderAt, isNotified, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(remId, data.taskId, data.taskTitle, data.dueDate, data.dueTime || null, data.reminderAt, 0, userId).run();
        return NextResponse.json({ success: true, data: { id: remId, ...data, isNotified: false } });
      }
      if (type === "chatMessage") {
        const msgId = generateId();
        await db.prepare(`INSERT INTO ChatMessage (id, role, content, userId) VALUES (?, ?, ?, ?)`).bind(msgId, data.role, data.content, userId).run();
        return NextResponse.json({ success: true, data: { id: msgId, ...data, timestamp: new Date().toISOString() } });
      }
    }
    
    if (action === "update") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }
      
      if (type === "task") {
        const fields: string[] = [];
        const values: any[] = [];
        if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
        if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
        if (data.completed !== undefined) { fields.push("completed = ?"); values.push(data.completed ? 1 : 0); }
        if (data.priority !== undefined) { fields.push("priority = ?"); values.push(data.priority); }
        if (data.dueDate !== undefined) { fields.push("dueDate = ?"); values.push(data.dueDate); }
        if (data.dueTime !== undefined) { fields.push("dueTime = ?"); values.push(data.dueTime); }
        if (data.reminderMinutesBefore !== undefined) { fields.push("reminderMinutesBefore = ?"); values.push(data.reminderMinutesBefore); }
        if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
        if (data.subtasks !== undefined) { fields.push("subtasks = ?"); values.push(JSON.stringify(data.subtasks)); }
        if (data.order !== undefined) { fields.push("\"order\" = ?"); values.push(data.order); }
        
        if (fields.length > 0) {
          fields.push("updatedAt = CURRENT_TIMESTAMP");
          values.push(id);
          await db.prepare(`UPDATE Task SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
        }
        return NextResponse.json({ success: true });
      }
      if (type === "goal") {
        const fields: string[] = [];
        const values: any[] = [];
        if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
        if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
        if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
        if (data.milestones !== undefined) { fields.push("milestones = ?"); values.push(JSON.stringify(data.milestones)); }
        if (data.progress !== undefined) { fields.push("progress = ?"); values.push(data.progress); }
        if (data.targetDate !== undefined) { fields.push("targetDate = ?"); values.push(data.targetDate); }
        
        if (fields.length > 0) {
          fields.push("updatedAt = CURRENT_TIMESTAMP");
          values.push(id);
          await db.prepare(`UPDATE Goal SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
        }
        return NextResponse.json({ success: true });
      }
      if (type === "habit") {
        const fields: string[] = [];
        const values: any[] = [];
        if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
        if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
        if (data.frequency !== undefined) { fields.push("frequency = ?"); values.push(data.frequency); }
        if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
        if (data.completions !== undefined) { fields.push("completions = ?"); values.push(JSON.stringify(data.completions)); }
        if (data.streak !== undefined) { fields.push("streak = ?"); values.push(data.streak); }
        if (data.bestStreak !== undefined) { fields.push("bestStreak = ?"); values.push(data.bestStreak); }
        
        if (fields.length > 0) {
          fields.push("updatedAt = CURRENT_TIMESTAMP");
          values.push(id);
          await db.prepare(`UPDATE Habit SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
        }
        return NextResponse.json({ success: true });
      }
      if (type === "subscription") {
        await db.prepare("UPDATE Subscription SET tier = ? WHERE userId = ?").bind(data.tier, userId).run();
        return NextResponse.json({ success: true });
      }
    }
    
    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }
      
      if (type === "task") {
        await db.prepare("DELETE FROM Task WHERE id = ?").bind(id).run();
        return NextResponse.json({ success: true });
      }
      if (type === "goal") {
        await db.prepare("DELETE FROM Goal WHERE id = ?").bind(id).run();
        return NextResponse.json({ success: true });
      }
      if (type === "habit") {
        await db.prepare("DELETE FROM Habit WHERE id = ?").bind(id).run();
        return NextResponse.json({ success: true });
      }
      if (type === "reminder") {
        await db.prepare("DELETE FROM Reminder WHERE id = ?").bind(id).run();
        return NextResponse.json({ success: true });
      }
      if (type === "chatMessages") {
        await db.prepare("DELETE FROM ChatMessage WHERE userId = ?").bind(userId).run();
        return NextResponse.json({ success: true });
      }
    }
    
    return NextResponse.json({ success: false, error: "Invalid action or type" }, { status: 400 });
  } catch (error) {
    console.error("Data API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
