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

    // Last-resort deterministic response to avoid hard failure in UI.
    const pendingTasks = Array.isArray(context?.tasks) ? context.tasks.filter((t: any) => !t.completed).length : 0;
    const activeGoals = Array.isArray(context?.goals) ? context.goals.length : 0;
    const activeHabits = Array.isArray(context?.habits) ? context.habits.length : 0;
    const response = [
      "I can still help even though the AI provider is temporarily unavailable.",
      `You currently have ${pendingTasks} pending tasks, ${activeGoals} goals, and ${activeHabits} habits.`,
      "Try this next: pick 1 high-priority task, break it into a 15-minute step, and complete it before adding new tasks.",
      `Your message was: \"${message}\". If you want, ask for a step-by-step plan and I'll format one for today.`,
    ].join(" ");

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ success: false, error: "Failed to get response" }, { status: 500 });
  }
}
