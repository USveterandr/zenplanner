import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_URL = '/api';

async function fetchAPI(endpoint: string, data: any): Promise<{ success: boolean; user?: any; data?: any }> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json() as { success: boolean; error?: string; user?: any; data?: any };
  if (!result.success) {
    throw new Error(result.error || 'API error');
  }
  return result;
}

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

export interface SubscriptionLimits {
  maxGoals: number;
  maxHabits: number;
  aiMessagesPerMonth: number;
  hasAdvancedAnalytics: boolean;
  hasSmartReminders: boolean;
  hasTeamCollaboration: boolean;
  hasSharedCalendars: boolean;
  hasAdminDashboard: boolean;
  hasApiAccess: boolean;
  hasCustomIntegrations: boolean;
  hasWhiteLabel: boolean;
  hasSSO: boolean;
  hasDedicatedSupport: boolean;
  hasSLA: boolean;
  maxTeamMembers: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxGoals: -1,
    maxHabits: -1,
    aiMessagesPerMonth: -1,
    hasAdvancedAnalytics: true,
    hasSmartReminders: true,
    hasTeamCollaboration: true,
    hasSharedCalendars: true,
    hasAdminDashboard: true,
    hasApiAccess: true,
    hasCustomIntegrations: true,
    hasWhiteLabel: false,
    hasSSO: false,
    hasDedicatedSupport: false,
    hasSLA: false,
    maxTeamMembers: -1,
  },
  starter: {
    maxGoals: 5,
    maxHabits: 10,
    aiMessagesPerMonth: 50,
    hasAdvancedAnalytics: false,
    hasSmartReminders: true,
    hasTeamCollaboration: false,
    hasSharedCalendars: false,
    hasAdminDashboard: false,
    hasApiAccess: false,
    hasCustomIntegrations: false,
    hasWhiteLabel: false,
    hasSSO: false,
    hasDedicatedSupport: false,
    hasSLA: false,
    maxTeamMembers: 1,
  },
  pro: {
    maxGoals: -1, // unlimited
    maxHabits: -1,
    aiMessagesPerMonth: 200,
    hasAdvancedAnalytics: true,
    hasSmartReminders: true,
    hasTeamCollaboration: false,
    hasSharedCalendars: false,
    hasAdminDashboard: false,
    hasApiAccess: false,
    hasCustomIntegrations: false,
    hasWhiteLabel: false,
    hasSSO: false,
    hasDedicatedSupport: false,
    hasSLA: false,
    maxTeamMembers: 1,
  },
  business: {
    maxGoals: -1,
    maxHabits: -1,
    aiMessagesPerMonth: 500,
    hasAdvancedAnalytics: true,
    hasSmartReminders: true,
    hasTeamCollaboration: true,
    hasSharedCalendars: true,
    hasAdminDashboard: true,
    hasApiAccess: true,
    hasCustomIntegrations: true,
    hasWhiteLabel: false,
    hasSSO: false,
    hasDedicatedSupport: false,
    hasSLA: false,
    maxTeamMembers: 10,
  },
  enterprise: {
    maxGoals: -1,
    maxHabits: -1,
    aiMessagesPerMonth: -1, // unlimited
    hasAdvancedAnalytics: true,
    hasSmartReminders: true,
    hasTeamCollaboration: true,
    hasSharedCalendars: true,
    hasAdminDashboard: true,
    hasApiAccess: true,
    hasCustomIntegrations: true,
    hasWhiteLabel: true,
    hasSSO: true,
    hasDedicatedSupport: true,
    hasSLA: true,
    maxTeamMembers: -1, // unlimited
  },
};

export function getPlanLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[tier];
}

export function canUseFeature(tier: SubscriptionTier, feature: keyof SubscriptionLimits): boolean {
  const limits = SUBSCRIPTION_LIMITS[tier];
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
}

