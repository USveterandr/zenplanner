import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'edge';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  dueDate?: string;
  category: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  milestones: { id: string; title: string; completed: boolean }[];
}

interface Habit {
  id: string;
  title: string;
  streak: number;
  completions: { date: string; completed: boolean }[];
}

interface ChatRequest {
  message: string;
  context: {
    tasks: Task[];
    goals: Goal[];
    habits: Habit[];
  };
}

// Rate limit: 20 requests per minute per IP
const RATE_LIMIT_CONFIG = { maxRequests: 20, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'anonymous';
    const rateLimitResult = rateLimit(`ai-advisor:${ip}`, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Input validation
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const { message, context } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message must be 2000 characters or fewer.' },
        { status: 400 }
      );
    }

    if (!context || typeof context !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Context object is required.' },
        { status: 400 }
      );
    }

    const tasks = Array.isArray(context.tasks) ? context.tasks : [];
    const goals = Array.isArray(context.goals) ? context.goals : [];
    const habits = Array.isArray(context.habits) ? context.habits : [];

    const zai = await ZAI.create();

    // Build context summary for the AI
    const tasksSummary = `
- Total tasks: ${tasks.length}
- Completed: ${tasks.filter(t => t.completed).length}
- Pending: ${tasks.filter(t => !t.completed).length}
- High priority pending: ${tasks.filter(t => t.priority === 'high' && !t.completed).length}
- Overdue: ${tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length}
    `.trim();

    const goalsSummary = goals.map(g =>
      `- "${g.title}": ${g.progress}% complete (${g.milestones.filter(m => m.completed).length}/${g.milestones.length} milestones)`
    ).join('\n') || 'No goals set';

    const habitsSummary = habits.map(h =>
      `- "${h.title}": ${h.streak} day streak`
    ).join('\n') || 'No habits tracked';

    const systemPrompt = `You are Zen, an intelligent AI productivity advisor for a Todo & Planner app. You help users manage their tasks, goals, and habits with personalized advice.

USER'S CURRENT STATE:
Tasks:
${tasksSummary}

Goals:
${goalsSummary}

Habits:
${habitsSummary}

YOUR CAPABILITIES:
1. Provide productivity insights and recommendations
2. Help prioritize tasks based on urgency and importance
3. Suggest goal strategies and milestone planning
4. Offer habit-building advice
5. Analyze patterns and suggest improvements
6. Motivate and encourage productivity

GUIDELINES:
- Be concise but helpful (keep responses under 200 words unless detailed explanation is needed)
- Use emojis sparingly but effectively
- Offer actionable, specific advice
- Celebrate wins and progress
- Be empathetic about struggles
- When suggesting tasks, format them as: "TASK: [task description]"
- Use bullet points for lists
- Be encouraging and positive`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, I could not process your request. Please try again.';

    return NextResponse.json(
      {
        success: true,
        response,
        timestamp: new Date().toISOString()
      },
      { headers: rateLimitHeaders(rateLimitResult) }
    );

  } catch (error) {
    console.error('AI Advisor error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI advice. Please try again.' },
      { status: 500 }
    );
  }
}
