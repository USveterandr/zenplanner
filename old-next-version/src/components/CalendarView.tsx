'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Flag,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
};

export default function CalendarView() {
  const { tasks, toggleTask, setSelectedDate, selectedDate } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate && !task.completed) return false;
      const taskDate = task.dueDate ? parseISO(task.dueDate) : null;
      return taskDate && isSameDay(taskDate, selectedDate);
    });
  }, [tasks, selectedDate]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  // Stats for the month
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
    });

    const completed = monthTasks.filter((t) => t.completed).length;
    const total = monthTasks.length;

    return {
      total,
      completed,
      pending: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks, currentMonth]);

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
              }}
            >
              Today
            </Button>
          </div>
        </div>

        {/* Month Stats */}
        <div className="flex items-center gap-6 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">{monthStats.total} tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{monthStats.completed} completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{monthStats.pending} pending</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex gap-4 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map((date) => {
              const dayTasks = getTasksForDate(date);
              const _hasCompleted = dayTasks.some((t) => t.completed);
              const _hasPending = dayTasks.some((t) => !t.completed);
              const isSelected = isSameDay(date, parseISO(selectedDate));
              const isCurrentMonth = isSameMonth(date, currentMonth);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    'relative p-2 rounded-lg text-sm transition-all h-full min-h-[80px] flex flex-col',
                    isCurrentMonth ? 'hover:bg-muted' : 'opacity-40 hover:bg-muted/50',
                    isSelected && 'bg-primary/10 ring-2 ring-primary',
                    isToday(date) && !isSelected && 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'font-medium mb-1',
                      isToday(date) && 'text-primary'
                    )}
                  >
                    {format(date, 'd')}
                  </span>

                  {/* Task indicators */}
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'w-full h-1.5 rounded-full',
                          task.completed ? 'bg-green-500/50' : priorityColors[task.priority]
                        )}
                        title={task.title}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="w-80 border-l pl-4 flex flex-col">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>{format(parseISO(selectedDate), 'EEEE')}</span>
            <Badge variant="secondary">{format(parseISO(selectedDate), 'MMM d')}</Badge>
          </h3>

          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              <AnimatePresence mode="popLayout">
                {selectedDateTasks.length > 0 ? (
                  selectedDateTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className={cn(
                        'p-3 rounded-lg border bg-card hover:shadow-sm transition-all',
                        task.completed && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button onClick={() => toggleTask(task.id)} className="mt-0.5">
                          {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium text-sm truncate',
                              task.completed && 'line-through'
                            )}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {task.category}
                            </Badge>
                            <Flag
                              className={cn(
                                'h-3 w-3',
                                task.priority === 'high' && 'text-red-500',
                                task.priority === 'medium' && 'text-amber-500',
                                task.priority === 'low' && 'text-green-500'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks for this day</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </div>
  );
}

// Helper function
function isWithinInterval(date: Date, interval: { start: Date; end: Date }) {
  return date >= interval.start && date <= interval.end;
}