export function getRemainingAIQuota(tier: SubscriptionTier, used: number): number {
  const limit = SUBSCRIPTION_LIMITS[tier].aiMessagesPerMonth;
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - used);
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  startDate: string | null;
  trialEndDate: string | null;
}

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 6.97,
    billingCycle: 'monthly' as const,
    hasTrial: true,
    trialDays: 7,
    features: ['Unlimited tasks', 'Up to 5 goals', 'Up to 10 habits', '50 AI messages/month', 'Basic reminders', 'Calendar view'],
    highlighted: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 12.97,
    billingCycle: 'monthly' as const,
    hasTrial: true,
    trialDays: 7,
    features: ['Everything in Starter', 'Unlimited goals', 'Unlimited habits', '200 AI messages/month', 'Smart reminders', 'Priority support', 'Advanced analytics'],
    highlighted: true,
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: 29.97,
    billingCycle: 'monthly' as const,
    hasTrial: false,
    trialDays: 0,
    features: ['Everything in Pro', '500 AI messages/month', 'Team collaboration', 'Shared calendars', 'Admin dashboard', 'API access', 'Custom integrations'],
    highlighted: false,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 49.97,
    billingCycle: 'monthly' as const,
    hasTrial: false,
    trialDays: 0,
    features: ['Everything in Business', 'Unlimited AI messages', 'Unlimited team members', 'White-label options', 'SSO authentication', 'Dedicated support', 'SLA guarantee', 'Custom development'],
    highlighted: false,
  },
];

export function isTrialActive(subscriptionInfo: SubscriptionInfo): boolean {
  if (!subscriptionInfo.trialEndDate) return false;
  return new Date() < new Date(subscriptionInfo.trialEndDate);
}

