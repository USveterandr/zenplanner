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
  reminder?: string;
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

// Analytics Types
export interface ProductivityStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  productivityScore: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  tasksByCategory: Record<string, number>;
  weeklyTrend: {
    date: string;
    completed: number;
    total: number;
  }[];
}

// AI Insights
export interface AIInsight {
  type: 'tip' | 'warning' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  actionable?: boolean;
  action?: string;
}

// Store State
export interface AppState {
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  
  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  
  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'streak' | 'bestStreak'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  
  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  
  // UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  
  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}
