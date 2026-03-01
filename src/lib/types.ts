// Task Types
export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  dueTime?: string;
  reminder?: string;
  reminderMinutesBefore?: number;
  category: string;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
  goalId?: string;
  order: number;
}

// Goal Types
export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  color: string;
  milestones: Milestone[];
  progress: number;
  createdAt: string;
  targetDate?: string;
}

// Habit Types
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface HabitCompletion {
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  color: string;
  completions: HabitCompletion[];
  streak: number;
  bestStreak: number;
  createdAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Reminder Types
export interface Reminder {
  id: string;
  taskId: string;
  taskTitle: string;
  dueDate: string;
  dueTime?: string;
  reminderAt: string;
  isNotified: boolean;
}

// Subscription Types
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    tasks: number;
    goals: number;
    habits: number;
    aiMessages: number;
    reminders: number;
  };
  highlighted?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 6.97,
    billingCycle: 'monthly',
    features: [
      'Unlimited tasks',
      'Up to 5 goals',
      'Up to 10 habits',
      '50 AI messages/month',
      'Basic reminders',
      'Calendar view',
    ],
    limits: { tasks: -1, goals: 5, habits: 10, aiMessages: 50, reminders: 10 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12.97,
    billingCycle: 'monthly',
    features: [
      'Everything in Starter',
      'Unlimited goals',
      'Unlimited habits',
      '200 AI messages/month',
      'Smart reminders',
      'Priority support',
      'Advanced analytics',
    ],
    limits: { tasks: -1, goals: -1, habits: -1, aiMessages: 200, reminders: 50 },
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 29.97,
    billingCycle: 'monthly',
    features: [
      'Everything in Pro',
      '500 AI messages/month',
      'Team collaboration',
      'Shared calendars',
      'Admin dashboard',
      'API access',
      'Custom integrations',
    ],
    limits: { tasks: -1, goals: -1, habits: -1, aiMessages: 500, reminders: -1 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.97,
    billingCycle: 'monthly',
    features: [
      'Everything in Business',
      'Unlimited AI messages',
      'Unlimited team members',
      'White-label options',
      'SSO authentication',
      'Dedicated support',
      'SLA guarantee',
      'Custom development',
    ],
    limits: { tasks: -1, goals: -1, habits: -1, aiMessages: -1, reminders: -1 },
  },
];

// Analytics Types
export interface ProductivityStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  productivityScore: number;
  tasksByPriority: { high: number; medium: number; low: number };
  tasksByCategory: Record<string, number>;
  weeklyTrend: { date: string; completed: number; total: number }[];
}

// AI Insights
export interface AIInsight {
  type: 'tip' | 'warning' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  actionable?: boolean;
  action?: string;
}

// Calendar Event
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'task' | 'reminder' | 'goal';
  completed: boolean;
  priority?: Priority;
  color?: string;
}

// Store State
export interface AppState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'streak' | 'bestStreak'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'isNotified'>) => void;
  dismissReminder: (id: string) => void;
  subscription: SubscriptionTier;
  setSubscription: (tier: SubscriptionTier) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}