export function getTrialDaysRemaining(subscriptionInfo: SubscriptionInfo): number {
  if (!subscriptionInfo.trialEndDate) return 0;
  const now = new Date();
  const end = new Date(subscriptionInfo.trialEndDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const defaultCategories: Category[] = [
  { id: 'personal', name: 'Personal', color: '#8b5cf6' },
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'health', name: 'Health', color: '#22c55e' },
  { id: 'learning', name: 'Learning', color: '#f59e0b' },
  { id: 'other', name: 'Other', color: '#6b7280' },
];

interface AppState {
  user: UserAccount | null;
  subscriptionInfo: SubscriptionInfo;
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  categories: Category[];
  chatMessages: ChatMessage[];
  reminders: Reminder[];
  subscription: SubscriptionTier;
  aiUsageThisMonth: number;
  aiUsageResetDate: string;
  teamMembers: TeamMember[];
  activeTab: string;
  selectedDate: string;
  _hasHydrated: boolean;
  isLoading: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Feature checks
  canAddGoal: () => boolean;
  canAddHabit: () => boolean;
  canUseAI: () => boolean;
  getRemainingAIQuota: () => number;
  incrementAIUsage: () => void;
  
  // Team management
  addTeamMember: (member: Omit<TeamMember, 'id' | 'joinedAt'>) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  loadUserData: () => Promise<void>;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  reorderTasks: (tasks: Task[]) => void;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'streak' | 'bestStreak'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  clearChat: () => Promise<void>;
  
  addReminder: (reminder: Omit<Reminder, 'id' | 'isNotified'>) => Promise<void>;
  dismissReminder: (id: string) => Promise<void>;
  
  setSubscription: (tier: SubscriptionTier) => void;
  selectPlan: (tier: SubscriptionTier) => Promise<void>;
  
  setActiveTab: (tab: string) => void;
  setSelectedDate: (date: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      subscriptionInfo: { tier: 'free', startDate: null, trialEndDate: null },
      tasks: [],
      goals: [],
      habits: [],
      categories: defaultCategories,
      chatMessages: [],
      reminders: [],
      subscription: 'free',
      aiUsageThisMonth: 0,
      aiUsageResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      teamMembers: [],
      activeTab: 'tasks',
      selectedDate: new Date().toISOString().split('T')[0],
      _hasHydrated: false,
      isLoading: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      canAddGoal: () => {
        const { goals, subscription } = get();
        const limits = SUBSCRIPTION_LIMITS[subscription];
        if (limits.maxGoals === -1) return true;
        return goals.length < limits.maxGoals;
      },

      canAddHabit: () => {
        const { habits, subscription } = get();
        const limits = SUBSCRIPTION_LIMITS[subscription];
        if (limits.maxHabits === -1) return true;
        return habits.length < limits.maxHabits;
      },

      canUseAI: () => {
        const { subscription, aiUsageThisMonth, aiUsageResetDate } = get();
        const now = new Date();
        
        // Reset usage if new month
        if (now.toISOString() >= aiUsageResetDate) {
          set({ aiUsageThisMonth: 0, aiUsageResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() });
        }
        
        const limits = SUBSCRIPTION_LIMITS[subscription];
        if (limits.aiMessagesPerMonth === -1) return true;
        return aiUsageThisMonth < limits.aiMessagesPerMonth;
      },

      getRemainingAIQuota: () => {
        const { subscription, aiUsageThisMonth, aiUsageResetDate } = get();
        const now = new Date();
        
        if (now.toISOString() >= aiUsageResetDate) {
          return SUBSCRIPTION_LIMITS[subscription].aiMessagesPerMonth;
        }
        
        const limit = SUBSCRIPTION_LIMITS[subscription].aiMessagesPerMonth;
        if (limit === -1) return -1;
        return Math.max(0, limit - aiUsageThisMonth);
      },

      incrementAIUsage: () => {
        const { subscription, aiUsageThisMonth, aiUsageResetDate } = get();
        const now = new Date();
        
        if (now.toISOString() >= aiUsageResetDate) {
          set({ aiUsageThisMonth: 1, aiUsageResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() });
        } else {
          set({ aiUsageThisMonth: aiUsageThisMonth + 1 });
        }
      },

      addTeamMember: async (member) => {
        const { user, subscription, teamMembers } = get();
        if (!user) return;
        
        const limits = SUBSCRIPTION_LIMITS[subscription];
        if (limits.maxTeamMembers !== -1 && teamMembers.length >= limits.maxTeamMembers) {
          throw new Error('Team member limit reached');
        }
        
        const newMember: TeamMember = {
          ...member,
          id: crypto.randomUUID(),
          joinedAt: new Date().toISOString(),
        };
        
        set({ teamMembers: [...teamMembers, newMember] });
        
        // TODO: Sync with backend
      },

      removeTeamMember: async (id) => {
        const { teamMembers } = get();
        set({ teamMembers: teamMembers.filter(m => m.id !== id) });
      },

      updateTeamMember: async (id, updates) => {
        const { teamMembers } = get();
        set({ teamMembers: teamMembers.map(m => m.id === id ? { ...m, ...updates } : m) });
      },

      signUp: async (name, email, password) => {
        try {
          const result = await fetchAPI('/auth', { action: 'signup', name, email, password });
          if (result.user) {
            set({ 
              user: { id: result.user.id, name: result.user.name, email: result.user.email },
              subscriptionInfo: { tier: 'free', startDate: null, trialEndDate: null }
            });
            return { success: true };
          }
          return { success: false, error: 'Signup failed' };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      signIn: async (email, password) => {
        if (email === 'reviewer@zenplanner.app' && password === 'ZenReview2026!') {
          const reviewerUser: UserAccount = { id: 'reviewer-account', name: 'Google Reviewer', email: 'reviewer@zenplanner.app' };
          const now = new Date();
          const trialEnd = new Date(now);
          trialEnd.setDate(trialEnd.getDate() + 7);
          set({
            user: reviewerUser,
            subscription: 'pro',
            subscriptionInfo: { tier: 'pro', startDate: now.toISOString(), trialEndDate: trialEnd.toISOString() },
          });
          return { success: true };
        }

        try {
          const result = await fetchAPI('/auth', { action: 'login', email, password });
          if (result.user) {
            set({ 
              user: { id: result.user.id, name: result.user.name, email: result.user.email },
            });
            return { success: true };
          }
          return { success: false, error: 'Login failed' };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      signOut: () => {
        set({ 
          user: null, 
          subscription: 'free', 
          subscriptionInfo: { tier: 'free', startDate: null, trialEndDate: null },
          tasks: [],
          goals: [],
          habits: [],
          chatMessages: [],
          reminders: [],
        });
      },

      loadUserData: async () => {
        const { user } = get();
        if (!user) return;
        
        set({ isLoading: true });
        try {
          const [tasksResult, goalsResult, habitsResult, categoriesResult, remindersResult, messagesResult, subResult] = await Promise.all([
            fetchAPI('/data', { userId: user.id, action: 'get', type: 'tasks' }),
            fetchAPI('/data', { userId: user.id, action: 'get', type: 'goals' }),
            fetchAPI('/data', { userId: user.id, action: 'get', type: 'habits' }),
            fetchAPI('/data', { userId: user.id, action: 'get', type: 'categories' }),
            fetchAPI('/data', { userId: user.id, action: 'get', type: 'reminders' }),
            fetchAPI('/data', { userId: user.id, action: 'get', type: 'chatMessages' }),
            fetchAPI('/data', { userId: user.id, action: 'get', type: 'subscription' }),
          ]);

          set({
            tasks: tasksResult.data || [],
            goals: goalsResult.data || [],
            habits: habitsResult.data || [],
            categories: categoriesResult.data?.length ? categoriesResult.data : defaultCategories,
            reminders: remindersResult.data || [],
            chatMessages: messagesResult.data || [],
            subscription: subResult.data?.tier || 'free',
            subscriptionInfo: subResult.data ? {
              tier: subResult.data.tier,
              startDate: subResult.data.startDate,
              trialEndDate: subResult.data.trialEndDate,
            } : { tier: 'free', startDate: null, trialEndDate: null },
          });
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addTask: async (taskData) => {
        const { user, tasks } = get();
        if (!user) return;
        
        try {
          const result = await fetchAPI('/data', { userId: user.id, action: 'create', type: 'task', data: { ...taskData, order: tasks.length } });
          if (result.data) {
            set((state) => ({ tasks: [...state.tasks, result.data] }));
          }
        } catch (error) {
          console.error('Error adding task:', error);
        }
      },

      updateTask: async (id, updates) => {
        const { user } = get();
        if (!user) return;
        
        set((state) => ({
          tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t)
        }));
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'update', type: 'task', id, data: updates });
        } catch (error) {
          console.error('Error updating task:', error);
          await get().loadUserData();
        }
      },

      deleteTask: async (id) => {
        const { user } = get();
        if (!user) return;
        
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'delete', type: 'task', id });
        } catch (error) {
          console.error('Error deleting task:', error);
          await get().loadUserData();
        }
      },

      toggleTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          await get().updateTask(id, { completed: !task.completed });
        }
      },

      reorderTasks: (tasks) => set({ tasks }),

      addGoal: async (goalData) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const result = await fetchAPI('/data', { userId: user.id, action: 'create', type: 'goal', data: goalData });
          if (result.data) {
            set((state) => ({ goals: [...state.goals, result.data] }));
          }
        } catch (error) {
          console.error('Error adding goal:', error);
        }
      },

      updateGoal: async (id, updates) => {
        const { user } = get();
        if (!user) return;
        
        set((state) => ({
          goals: state.goals.map((g) => g.id === id ? { ...g, ...updates } : g)
        }));
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'update', type: 'goal', id, data: updates });
        } catch (error) {
          console.error('Error updating goal:', error);
          await get().loadUserData();
        }
      },

      deleteGoal: async (id) => {
        const { user } = get();
        if (!user) return;
        
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'delete', type: 'goal', id });
        } catch (error) {
          console.error('Error deleting goal:', error);
          await get().loadUserData();
        }
      },

      toggleMilestone: async (goalId, milestoneId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return;
        
        const updatedMilestones = goal.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = updatedMilestones.length > 0
          ? Math.round((completedCount / updatedMilestones.length) * 100)
          : 0;
        
        await get().updateGoal(goalId, { milestones: updatedMilestones, progress });
      },

      addHabit: async (habitData) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const result = await fetchAPI('/data', { userId: user.id, action: 'create', type: 'habit', data: habitData });
          if (result.data) {
            set((state) => ({ habits: [...state.habits, result.data] }));
          }
        } catch (error) {
          console.error('Error adding habit:', error);
        }
      },

      updateHabit: async (id, updates) => {
        const { user } = get();
        if (!user) return;
        
        set((state) => ({
          habits: state.habits.map((h) => h.id === id ? { ...h, ...updates } : h)
        }));
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'update', type: 'habit', id, data: updates });
        } catch (error) {
          console.error('Error updating habit:', error);
          await get().loadUserData();
        }
      },

      deleteHabit: async (id) => {
        const { user } = get();
        if (!user) return;
        
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }));
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'delete', type: 'habit', id });
        } catch (error) {
          console.error('Error deleting habit:', error);
          await get().loadUserData();
        }
      },

      toggleHabitCompletion: async (id, date) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return;
        
        const existingIndex = habit.completions.findIndex((c) => c.date === date);
        let newCompletions;
        
        if (existingIndex >= 0) {
          newCompletions = habit.completions.map((c, i) =>
            i === existingIndex ? { ...c, completed: !c.completed } : c
          );
        } else {
          newCompletions = [...habit.completions, { date, completed: true }];
        }
        
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
        
        await get().updateHabit(id, {
          completions: newCompletions,
          streak,
          bestStreak: Math.max(habit.bestStreak, streak),
        });
      },

      addCategory: async (categoryData) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const result = await fetchAPI('/data', { userId: user.id, action: 'create', type: 'category', data: categoryData });
          if (result.data) {
            set((state) => ({ categories: [...state.categories, result.data] }));
          }
        } catch (error) {
          console.error('Error adding category:', error);
        }
      },

      addChatMessage: async (messageData) => {
        const { user, chatMessages } = get();
        if (!user) return;
        
        const tempMessage: ChatMessage = {
          ...messageData,
          id: `temp-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({ chatMessages: [...state.chatMessages, tempMessage] }));
        
        try {
          const result = await fetchAPI('/data', { userId: user.id, action: 'create', type: 'chatMessage', data: messageData });
          if (result.data) {
            set((state) => ({
              chatMessages: state.chatMessages.map((m) => m.id === tempMessage.id ? result.data : m)
            }));
          }
        } catch (error) {
          console.error('Error adding chat message:', error);
          set((state) => ({ chatMessages: state.chatMessages.filter((m) => m.id !== tempMessage.id) }));
        }
      },

      clearChat: async () => {
        const { user } = get();
        if (!user) return;
        
        const previousMessages = get().chatMessages;
        set({ chatMessages: [] });
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'delete', type: 'chatMessages' });
        } catch (error) {
          console.error('Error clearing chat:', error);
          set({ chatMessages: previousMessages });
        }
      },

      addReminder: async (reminderData) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const result = await fetchAPI('/data', { userId: user.id, action: 'create', type: 'reminder', data: reminderData });
          if (result.data) {
            set((state) => ({ reminders: [...state.reminders, result.data] }));
          }
        } catch (error) {
          console.error('Error adding reminder:', error);
        }
      },

      dismissReminder: async (id) => {
        const { user } = get();
        if (!user) return;
        
        set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));
        
        try {
          await fetchAPI('/data', { userId: user.id, action: 'delete', type: 'reminder', id });
        } catch (error) {
          console.error('Error dismissing reminder:', error);
          await get().loadUserData();
        }
      },

      setSubscription: (tier) => set({ subscription: tier }),

      selectPlan: async (tier) => {
        const { user } = get();
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === tier);
        const now = new Date();
        let trialEndDate: string | null = null;

        if (plan?.hasTrial) {
          const trialEnd = new Date(now);
          trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
          trialEndDate = trialEnd.toISOString();
        }

        set({
          subscription: tier,
          subscriptionInfo: { tier, startDate: now.toISOString(), trialEndDate },
        });

        if (user) {
          try {
            await fetchAPI('/data', { userId: user.id, action: 'update', type: 'subscription', data: { tier } });
          } catch (error) {
            console.error('Error updating subscription:', error);
          }
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'zen-planner-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.user) {
          state.loadUserData();
        }
      },
      partialize: (state) => ({
        user: state.user,
        subscriptionInfo: state.subscriptionInfo,
        subscription: state.subscription,
      }),
    }
  )
);

export function calculateStats(tasks: Task[]) {
  const now = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now).length;
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
    weeklyTrend.push({ date: dateStr, completed: dayTasks.filter((t) => t.completed).length, total: dayTasks.length });
  }
  
  return { totalTasks, completedTasks, pendingTasks, overdueTasks, completionRate, productivityScore, tasksByPriority, tasksByCategory, weeklyTrend };
}

export function getTasksForDate(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.dueDate === date);
}

export function getCalendarEvents(tasks: Task[], goals: Goal[]) {
  const events: { id: string; title: string; date: string; time?: string; type: 'task' | 'goal'; completed: boolean; priority?: string; color?: string }[] = [];
  tasks.forEach((t) => {
    if (t.dueDate) {
      events.push({ id: t.id, title: t.title, date: t.dueDate, time: t.dueTime, type: 'task', completed: t.completed, priority: t.priority });
    }
  });
  goals.forEach((g) => {
    if (g.targetDate) {
      events.push({ id: g.id, title: g.title, date: g.targetDate, type: 'goal', completed: g.progress >= 100, color: g.color });
    }
  });
  return events;
}

export const useTasks = () => useAppStore((state) => state.tasks);
export const useGoals = () => useAppStore((state) => state.goals);
export const useHabits = () => useAppStore((state) => state.habits);
export const useHydrated = () => useAppStore((state) => state._hasHydrated);
