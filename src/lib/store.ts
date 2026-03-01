import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Task, Goal, Habit, Category, ChatMessage } from './types';

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultCategories: Category[] = [
  { id: 'personal', name: 'Personal', color: '#8b5cf6' },
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'health', name: 'Health', color: '#22c55e' },
  { id: 'learning', name: 'Learning', color: '#f59e0b' },
  { id: 'other', name: 'Other', color: '#6b7280' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
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
      reorderTasks: (tasks) => { set({ tasks }); },

      goals: [],
      addGoal: (goalData) => {
        const newGoal: Goal = { ...goalData, id: generateId(), createdAt: new Date().toISOString(), progress: 0 };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },
      updateGoal: (id, updates) => {
        set((state) => ({ goals: state.goals.map((goal) => goal.id === id ? { ...goal, ...updates } : goal) }));
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
            const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0;
            return { ...goal, milestones: updatedMilestones, progress };
          }),
        }));
      },

      habits: [],
      addHabit: (habitData) => {
        const newHabit: Habit = { ...habitData, id: generateId(), createdAt: new Date().toISOString(), completions: [], streak: 0, bestStreak: 0 };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },
      updateHabit: (id, updates) => {
        set((state) => ({ habits: state.habits.map((habit) => habit.id === id ? { ...habit, ...updates } : habit) }));
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
              newCompletions = habit.completions.map((c, i) => i === existingIndex ? { ...c, completed: !c.completed } : c);
            } else {
              newCompletions = [...habit.completions, { date, completed: true }];
            }
            const today = new Date();
            let streak = 0;
            const sortedCompletions = [...newCompletions].filter((c) => c.completed).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            for (let i = 0; i < sortedCompletions.length; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(today.getDate() - i);
              const checkDateStr = checkDate.toISOString().split('T')[0];
              if (sortedCompletions.some((c) => c.date === checkDateStr && c.completed)) { streak++; } else { break; }
            }
            return { ...habit, completions: newCompletions, streak, bestStreak: Math.max(habit.bestStreak, streak) };
          }),
        }));
      },

      categories: defaultCategories,
      addCategory: (categoryData) => {
        const newCategory: Category = { ...categoryData, id: generateId() };
        set((state) => ({ categories: [...state.categories, newCategory] }));
      },

      chatMessages: [],
      addChatMessage: (messageData) => {
        const newMessage: ChatMessage = { ...messageData, id: generateId(), timestamp: new Date().toISOString() };
        set((state) => ({ chatMessages: [...state.chatMessages, newMessage] }));
      },
      clearChat: () => { set({ chatMessages: [] }); },

      activeTab: 'tasks',
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedDate: new Date().toISOString().split('T')[0],
      setSelectedDate: (date) => set({ selectedDate: date }),

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'zen-planner-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
      partialize: (state) => ({
        tasks: state.tasks, goals: state.goals, habits: state.habits,
        categories: state.categories, chatMessages: state.chatMessages,
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
  tasks.forEach((task) => { tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1; });
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
