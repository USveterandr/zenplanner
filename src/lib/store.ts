import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  dueTime?: string;
  reminderMinutesBefore?: number;
  category: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  color: string;
  milestones: { id: string; title: string; completed: boolean; targetDate?: string }[];
  progress: number;
  createdAt: string;
  targetDate?: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  color: string;
  completions: { date: string; completed: boolean }[];
  streak: number;
  bestStreak: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Reminder {
  id: string;
  taskId: string;
  taskTitle: string;
  dueDate: string;
  dueTime?: string;
  reminderAt: string;
  isNotified: boolean;
}

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

// Subscription Plans
export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 6.97,
    billingCycle: 'monthly' as const,
    features: [
      'Unlimited tasks',
      'Up to 5 goals',
      'Up to 10 habits',
      '50 AI messages/month',
      'Basic reminders',
      'Calendar view',
    ],
    highlighted: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 12.97,
    billingCycle: 'monthly' as const,
    features: [
      'Everything in Starter',
      'Unlimited goals',
      'Unlimited habits',
      '200 AI messages/month',
      'Smart reminders',
      'Priority support',
      'Advanced analytics',
    ],
    highlighted: true,
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: 29.97,
    billingCycle: 'monthly' as const,
    features: [
      'Everything in Pro',
      '500 AI messages/month',
      'Team collaboration',
      'Shared calendars',
      'Admin dashboard',
      'API access',
      'Custom integrations',
    ],
    highlighted: false,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 49.97,
    billingCycle: 'monthly' as const,
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
    highlighted: false,
  },
];

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Default categories
const defaultCategories: Category[] = [
  { id: 'personal', name: 'Personal', color: '#8b5cf6' },
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'health', name: 'Health', color: '#22c55e' },
  { id: 'learning', name: 'Learning', color: '#f59e0b' },
  { id: 'other', name: 'Other', color: '#6b7280' },
];

// Store interface
interface AppState {
  // Data
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  categories: Category[];
  chatMessages: ChatMessage[];
  reminders: Reminder[];
  subscription: SubscriptionTier;
  
  // UI State
  activeTab: string;
  selectedDate: string;
  
  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  
  // Habit actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'streak' | 'bestStreak'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  
  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  
  // Reminder actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'isNotified'>) => void;
  dismissReminder: (id: string) => void;
  
  // Subscription actions
  setSubscription: (tier: SubscriptionTier) => void;
  
  // UI actions
  setActiveTab: (tab: string) => void;
  setSelectedDate: (date: string) => void;
}

