'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { Goal, Milestone } from '@/lib/types';
import { format } from 'date-fns';
import {
  Plus,
  Target,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  ChevronRight,
  Calendar,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const goalColors = [
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
];

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
}

function GoalCard({ goal, onEdit, onDelete, onToggleMilestone }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="group"
    >
      <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: goal.color }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" style={{ color: goal.color }} />
                <h3 className="font-semibold">{goal.title}</h3>
              </div>
              {goal.description && (
                <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => onEdit(goal)} className="h-8 w-8 p-0">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>

          {/* Target Date & Milestones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {goal.targetDate && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
              </Badge>
            </div>
            {goal.milestones.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-7"
              >
                {expanded ? 'Hide' : 'Show'} milestones
                <ChevronRight
                  className={cn('h-4 w-4 ml-1 transition-transform', expanded && 'rotate-90')}
                />
              </Button>
            )}
          </div>

          {/* Milestones */}
          <AnimatePresence>
            {expanded && goal.milestones.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 pt-3 border-t space-y-2"
              >
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => onToggleMilestone(goal.id, milestone.id)}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        'text-sm flex-1',
                        milestone.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {milestone.title}
                    </span>
                    {milestone.targetDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(milestone.targetDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function GoalTracker() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(goalColors[0].value);
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');

  const openNewGoalDialog = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setColor(goalColors[0].value);
    setTargetDate(undefined);
    setMilestones([]);
    setIsDialogOpen(true);
  };

  const openEditGoalDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setColor(goal.color);
    setTargetDate(goal.targetDate ? new Date(goal.targetDate) : undefined);
    setMilestones(goal.milestones);
    setIsDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!title.trim()) return;

    if (editingGoal) {
      // Recalculate progress
      const completedCount = milestones.filter(m => m.completed).length;
      const progress = milestones.length > 0
        ? Math.round((completedCount / milestones.length) * 100)
        : editingGoal.progress;

      updateGoal(editingGoal.id, {
        title,
        description,
        color,
        targetDate: targetDate?.toISOString(),
        milestones,
        progress,
      });
    } else {
      addGoal({
        title,
        description,
        color,
        targetDate: targetDate?.toISOString(),
        milestones,
      });
    }

    setIsDialogOpen(false);
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones([
      ...milestones,
      {
        id: Math.random().toString(36).substring(2, 9),
        title: newMilestone,
        completed: false,
      },
    ]);
    setNewMilestone('');
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  // Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.progress === 100).length;
  const inProgressGoals = goals.filter(g => g.progress > 0 && g.progress < 100).length;
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Goals
          </CardTitle>
          <Button onClick={openNewGoalDialog} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{totalGoals}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{completedGoals}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{inProgressGoals}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-violet-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-violet-500">{avgProgress}%</div>
            <div className="text-xs text-muted-foreground">Avg Progress</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={openEditGoalDialog}
                  onDelete={deleteGoal}
                  onToggleMilestone={toggleMilestone}
                />
              ))}
            </AnimatePresence>
            {goals.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No goals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set your first goal to start tracking your long-term objectives.
                </p>
                <Button onClick={openNewGoalDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="What do you want to achieve?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your goal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {goalColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        color === c.value && 'ring-2 ring-offset-2 ring-foreground'
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={targetDate}
                      onSelect={setTargetDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Milestones</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a milestone..."
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                />
                <Button type="button" variant="outline" onClick={addMilestone}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <span className="text-sm">{m.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(m.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
