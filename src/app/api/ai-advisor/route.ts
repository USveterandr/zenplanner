import { NextResponse } from "next/server";
import { getAI } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const ai = getAI();

    if (!ai) {
      return NextResponse.json({ success: false, error: "AI not available in this environment" }, { status: 503 });
    }
    
    const body = await request.json();
    const { message, context } = body as { message: string; context?: any };

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    let contextStr = "";
    if (context) {
      if (context.tasks?.length > 0) {
        contextStr += `\nTasks (${context.tasks.length}):\n`;
        context.tasks.forEach((t: { title: string; completed: boolean; priority: string }) => {
          contextStr += `- ${t.completed ? "✓" : "○"} ${t.title} (${t.priority})\n`;
        });
      }
      if (context.goals?.length > 0) {
        contextStr += `\nGoals:\n`;
        context.goals.forEach((g: { title: string; progress: number }) => {
          contextStr += `- ${g.title} (${g.progress}%)\n`;
        });
      }
      if (context.habits?.length > 0) {
        contextStr += `\nHabits:\n`;
        context.habits.forEach((h: { title: string; streak: number }) => {
          contextStr += `- ${h.title} (${h.streak} day streak)\n`;
        });
      }
    }

    const systemPrompt = `You are a helpful AI productivity advisor for Zen Planner app. Be concise, encouraging, and practical. Help users with task management, goal setting, habit building, and productivity tips.${contextStr ? `\n\nCurrent user data:${contextStr}` : ""}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiResponse = await (ai as any).run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
    }) as { response?: string };

    const response = aiResponse.response || "I'm here to help! Try asking me about productivity, task management, or your goals.";
    
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ success: false, error: "Failed to get response" }, { status: 500 });
  }
}
