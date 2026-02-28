'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import TaskManager from '@/components/TaskManager';
import AIAdvisor from '@/components/AIAdvisor';
import GoalTracker from '@/components/GoalTracker';
import HabitTracker from '@/components/HabitTracker';
import CalendarView from '@/components/CalendarView';
import Analytics from '@/components/Analytics';
import {
  ListTodo,
  Sparkles,
  Target,
  Zap,
  Calendar,
  BarChart3,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const tabs = [
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'ai', label: 'AI Advisor', icon: Sparkles },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'habits', label: 'Habits', icon: Zap },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Home() {
  const { activeTab, setActiveTab, _hasHydrated, tasks } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Handler to change tab and close sidebar on mobile
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Show loading state until hydration is complete
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading Zen Planner...</p>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => !t.completed).length;

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskManager />;
      case 'ai':
        return <AIAdvisor />;
      case 'goals':
        return <GoalTracker />;
      case 'habits':
        return <HabitTracker />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <Analytics />;
      default:
        return <TaskManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-white hover:bg-white/10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Zen Planner</h1>
                  <p className="text-xs text-white/80">AI-Powered Productivity</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'text-white hover:bg-white/10 gap-2',
                      activeTab === tab.id && 'bg-white/20'
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
              </nav>
            )}

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium">{pendingTasks} pending</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar for Desktop */}
        {!isMobile && (
          <aside className="w-64 min-h-[calc(100vh-73px)] bg-card border-r p-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                  onClick={() => handleTabChange(tab.id)}
                  className="w-full justify-start gap-3"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Quick Stats in Sidebar */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium text-sm mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tasks</span>
                  <span className="font-medium">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-500">
                    {tasks.filter(t => t.completed).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-amber-500">{pendingTasks}</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 shadow-xl"
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="p-4 space-y-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                      onClick={() => handleTabChange(tab.id)}
                      className="w-full justify-start gap-3"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </Button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <Card className="h-[calc(100vh-120px)] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </Card>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-30">
          <div className="flex justify-around py-2">
            {tabs.slice(0, 5).map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-3 h-auto',
                  activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
