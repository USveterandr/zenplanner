'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, calculateStats, getTasksForDate, getCalendarEvents, SUBSCRIPTION_PLANS } from '@/lib/store';
import type { Priority } from '@/lib/store';
import {
  ListTodo, Sparkles, Target, Zap, BarChart3, Calendar, Crown,
  CheckCircle2, Plus, Circle, Flag, Trash2, Send, Bot, User,
  Loader2, Flame, ChevronLeft, ChevronRight, Bell,
  Check, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const tabs = [
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'ai', label: 'AI Advisor', icon: Sparkles },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'habits', label: 'Habits', icon: Zap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'pricing', label: 'Upgrade', icon: Crown },
];

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-500 hover:bg-red-600',
  medium: 'bg-amber-500 hover:bg-amber-600',
  low: 'bg-green-500 hover:bg-green-600',
};

const priorityTextColors: Record<Priority, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-green-500',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Home() {
  const {
    tasks, goals, habits, addTask, toggleTask, deleteTask,
    addGoal, addHabit, toggleHabitCompletion, addChatMessage, chatMessages,
    _hasHydrated, activeTab, setActiveTab, selectedDate, setSelectedDate,
    subscription, setSubscription
  } = useAppStore();
  
  const isMobile = useIsMobile();

  // All useState hooks MUST be before any conditional returns
  const [newTask, setNewTask] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('');
  const [taskReminder, setTaskReminder] = useState<number>(0);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // All useMemo hooks MUST be before any conditional returns
  const calendarEvents = useMemo(() => getCalendarEvents(tasks, goals), [tasks, goals]);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const todayTasks = useMemo(() => getTasksForDate(tasks, today), [tasks, today]);
  const selectedDateTasks = useMemo(() => selectedDate ? getTasksForDate(tasks, selectedDate) : [], [tasks, selectedDate]);
  const dueReminders = useMemo(() => tasks.filter(t => {
    if (t.completed || !t.dueDate || !t.reminderMinutesBefore) return false;
    const dueDateTime = new Date(`${t.dueDate}T${t.dueTime || '23:59'}`);
    const reminderTime = new Date(dueDateTime.getTime() - t.reminderMinutesBefore * 60000);
    const now = new Date();
    return now >= reminderTime && now <= dueDateTime;
  }), [tasks]);

  // Now we can do the conditional return AFTER all hooks
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading Zen Planner...</p>
        </div>
      </div>
    );
  }

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    addTask({
      title: newTask,
      completed: false,
      priority: taskPriority,
      category: 'personal',
      subtasks: [],
      dueDate: taskDueDate || undefined,
      dueTime: taskDueTime || undefined,
      reminderMinutesBefore: taskReminder || undefined,
    });
    setNewTask('');
    setTaskDueDate('');
    setTaskDueTime('');
    setTaskReminder(0);
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    addGoal({ title: newGoal, color: '#8b5cf6', milestones: [] });
    setNewGoal('');
  };

  const handleAddHabit = () => {
    if (!newHabit.trim()) return;
    addHabit({ title: newHabit, frequency: 'daily', color: '#22c55e' });
    setNewHabit('');
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    addChatMessage({ role: 'user', content: chatInput });
    setChatInput('');
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context: {
            tasks: tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed, priority: t.priority })),
            goals: goals.map(g => ({ id: g.id, title: g.title, progress: g.progress })),
            habits: habits.map(h => ({ id: h.id, title: h.title, streak: h.streak })),
          },
        }),
      });
      const data = await response.json();
      if (data.success) {
        addChatMessage({ role: 'assistant', content: data.response });
      } else {
        addChatMessage({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
      }
    } catch {
      addChatMessage({ role: 'assistant', content: 'Connection error. Please try again.' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/30 rounded-lg" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter(e => e.date === dateStr);
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={cn(
            'h-24 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md overflow-hidden',
            isToday && 'border-violet-500 border-2',
            isSelected && 'bg-violet-100 dark:bg-violet-900/30',
            !isSelected && !isToday && 'bg-card hover:bg-accent'
          )}
        >
          <div className={cn('text-sm font-medium mb-1', isToday && 'text-violet-600')}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  'text-xs px-1 py-0.5 rounded truncate',
                  event.type === 'task' && !event.completed && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                  event.type === 'task' && event.completed && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 line-through',
                  event.type === 'goal' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                )}
              >
                {event.time && <span className="mr-1">{event.time}</span>}
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderPricing = () => (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">Unlock premium features and boost your productivity</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col',
              plan.highlighted && 'border-violet-500 border-2 shadow-lg scale-105',
              subscription === plan.id && 'ring-2 ring-violet-500'
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-violet-500">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                onClick={() => setSubscription(plan.id)}
                disabled={subscription === plan.id}
              >
                {subscription === plan.id ? (
                  <>Current Plan</>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {subscription !== 'free' && (
        <div className="mt-4 text-center">
          <Badge variant="outline" className="bg-violet-500/10 text-violet-600">
            <Crown className="h-3 w-3 mr-1" />
            Current Plan: {SUBSCRIPTION_PLANS.find(p => p.id === subscription)?.name || 'Free'}
          </Badge>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-violet-500" /> Tasks
              {dueReminders.length > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  {dueReminders.length} due
                </Badge>
              )}
            </h2>

            <div className="flex gap-2 mb-2">
              <Input placeholder="Add a new task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} className="flex-1" />
              <Button onClick={handleAddTask}><Plus className="h-4 w-4" /></Button>
            </div>

            <div className="flex gap-2 mb-2 flex-wrap">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <Button key={p} variant={taskPriority === p ? 'default' : 'outline'} size="sm" onClick={() => setTaskPriority(p)} className={cn(taskPriority === p && priorityColors[p])}>
                  <Flag className="h-3 w-3 mr-1" />{p}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-40" />
              <Input type="time" value={taskDueTime} onChange={(e) => setTaskDueTime(e.target.value)} className="w-32" />
              <select
                value={taskReminder}
                onChange={(e) => setTaskReminder(Number(e.target.value))}
                className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value={0}>No reminder</option>
                <option value={5}>5 min before</option>
                <option value={15}>15 min before</option>
                <option value={30}>30 min before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {tasks.map((task) => (
                    <motion.div key={task.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                      className={cn('group flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all', task.completed && 'opacity-60')}>
                      <button onClick={() => toggleTask(task.id)}>
                        {task.completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={cn('block truncate', task.completed && 'line-through')}>{task.title}</span>
                        {(task.dueDate || task.reminderMinutesBefore) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {task.dueDate}{task.dueTime && ` ${task.dueTime}`}
                              </span>
                            )}
                            {task.reminderMinutesBefore && (
                              <span className="flex items-center gap-1">
                                <Bell className="h-3 w-3" />
                                {task.reminderMinutesBefore >= 60 ? `${task.reminderMinutesBefore / 60}h` : `${task.reminderMinutesBefore}m`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Flag className={cn('h-4 w-4 shrink-0', priorityTextColors[task.priority])} />
                      <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 shrink-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {tasks.length === 0 && <div className="text-center py-8 text-muted-foreground">No tasks yet. Add your first task above!</div>}
              </div>
            </ScrollArea>
          </div>
        );

      case 'calendar':
        return (
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-500" /> Calendar
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                  else { setCalendarMonth(calendarMonth - 1); }
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[140px] text-center">{MONTHS[calendarMonth]} {calendarYear}</span>
                <Button variant="outline" size="sm" onClick={() => {
                  if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                  else { setCalendarMonth(calendarMonth + 1); }
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 flex-1 overflow-auto">
              {renderCalendar()}
            </div>

            {selectedDate && selectedDateTasks.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {selectedDate === today ? 'Today' : selectedDate} - {selectedDateTasks.length} task(s)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedDateTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm">
                        <button onClick={() => toggleTask(task.id)}>
                          {task.completed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        <span className={cn(task.completed && 'line-through')}>{task.title}</span>
                        {task.dueTime && <span className="text-muted-foreground text-xs">{task.dueTime}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'ai':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" /> AI Advisor
            </h2>
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-violet-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Hi! I'm your AI productivity advisor. Ask me anything!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', msg.role === 'user' ? 'bg-violet-500' : 'bg-gradient-to-br from-violet-500 to-indigo-600')}>
                        {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                      </div>
                      <div className={cn('max-w-[80%] rounded-2xl px-4 py-2', msg.role === 'user' ? 'bg-violet-500 text-white' : 'bg-muted')}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input placeholder="Ask AI for advice..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} disabled={isAiLoading} />
              <Button onClick={sendChatMessage} disabled={isAiLoading || !chatInput.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" /> Goals
            </h2>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Add a new goal..." value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()} className="flex-1" />
              <Button onClick={handleAddGoal}><Plus className="h-4 w-4" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {goals.map((goal) => (
                  <Card key={goal.id} className="border-l-4" style={{ borderLeftColor: goal.color }}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{goal.title}</h3>
                      <div className="flex items-center gap-2">
                        <Progress value={goal.progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {goals.length === 0 && <div className="text-center py-8 text-muted-foreground">No goals yet. Set your first goal above!</div>}
              </div>
            </ScrollArea>
          </div>
        );

      case 'habits':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" /> Habits
            </h2>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Add a new habit..." value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()} className="flex-1" />
              <Button onClick={handleAddHabit}><Plus className="h-4 w-4" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {habits.map((habit) => {
                  const isCompletedToday = habit.completions.some(c => c.date === today && c.completed);
                  return (
                    <Card key={habit.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleHabitCompletion(habit.id, today)} className={isCompletedToday ? 'text-green-500' : 'text-muted-foreground'}>
                              {isCompletedToday ? <CheckCircle2 className="h-6 w-6" style={{ color: habit.color }} /> : <Circle className="h-6 w-6" />}
                            </button>
                            <span className="font-medium">{habit.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">{habit.streak}</span>
                            </div>
                            <Badge variant="outline">{habit.frequency}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {habits.length === 0 && <div className="text-center py-8 text-muted-foreground">No habits yet. Start tracking your first habit above!</div>}
              </div>
            </ScrollArea>
          </div>
        );

      case 'analytics':
        return (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" /> Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{stats.productivityScore}</div>
                  <div className="text-sm text-muted-foreground">Productivity Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{stats.totalTasks}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-green-500">{stats.completedTasks}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/10">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-amber-500">{stats.pendingTasks}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
            </div>
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Completion Rate</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={stats.completionRate} className="flex-1 h-3" />
                  <span className="text-2xl font-bold">{stats.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tasks by Priority</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500">High</Badge>
                    <Progress value={(stats.tasksByPriority.high / (stats.totalTasks || 1)) * 100} className="flex-1 h-2" />
                    <span className="text-sm">{stats.tasksByPriority.high}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500">Medium</Badge>
                    <Progress value={(stats.tasksByPriority.medium / (stats.totalTasks || 1)) * 100} className="flex-1 h-2" />
                    <span className="text-sm">{stats.tasksByPriority.medium}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Low</Badge>
                    <Progress value={(stats.tasksByPriority.low / (stats.totalTasks || 1)) * 100} className="flex-1 h-2" />
                    <span className="text-sm">{stats.tasksByPriority.low}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'pricing':
        return renderPricing();

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Zen Planner</h1>
                <p className="text-xs text-white/80">AI-Powered Productivity</p>
              </div>
            </div>
            {!isMobile && (
              <nav className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <Button key={tab.id} variant="ghost" onClick={() => setActiveTab(tab.id)}
                    className={cn('text-white hover:bg-white/10 gap-2', activeTab === tab.id && 'bg-white/20')}>
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === 'pricing' && subscription === 'free' && (
                      <Badge className="bg-amber-500 text-xs ml-1">NEW</Badge>
                    )}
                  </Button>
                ))}
              </nav>
            )}
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium">{pendingTasks} pending</span>
              </div>
              {subscription !== 'free' && (
                <Badge className="bg-amber-500">
                  <Crown className="h-3 w-3 mr-1" />
                  {SUBSCRIPTION_PLANS.find(p => p.id === subscription)?.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Card className="h-[calc(100vh-140px)] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="h-full">
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </Card>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-30">
          <div className="flex justify-around py-2">
            {tabs.map((tab) => (
              <Button key={tab.id} variant="ghost" onClick={() => setActiveTab(tab.id)}
                className={cn('flex flex-col items-center gap-1 py-2 px-2 h-auto', activeTab === tab.id ? 'text-primary' : 'text-muted-foreground')}>
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
