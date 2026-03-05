import { NextResponse } from "next/server";

const D1_API_URL = "https://api.cloudflare.com/client/v4/accounts/44488d79973a81689876492e372fe199/d1/database/efb0a777-d061-408b-baf5-f0ec60982757";
const D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN;

function generateId() {
  return crypto.randomUUID();
}

async function queryD1(sql: string, params: any[] = []) {
  const response = await fetch(`${D1_API_URL}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${D1_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D1 query failed: ${error}`);
  }
  
  const result = await response.json();
  return result.result?.[0]?.results || [];
}

export async function POST(request: Request) {
  try {
    if (!D1_API_TOKEN) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }
    
    const body = await request.json();
    const { userId, action, type, data, id } = body as {
      userId: string;
      action: string;
      type: string;
      data?: any;
      id?: string;
    };
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    
    // Get all data for a type
    if (action === "get") {
      if (type === "tasks") {
        const tasks = await queryD1("SELECT * FROM Task WHERE userId = ? ORDER BY \"order\" ASC", [userId]);
        return NextResponse.json({ success: true, data: tasks.map((t: any) => ({ ...t, completed: Boolean(t.completed), subtasks: JSON.parse(t.subtasks || "[]") })) });
      }
      if (type === "goals") {
        const goals = await queryD1("SELECT * FROM Goal WHERE userId = ?", [userId]);
        return NextResponse.json({ success: true, data: goals.map((g: any) => ({ ...g, milestones: JSON.parse(g.milestones || "[]") })) });
      }
      if (type === "habits") {
        const habits = await queryD1("SELECT * FROM Habit WHERE userId = ?", [userId]);
        return NextResponse.json({ success: true, data: habits.map((h: any) => ({ ...h, completions: JSON.parse(h.completions || "[]") })) });
      }
      if (type === "categories") {
        const categories = await queryD1("SELECT * FROM Category WHERE userId = ?", [userId]);
        return NextResponse.json({ success: true, data: categories });
      }
      if (type === "reminders") {
        const reminders = await queryD1("SELECT * FROM Reminder WHERE userId = ?", [userId]);
        return NextResponse.json({ success: true, data: reminders.map((r: any) => ({ ...r, isNotified: Boolean(r.isNotified) })) });
      }
      if (type === "chatMessages") {
        const messages = await queryD1("SELECT * FROM ChatMessage WHERE userId = ? ORDER BY timestamp ASC", [userId]);
        return NextResponse.json({ success: true, data: messages });
      }
      if (type === "subscription") {
        const subscription = await queryD1("SELECT * FROM Subscription WHERE userId = ?", [userId]);
        return NextResponse.json({ success: true, data: subscription[0] || null });
      }
    }
    
    // Create new item
    if (action === "create") {
      if (type === "task") {
        const taskId = generateId();
        await queryD1(
          `INSERT INTO Task (id, title, description, completed, priority, dueDate, dueTime, reminderMinutesBefore, category, subtasks, "order", userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [taskId, data.title, data.description || null, data.completed ? 1 : 0, data.priority || "medium", data.dueDate || null, data.dueTime || null, data.reminderMinutesBefore || null, data.category || "personal", JSON.stringify(data.subtasks || []), data.order || 0, userId]
        );
        return NextResponse.json({ success: true, data: { id: taskId, ...data } });
      }
      if (type === "goal") {
        const goalId = generateId();
        await queryD1(
          `INSERT INTO Goal (id, title, description, color, milestones, progress, targetDate, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [goalId, data.title, data.description || null, data.color || "#8b5cf6", JSON.stringify(data.milestones || []), 0, data.targetDate || null, userId]
        );
        return NextResponse.json({ success: true, data: { id: goalId, ...data, progress: 0 } });
      }
      if (type === "habit") {
        const habitId = generateId();
        await queryD1(
          `INSERT INTO Habit (id, title, description, frequency, color, completions, streak, bestStreak, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [habitId, data.title, data.description || null, data.frequency || "daily", data.color || "#8b5cf6", "[]", 0, 0, userId]
        );
        return NextResponse.json({ success: true, data: { id: habitId, ...data, completions: [], streak: 0, bestStreak: 0 } });
      }
      if (type === "category") {
        const catId = generateId();
        await queryD1(
          `INSERT INTO Category (id, name, color, icon, userId) VALUES (?, ?, ?, ?, ?)`,
          [catId, data.name, data.color, data.icon || null, userId]
        );
        return NextResponse.json({ success: true, data: { id: catId, ...data } });
      }
      if (type === "reminder") {
        const remId = generateId();
        await queryD1(
          `INSERT INTO Reminder (id, taskId, taskTitle, dueDate, dueTime, reminderAt, isNotified, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [remId, data.taskId, data.taskTitle, data.dueDate, data.dueTime || null, data.reminderAt, 0, userId]
        );
        return NextResponse.json({ success: true, data: { id: remId, ...data, isNotified: false } });
      }
      if (type === "chatMessage") {
        const msgId = generateId();
        await queryD1(
          `INSERT INTO ChatMessage (id, role, content, userId) VALUES (?, ?, ?, ?)`,
          [msgId, data.role, data.content, userId]
        );
        return NextResponse.json({ success: true, data: { id: msgId, ...data, timestamp: new Date().toISOString() } });
      }
    }
    
    // Update existing item
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
        if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
        if (data.subtasks !== undefined) { fields.push("subtasks = ?"); values.push(JSON.stringify(data.subtasks)); }
        if (data.order !== undefined) { fields.push("\"order\" = ?"); values.push(data.order); }
        
        if (fields.length > 0) {
          values.push(id);
          await queryD1(`UPDATE Task SET ${fields.join(", ")} WHERE id = ?`, values);
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
          values.push(id);
          await queryD1(`UPDATE Goal SET ${fields.join(", ")} WHERE id = ?`, values);
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
          values.push(id);
          await queryD1(`UPDATE Habit SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return NextResponse.json({ success: true });
      }
      if (type === "subscription") {
        await queryD1("UPDATE Subscription SET tier = ? WHERE userId = ?", [data.tier, userId]);
        return NextResponse.json({ success: true });
      }
    }
    
    // Delete item
    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }
      
      if (type === "task") {
        await queryD1("DELETE FROM Task WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
      }
      if (type === "goal") {
        await queryD1("DELETE FROM Goal WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
      }
      if (type === "habit") {
        await queryD1("DELETE FROM Habit WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
      }
      if (type === "reminder") {
        await queryD1("DELETE FROM Reminder WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
      }
      if (type === "chatMessages") {
        await queryD1("DELETE FROM ChatMessage WHERE userId = ?", [userId]);
        return NextResponse.json({ success: true });
      }
    }
    
    return NextResponse.json({ success: false, error: "Invalid action or type" }, { status: 400 });
  } catch (error) {
    console.error("Data API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
