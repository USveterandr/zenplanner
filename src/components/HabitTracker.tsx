'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { Habit, HabitFrequency } from '@/lib/types';
import {
  format,
  subDays,
} from 'date-fns';
import {
  Plus,
  Flame,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const habitColors = [
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
];

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, date: string) => void;
}

function HabitCard({ habit, onEdit, onDelete, onToggle }: HabitCardProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Generate last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  const isCompletedToday = habit.completions.some(
    (c) => c.date === todayStr && c.completed
  );

  const completed = habit.completions.filter((c) => c.completed).length;
  const total = habit.completions.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggle(habit.id, todayStr)}
                className="shrink-0"
              >
                {isCompletedToday ? (
                  <CheckCircle2 className="h-6 w-6" style={{ color: habit.color }} />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground hover:opacity-80 transition-opacity" />
                )}
              </button>
              <div>
                <h3 className="font-semibold">{habit.title}</h3>
                {habit.description && (
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(habit)} className="h-8 w-8 p-0">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(habit.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Streak & Stats */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{habit.streak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">{completionRate}%</span>
              <span className="text-sm text-muted-foreground">completion</span>
            </div>
            {habit.bestStreak > 0 && (
              <Badge variant="outline" className="text-xs">
                Best: {habit.bestStreak} days
              </Badge>
            )}
          </div>

          {/* Last 7 Days */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {last7Days.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const completion = habit.completions.find((c) => c.date === dateStr);
                const isToday = format(today, 'yyyy-MM-dd') === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => onToggle(habit.id, dateStr)}
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center transition-all',
                      completion?.completed
                        ? 'text-white'
                        : 'bg-muted hover:bg-muted/80',
                      isToday && 'ring-2 ring-foreground/20'
                    )}
                    style={
                      completion?.completed
                        ? { backgroundColor: habit.color }
                        : undefined
                    }
                    title={format(date, 'EEE, MMM d')}
                  >
                    <span className="text-xs font-medium">
                      {format(date, 'd')}
                    </span>
                  </button>
                );
              })}
            </div>
            <Badge variant="secondary" className="text-xs capitalize">
              {habit.frequency}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function HabitTracker() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitCompletion } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [color, setColor] = useState(habitColors[0].value);

  const openNewHabitDialog = () => {
    setEditingHabit(null);
    setTitle('');
    setDescription('');
    setFrequency('daily');
    setColor(habitColors[0].value);
    setIsDialogOpen(true);
  };

  const openEditHabitDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setDescription(habit.description || '');
    setFrequency(habit.frequency);
    setColor(habit.color);
    setIsDialogOpen(true);
  };

  const handleSaveHabit = () => {
    if (!title.trim()) return;

    if (editingHabit) {
      updateHabit(editingHabit.id, {
        title,
        description,
        frequency,
        color,
      });
    } else {
      addHabit({
        title,
        description,
        frequency,
        color,
      });
    }

    setIsDialogOpen(false);
  };

  // Stats
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const completedToday = habits.filter((h) =>
    h.completions.some((c) => c.date === todayStr && c.completed)
  ).length;
  const _totalStreaks = habits.reduce((sum, h) => sum + h.streak, 0);
  const activeStreaks = habits.filter((h) => h.streak > 0).length;
  const bestOverallStreak = Math.max(...habits.map((h) => h.bestStreak), 0);

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Habits
          </CardTitle>
          <Button onClick={openNewHabitDialog} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Habit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{habits.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{completedToday}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">{activeStreaks}</div>
            <div className="text-xs text-muted-foreground">Active Streaks</div>
          </div>
          <div className="bg-violet-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-violet-500">{bestOverallStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onEdit={openEditHabitDialog}
                  onDelete={deleteHabit}
                  onToggle={toggleHabitCompletion}
                />
              ))}
            </AnimatePresence>
            {habits.length === 0 && (
              <div className="text-center py-12">
                <Flame className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No habits yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start building good habits by adding your first one.
                </p>
                <Button onClick={openNewHabitDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Habit
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Habit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingHabit ? 'Edit Habit' : 'New Habit'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Read 30 minutes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="Add details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as HabitFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {habitColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        color === c.value && 'ring-2 ring-offset-2 ring-foreground'
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHabit}>
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
