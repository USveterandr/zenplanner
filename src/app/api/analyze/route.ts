import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'edge';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  dueDate?: string;
  category: string;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  milestones: { id: string; title: string; completed: boolean }[];
}

interface Habit {
  id: string;
  title: string;
  streak: number;
  bestStreak: number;
  completions: { date: string; completed: boolean }[];
  frequency: string;
}

interface AnalyzeRequest {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
}

// Rate limit: 10 requests per minute per IP (analysis is expensive)
const RATE_LIMIT_CONFIG = { maxRequests: 10, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'anonymous';
    const rateLimitResult = rateLimit(`analyze:${ip}`, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Input validation
    let body: AnalyzeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const tasks = Array.isArray(body.tasks) ? body.tasks : [];
    const goals = Array.isArray(body.goals) ? body.goals : [];
    const habits = Array.isArray(body.habits) ? body.habits : [];

    const zai = await ZAI.create();

    // Calculate statistics
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(t =>
      !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task distribution by category
    const categoryDistribution: Record<string, number> = {};
    tasks.forEach(task => {
      categoryDistribution[task.category] = (categoryDistribution[task.category] || 0) + 1;
    });

    // Priority distribution
    const priorityDistribution = {
      high: tasks.filter(t => t.priority === 'high' && !t.completed).length,
      medium: tasks.filter(t => t.priority === 'medium' && !t.completed).length,
      low: tasks.filter(t => t.priority === 'low' && !t.completed).length,
    };

    // Habit stats
    const totalHabits = habits.length;
    const avgStreak = habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length)
      : 0;
    const activeStreaks = habits.filter(h => h.streak > 0).length;

    // Goal stats
    const totalGoals = goals.length;
    const avgGoalProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

    // Build analysis prompt
    const analysisPrompt = `Analyze the following productivity data and provide 3-5 actionable insights:

TASK STATISTICS:
- Total tasks: ${totalTasks}
- Completed: ${completedTasks}
- Pending: ${pendingTasks}
- Overdue: ${overdueTasks}
- Completion rate: ${completionRate}%

PRIORITY BREAKDOWN (pending):
- High: ${priorityDistribution.high}
- Medium: ${priorityDistribution.medium}  
- Low: ${priorityDistribution.low}

CATEGORY DISTRIBUTION:
${Object.entries(categoryDistribution).map(([cat, count]) => `- ${cat}: ${count} tasks`).join('\n')}

GOAL PROGRESS:
- Total goals: ${totalGoals}
- Average progress: ${avgGoalProgress}%

HABIT TRACKING:
- Total habits: ${totalHabits}
- Active streaks: ${activeStreaks}
- Average streak: ${avgStreak} days

Provide insights in the following JSON format only:
{
  "productivityScore": <number 0-100>,
  "insights": [
    {
      "type": "tip|warning|achievement|suggestion",
      "title": "<short title>",
      "description": "<detailed insight>",
      "actionable": <boolean>,
      "action": "<optional action suggestion>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a productivity analysis AI. Analyze data and provide actionable insights in JSON format only. No markdown, just valid JSON.'
        },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    let analysisResult;
    try {
      // Clean the response - remove any markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(cleanedResponse);
    } catch {
      // If parsing fails, create a default result
      analysisResult = {
        productivityScore: completionRate,
        insights: [
          {
            type: 'suggestion',
            title: 'Keep tracking your progress',
            description: 'Continue using the app to get more personalized insights.',
            actionable: false
          }
        ],
        recommendations: ['Add more tasks to get better insights', 'Set up goals to track long-term progress']
      };
    }

    return NextResponse.json(
      {
        success: true,
        analysis: {
          stats: {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            completionRate,
            priorityDistribution,
            categoryDistribution,
            totalGoals,
            avgGoalProgress,
            totalHabits,
            avgStreak,
            activeStreaks,
          },
          productivityScore: analysisResult.productivityScore ?? completionRate,
          insights: analysisResult.insights ?? [],
          recommendations: analysisResult.recommendations ?? [],
        },
        timestamp: new Date().toISOString()
      },
      { headers: rateLimitHeaders(rateLimitResult) }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze productivity data.' },
      { status: 500 }
    );
  }
}
