import { NextResponse } from "next/server";

/**
 * AI Advisor endpoint — uses OpenAI-compatible API.
 * Previously used Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct).
 * Now uses the OPENAI_API_KEY environment variable with any OpenAI-compatible endpoint.
 *
 * Set these env vars:
 *   AI_API_KEY     — API key (OpenAI, Groq, Together, etc.)
 *   AI_API_URL     — Base URL (defaults to https://api.openai.com/v1)
 *   AI_MODEL       — Model name (defaults to gpt-4o-mini)
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const apiUrl = process.env.AI_API_URL || "https://api.openai.com/v1";
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    const body = await request.json();
    const { message, context, history } = body as { message: string; context?: any; history?: { role: 'user' | 'assistant'; content: string }[] };

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

    // Build message array: system + up to last 10 conversation turns + current message
    const conversationHistory = (history ?? []).slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Primary provider: OpenAI-compatible endpoint
    if (apiKey) {
      const res = await fetch(`${apiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            { role: "user", content: message },
          ],
          max_tokens: 800,
        }),
      });

      if (res.ok) {
        const aiData = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const response = aiData.choices?.[0]?.message?.content || "I'm here to help! Try asking me about productivity, task management, or your goals.";
        return NextResponse.json({ success: true, response });
      }

      const text = await res.text();
      console.error("AI API error:", res.status, text);
    }

    // Fallback provider: z-ai-web-dev-sdk
    try {
      const { default: ZAI } = await import("z-ai-web-dev-sdk");
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices?.[0]?.message?.content || "I'm here to help! Try asking me about productivity, task management, or your goals.";
      return NextResponse.json({ success: true, response });
    } catch (fallbackError) {
      console.error("AI fallback provider error:", fallbackError);
    }

    // Last-resort local advisor response (no external provider required).
    const tasks = Array.isArray(context?.tasks) ? context.tasks : [];
    const goals = Array.isArray(context?.goals) ? context.goals : [];
    const habits = Array.isArray(context?.habits) ? context.habits : [];
    const pendingTasks = tasks.filter((t: any) => !t.completed);
    const highPriority = pendingTasks.filter((t: any) => t.priority === "high");
    const topGoal = goals.find((g: any) => typeof g.progress === "number" && g.progress < 100) || goals[0];

    const steps: string[] = [];
    if (highPriority.length > 0) {
      steps.push(`Start with your highest-priority task: "${highPriority[0].title}".`);
    } else if (pendingTasks.length > 0) {
      steps.push(`Start with your next pending task: "${pendingTasks[0].title}".`);
    } else {
      steps.push("Create one small 15-minute task to build momentum.");
    }

    if (topGoal?.title) {
      steps.push(`Move your goal "${topGoal.title}" forward with one concrete action today.`);
    }

    if (habits.length === 0) {
      steps.push("Add one simple daily habit (for example: 10-minute planning review).");
    } else {
      steps.push("Protect your habit streak by scheduling a fixed time for it today.");
    }

    const response = [
      "Great question - here is a focused productivity plan for today:",
      `1) ${steps[0]}`,
      `2) ${steps[1] || "Block 2 focused sessions of 25 minutes and remove distractions during each."}`,
      `3) ${steps[2] || "At the end of the day, review what was completed and choose tomorrow's top task."}`,
      `You currently have ${pendingTasks.length} pending tasks, ${goals.length} goals, and ${habits.length} habits tracked.`,
    ].join(" ");

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ success: false, error: "Failed to get response" }, { status: 500 });
  }
}
