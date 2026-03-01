import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    let contextStr = '';
    if (context) {
      if (context.tasks?.length > 0) {
        contextStr += `\nTasks (${context.tasks.length}):\n`;
        context.tasks.forEach((t: { title: string; completed: boolean; priority: string }) => {
          contextStr += `- ${t.completed ? '✓' : '○'} ${t.title} (${t.priority})\n`;
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

    const systemPrompt = `You are a helpful AI productivity advisor for Zen Planner. Be concise and helpful.${contextStr ? `\n\nUser context:${contextStr}` : ''}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({ success: true, response: completion.choices[0]?.message?.content || 'Sorry, no response.' });
  } catch (error) {
    console.error('AI error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get response' }, { status: 500 });
  }
}
