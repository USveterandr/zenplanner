'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, calculateStats } from '@/lib/store';
import type { AIInsight } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Award,
  RefreshCw,
  Sparkles,
  BarChart3,
  PieChartIcon,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

interface AnalysisResult {
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    priorityDistribution: { high: number; medium: number; low: number };
    categoryDistribution: Record<string, number>;
    totalGoals: number;
    avgGoalProgress: number;
    totalHabits: number;
    avgStreak: number;
    activeStreaks: number;
  };
  productivityScore: number;
  insights: AIInsight[];
  recommendations: string[];
}

export default function Analytics() {
  const { tasks, goals, habits } = useAppStore();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate local stats
  const localStats = useMemo(() => calculateStats(tasks), [tasks]);

  // Fetch AI analysis
  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, goals, habits }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tasks, goals, habits]);

  useEffect(() => {
    if (tasks.length > 0 || goals.length > 0 || habits.length > 0) {
      fetchAnalysis();
    }
  }, [fetchAnalysis, tasks.length, goals.length, habits.length]);

  // Prepare chart data
  const priorityData = useMemo(() => [
    { name: 'High', value: localStats.tasksByPriority.high, color: '#ef4444' },
    { name: 'Medium', value: localStats.tasksByPriority.medium, color: '#f59e0b' },
    { name: 'Low', value: localStats.tasksByPriority.low, color: '#22c55e' },
  ], [localStats]);

  const categoryData = useMemo(() => {
    return Object.entries(localStats.tasksByCategory).map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [localStats]);

  const weeklyData = useMemo(() => {
    return localStats.weeklyTrend.map(d => ({
      ...d,
      day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    }));
  }, [localStats]);

  const insightIcons = {
    tip: Lightbulb,
    warning: AlertCircle,
    achievement: Award,
    suggestion: Target,
  };

  const insightColors = {
    tip: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    warning: 'bg-red-500/10 text-red-500 border-red-500/20',
    achievement: 'bg-green-500/10 text-green-500 border-green-500/20',
    suggestion: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-500" />
            Analytics
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-linear-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-violet-500/20 mb-8 border border-white/10 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                  <span className="text-sm text-violet-200">Productivity Score</span>
                </div>
                <div className="text-3xl font-bold">
                  {analysis?.productivityScore ?? localStats.productivityScore}
                </div>
                <Progress
                  value={analysis?.productivityScore ?? localStats.productivityScore}
                  className="mt-2 h-1.5 bg-violet-300/30 [&::-webkit-progress-bar]:bg-violet-300/30 [&::-webkit-progress-value]:bg-white [&::-moz-progress-bar]:bg-white"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-muted/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Tasks</span>
                </div>
                <div className="text-3xl font-bold">{localStats.totalTasks}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {localStats.completedTasks} completed
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-muted/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Completion</span>
                </div>
                <div className="text-3xl font-bold">{localStats.completionRate}%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {localStats.pendingTasks} pending
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-muted/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-muted-foreground">Overdue</span>
                </div>
                <div className="text-3xl font-bold">{localStats.overdueTasks}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Need attention
                </div>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weekly Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Weekly Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-amber-500" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {priorityData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Distribution */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Tasks by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            {analysis?.insights && analysis.insights.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.insights.map((insight, index) => {
                      const Icon = insightIcons[insight.type];
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            'p-3 rounded-lg border',
                            insightColors[insight.type]
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-sm">{insight.title}</h4>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {insight.description}
                              </p>
                              {insight.actionable && insight.action && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {insight.action}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysis?.recommendations && analysis.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {tasks.length === 0 && goals.length === 0 && habits.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No data yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Add some tasks, goals, or habits to see your productivity analytics.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  );
}