// Create store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial data
      tasks: [],
      goals: [],
      habits: [],
      categories: defaultCategories,
      chatMessages: [],
      reminders: [],
      subscription: 'free',
      
      // UI State
      activeTab: 'tasks',
      selectedDate: new Date().toISOString().split('T')[0],
      
      // Hydration
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // Task actions
      addTask: (taskData) => {
        const now = new Date().toISOString();
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          order: get().tasks.length,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
          ),
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
      },
      
      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() } : task
          ),
        }));
      },
      
      reorderTasks: (tasks) => set({ tasks }),
      
      // Goal actions
      addGoal: (goalData) => {
        const newGoal: Goal = {
          ...goalData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          progress: 0,
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },
      
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)),
        }));
      },
      
      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) }));
      },
      
      toggleMilestone: (goalId, milestoneId) => {
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id !== goalId) return goal;
            const updatedMilestones = goal.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            );
            const completedCount = updatedMilestones.filter((m) => m.completed).length;
            const progress = updatedMilestones.length > 0
              ? Math.round((completedCount / updatedMilestones.length) * 100)
              : 0;
            return { ...goal, milestones: updatedMilestones, progress };
          }),
        }));
      },
      
      // Habit actions
      addHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          completions: [],
          streak: 0,
          bestStreak: 0,
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },
      
      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === id ? { ...habit, ...updates } : habit)),
        }));
      },
      
      deleteHabit: (id) => {
        set((state) => ({ habits: state.habits.filter((habit) => habit.id !== id) }));
      },
      
      toggleHabitCompletion: (id, date) => {
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;
            
            const existingIndex = habit.completions.findIndex((c) => c.date === date);
            let newCompletions: typeof habit.completions;
            
            if (existingIndex >= 0) {
              newCompletions = habit.completions.map((c, i) =>
                i === existingIndex ? { ...c, completed: !c.completed } : c
              );
            } else {
              newCompletions = [...habit.completions, { date, completed: true }];
            }
            
            // Calculate streak
            const today = new Date();
            let streak = 0;
            const sortedCompletions = [...newCompletions]
              .filter((c) => c.completed)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            for (let i = 0; i < sortedCompletions.length; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(today.getDate() - i);
              const checkDateStr = checkDate.toISOString().split('T')[0];
              
              if (sortedCompletions.some((c) => c.date === checkDateStr && c.completed)) {
                streak++;
              } else {
                break;
              }
            }
            
            return {
              ...habit,
              completions: newCompletions,
              streak,
              bestStreak: Math.max(habit.bestStreak, streak),
            };
          }),
        }));
      },
      
      // Category actions
      addCategory: (categoryData) => {
        const newCategory: Category = { ...categoryData, id: generateId() };
        set((state) => ({ categories: [...state.categories, newCategory] }));
      },
      
      // Chat actions
      addChatMessage: (messageData) => {
        const newMessage: ChatMessage = {
          ...messageData,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ chatMessages: [...state.chatMessages, newMessage] }));
      },
      
      clearChat: () => set({ chatMessages: [] }),
      
      // Reminder actions
      addReminder: (reminderData) => {
        const newReminder: Reminder = {
          ...reminderData,
          id: generateId(),
          isNotified: false,
        };
        set((state) => ({ reminders: [...state.reminders, newReminder] }));
      },
      
      dismissReminder: (id) => {
        set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));
      },
      
      // Subscription actions
      setSubscription: (tier) => set({ subscription: tier }),
      
      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'zen-planner-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        tasks: state.tasks,
        goals: state.goals,
        habits: state.habits,
        categories: state.categories,
        chatMessages: state.chatMessages,
        reminders: state.reminders,
        subscription: state.subscription,
      }),
    }
  )
);

// Utility functions
export function calculateStats(tasks: Task[]) {
  const now = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const productivityScore = Math.max(0, Math.min(100, completionRate - overdueTasks * 5));
  
  const tasksByPriority = {
    high: tasks.filter((t) => t.priority === 'high' && !t.completed).length,
    medium: tasks.filter((t) => t.priority === 'medium' && !t.completed).length,
    low: tasks.filter((t) => t.priority === 'low' && !t.completed).length,
  };
  
  const tasksByCategory: Record<string, number> = {};
  tasks.forEach((task) => {
    tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1;
  });
  
  const weeklyTrend: { date: string; completed: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter((t) => (t.dueDate || t.createdAt)?.split('T')[0] === dateStr);
    weeklyTrend.push({
      date: dateStr,
      completed: dayTasks.filter((t) => t.completed).length,
      total: dayTasks.length,
    });
  }
  
  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate,
    productivityScore,
    tasksByPriority,
    tasksByCategory,
    weeklyTrend,
  };
}

export function getTasksForDate(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.dueDate === date);
}

export function getCalendarEvents(tasks: Task[], goals: Goal[]) {
  const events: {
    id: string;
    title: string;
    date: string;
    time?: string;
    type: 'task' | 'goal';
    completed: boolean;
    priority?: string;
    color?: string;
  }[] = [];

  tasks.forEach((t) => {
    if (t.dueDate) {
      events.push({
        id: t.id,
        title: t.title,
        date: t.dueDate,
        time: t.dueTime,
        type: 'task',
        completed: t.completed,
        priority: t.priority,
      });
    }
  });

  goals.forEach((g) => {
    if (g.targetDate) {
      events.push({
        id: g.id,
        title: g.title,
        date: g.targetDate,
        type: 'goal',
        completed: g.progress >= 100,
        color: g.color,
      });
    }
  });

  return events;
}

// Selector hooks
export const useTasks = () => useAppStore((state) => state.tasks);
export const useGoals = () => useAppStore((state) => state.goals);
export const useHabits = () => useAppStore((state) => state.habits);
export const useHydrated = () => useAppStore((state) => state._hasHydrated);
