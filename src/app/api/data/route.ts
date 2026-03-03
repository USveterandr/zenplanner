import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  getTasks, createTask, updateTask, deleteTask,
  getGoals, createGoal, updateGoal, deleteGoal,
  getHabits, createHabit, updateHabit, deleteHabit,
  getCategories, createCategory,
  getReminders, createReminder, deleteReminder,
  getChatMessages, createChatMessage, clearChatMessages,
  getSubscription, updateSubscription
} from "@/lib/db";

export async function POST(request: Request) {
  try {
    const cf = getCloudflareContext();
    const env = cf.env as any;
    
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
        const tasks = await getTasks(env, userId);
        return NextResponse.json({ success: true, data: tasks });
      }
      if (type === "goals") {
        const goals = await getGoals(env, userId);
        return NextResponse.json({ success: true, data: goals });
      }
      if (type === "habits") {
        const habits = await getHabits(env, userId);
        return NextResponse.json({ success: true, data: habits });
      }
      if (type === "categories") {
        const categories = await getCategories(env, userId);
        return NextResponse.json({ success: true, data: categories });
      }
      if (type === "reminders") {
        const reminders = await getReminders(env, userId);
        return NextResponse.json({ success: true, data: reminders });
      }
      if (type === "chatMessages") {
        const messages = await getChatMessages(env, userId);
        return NextResponse.json({ success: true, data: messages });
      }
      if (type === "subscription") {
        const subscription = await getSubscription(env, userId);
        return NextResponse.json({ success: true, data: subscription });
      }
    }
    
    // Create new item
    if (action === "create") {
      if (type === "task") {
        const task = await createTask(env, userId, data);
        return NextResponse.json({ success: true, data: task });
      }
      if (type === "goal") {
        const goal = await createGoal(env, userId, data);
        return NextResponse.json({ success: true, data: goal });
      }
      if (type === "habit") {
        const habit = await createHabit(env, userId, data);
        return NextResponse.json({ success: true, data: habit });
      }
      if (type === "category") {
        const category = await createCategory(env, userId, data);
        return NextResponse.json({ success: true, data: category });
      }
      if (type === "reminder") {
        const reminder = await createReminder(env, userId, data);
        return NextResponse.json({ success: true, data: reminder });
      }
      if (type === "chatMessage") {
        const message = await createChatMessage(env, userId, data);
        return NextResponse.json({ success: true, data: message });
      }
    }
    
    // Update existing item
    if (action === "update") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }
      
      if (type === "task") {
        await updateTask(env, id, data);
        return NextResponse.json({ success: true });
      }
      if (type === "goal") {
        await updateGoal(env, id, data);
        return NextResponse.json({ success: true });
      }
      if (type === "habit") {
        await updateHabit(env, id, data);
        return NextResponse.json({ success: true });
      }
      if (type === "subscription") {
        await updateSubscription(env, userId, data.tier);
        return NextResponse.json({ success: true });
      }
    }
    
    // Delete item
    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }
      
      if (type === "task") {
        await deleteTask(env, id);
        return NextResponse.json({ success: true });
      }
      if (type === "goal") {
        await deleteGoal(env, id);
        return NextResponse.json({ success: true });
      }
      if (type === "habit") {
        await deleteHabit(env, id);
        return NextResponse.json({ success: true });
      }
      if (type === "reminder") {
        await deleteReminder(env, id);
        return NextResponse.json({ success: true });
      }
      if (type === "chatMessages") {
        await clearChatMessages(env, userId);
        return NextResponse.json({ success: true });
      }
    }
    
    return NextResponse.json({ success: false, error: "Invalid action or type" }, { status: 400 });
  } catch (error) {
    console.error("Data API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
