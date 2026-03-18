'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, calculateStats, getTasksForDate, getCalendarEvents, SUBSCRIPTION_PLANS, isTrialActive, getTrialDaysRemaining } from '@/lib/store';
import type { Priority, SubscriptionTier } from '@/lib/store';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { useTranslation } from '@/hooks/use-translation';
import { getSupabaseClient } from '@/lib/supabase';
import {
  ListTodo, Sparkles, Target, Zap, BarChart3, Calendar, Crown,
  CheckCircle2, Plus, Circle, Flag, Trash2, Send, Bot, User,
  Loader2, Flame, ChevronLeft, ChevronRight, Bell,
  Check, CreditCard, LogOut, Mail, Lock, UserPlus, LogIn, Eye, EyeOff, Clock, Users, Settings, Share2, Download, Camera, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

const DAYS_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Home() {
  const {
    tasks, goals, habits, categories,
    addTask, updateTask, toggleTask, deleteTask,
    addGoal, updateGoal, deleteGoal,
    addHabit, updateHabit, deleteHabit, toggleHabitCompletion,
    addChatMessage, chatMessages,
    _hasHydrated: storeHasHydrated, activeTab, setActiveTab, selectedDate, setSelectedDate,
    subscription, setSubscription, user, signUp, signIn, signOut,
    subscriptionInfo, selectPlan, teamMembers, canAddGoal, canAddHabit,
    setLocale, locale, timeFormat, setTimeFormat,
    lastError, clearLastError, updateProfile,
  } = useAppStore();

  // Local hydration status for Next.js consistency
  const [isHydrated, setIsHydrated] = useState(false);
  const [bypassStoreHydration, setBypassStoreHydration] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
    // Safety fallback: if store rehydration is extremely slow or stuck, move past the loading screen
    const timer = setTimeout(() => {
      setBypassStoreHydration(true);
    }, 1000);

    const supabase = getSupabaseClient();

    // ── Token bridge for iPhone PWA ──────────────────────────────────────────
    // When a user signs in via Google OAuth from the PWA on iPhone, iOS opens the
    // OAuth flow in Safari (not inside the PWA). The /auth/confirm page exchanges
    // the code in Safari's context, then redirects here with sb_access_token and
    // sb_refresh_token as query params so the PWA can receive the tokens.
    // We detect those params, call setSession() to write them into THIS context's
    // localStorage, populate the store, then strip the params from the URL.
    const urlParams = new URLSearchParams(window.location.search);
    const bridgeAccessToken = urlParams.get('sb_access_token');
    const bridgeRefreshToken = urlParams.get('sb_refresh_token');

    if (bridgeAccessToken && bridgeRefreshToken && supabase) {
      supabase.auth.setSession({
        access_token: bridgeAccessToken,
        refresh_token: bridgeRefreshToken,
      }).then(async ({ data, error }) => {
        if (!error && data.session) {
          const { user: sbUser, session } = data;
          if (sbUser) {
            const name =
              (sbUser.user_metadata?.full_name as string | undefined) ||
              (sbUser.user_metadata?.name as string | undefined) ||
              sbUser.email?.split('@')[0] ||
              'User';
            useAppStore.setState({
              user: { id: sbUser.id, name, email: sbUser.email ?? '' },
              accessToken: session.access_token,
            });
            await useAppStore.getState().loadUserData();
          }
        }
        // Always clean the tokens from the URL regardless of outcome
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('sb_access_token');
        cleanUrl.searchParams.delete('sb_refresh_token');
        window.history.replaceState({}, '', cleanUrl.toString());
      });
      return () => clearTimeout(timer);
    }

    // On mount, ask Supabase for the current session and sync the (possibly refreshed)
    // access token into the store. This handles stale persisted tokens automatically.
    // For OAuth users on iPhone (Safari ITP can wipe the session), if no session is
    // found and the store still thinks the user is logged in, auto sign-out so they
    // get a clear prompt to re-login instead of cryptic save errors.
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentToken = useAppStore.getState().accessToken;
        const currentUser = useAppStore.getState().user;
        const isReviewer = currentToken === 'reviewer-bypass-token';

        if (session?.access_token) {
          useAppStore.setState({ accessToken: session.access_token });
        } else if (currentUser && !isReviewer && !session) {
          // User appears logged-in but Supabase has no valid session.
          // This happens on iPhone when Safari ITP clears localStorage.
          // Sign them out cleanly and show a helpful message.
          useAppStore.getState().signOut().then(() => {
            toast.error('Your session expired. Please sign in again.');
          });
        }
      });
    }

    return () => clearTimeout(timer);
  }, []);

  // Listen for Supabase auth state changes (handles OAuth redirect + token refresh)
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Always keep the stored access token in sync when Supabase refreshes it
        if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          useAppStore.setState({ accessToken: session.access_token });
          return;
        }

        // OAuth sign-in redirect — set up the user for the first time
        if (event === 'SIGNED_IN' && session?.user && !user) {
          const { id, email, user_metadata } = session.user;
          const name =
            (user_metadata?.full_name as string | undefined) ||
            (user_metadata?.name as string | undefined) ||
            email?.split('@')[0] ||
            'User';

          // Ensure D1 row exists for OAuth users via the existing login endpoint
          // and retrieve any saved profile fields (avatarUrl, profession, hobbies)
          let profile: { name?: string; avatarUrl?: string; profession?: string; hobbies?: string } = {};
          try {
            const res = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'oauth_sync', userId: id, email, name }),
            });
            const data = await res.json() as { success: boolean; profile?: typeof profile };
            if (data.profile) profile = data.profile;
            // Best-effort — ignore errors here
          } catch { /* noop */ }

          useAppStore.setState({
            user: { 
              id, 
              name: profile.name || name, 
              email: email ?? '',
              avatarUrl: profile.avatarUrl,
              profession: profile.profession,
              hobbies: profile.hobbies,
            },
            accessToken: session.access_token ?? null,
          });
          await useAppStore.getState().loadUserData();
        }
      }
    );

    return () => authSub.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a toast whenever a save operation fails
  useEffect(() => {
    if (lastError) {
      toast.error(lastError);
      clearLastError();
    }
  }, [lastError, clearLastError]);
  
  const _hasHydrated = isHydrated && (storeHasHydrated || bypassStoreHydration);
  
  const { tr, t } = useTranslation();

  const tabs = [
    { id: 'tasks', label: tr.tasks, icon: ListTodo },
    { id: 'calendar', label: tr.calendar, icon: Calendar },
    { id: 'ai', label: tr.aiAdvisor, icon: Sparkles },
    { id: 'goals', label: tr.goals, icon: Target },
    { id: 'habits', label: tr.habits, icon: Zap },
    { id: 'analytics', label: tr.analytics, icon: BarChart3 },
    { id: 'team', label: tr.team, icon: Users },
    { id: 'settings', label: tr.settings, icon: Settings },
    { id: 'pricing', label: tr.about, icon: Crown },
    { id: 'install', label: tr.install, icon: Download },
  ];
  
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
  
  // Calendar quick-add state
  const [showQuickAddTask, setShowQuickAddTask] = useState(false);
  const [showQuickAddGoal, setShowQuickAddGoal] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddDate, setQuickAddDate] = useState('');
  
  // Team state
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signup');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editProfession, setEditProfession] = useState('');
  const [editHobbies, setEditHobbies] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const formatTime = (time: string) => {
    if (!time || timeFormat === '24h') return time;
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  // Task filter/search state
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskFilterPriority, setTaskFilterPriority] = useState<'all' | Priority>('all');
  const [taskCategory, setTaskCategory] = useState('personal');

  // Task edit modal state
  const [editingTask, setEditingTask] = useState<import('@/lib/store').Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>('medium');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskDueTime, setEditTaskDueTime] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('personal');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  // Goal edit modal state
  const [editingGoal, setEditingGoal] = useState<import('@/lib/store').Goal | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalColor, setEditGoalColor] = useState('#8b5cf6');
  const [editGoalTargetDate, setEditGoalTargetDate] = useState('');
  const [editGoalProgress, setEditGoalProgress] = useState(0);
  const [newMilestone, setNewMilestone] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#8b5cf6');

  // Habit edit modal state
  const [editingHabit, setEditingHabit] = useState<import('@/lib/store').Habit | null>(null);
  const [editHabitTitle, setEditHabitTitle] = useState('');
  const [editHabitFrequency, setEditHabitFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [editHabitColor, setEditHabitColor] = useState('#22c55e');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newHabitColor, setNewHabitColor] = useState('#22c55e');

  // All useMemo hooks MUST be before any conditional returns
  const calendarEvents = useMemo(() => getCalendarEvents(tasks, goals), [tasks, goals]);
  const today = useMemo(() => {
    if (!isHydrated) return '';
    return new Date().toISOString().split('T')[0];
  }, [isHydrated]);
  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const todayTasks = useMemo(() => getTasksForDate(tasks, today), [tasks, today]);
  const selectedDateTasks = useMemo(() => selectedDate ? getTasksForDate(tasks, selectedDate) : [], [tasks, selectedDate]);
  const trialActive = useMemo(() => isTrialActive(subscriptionInfo), [subscriptionInfo]);
  const trialDaysLeft = useMemo(() => getTrialDaysRemaining(subscriptionInfo), [subscriptionInfo]);
  const dueReminders = useMemo(() => {
    if (!isHydrated) return [];
    return tasks.filter(t => {
      if (t.completed || !t.dueDate || !t.reminderMinutesBefore) return false;
      const dueDateTime = new Date(`${t.dueDate}T${t.dueTime || '23:59'}`);
      const reminderTime = new Date(dueDateTime.getTime() - t.reminderMinutesBefore * 60000);
      const now = new Date();
      return now >= reminderTime && now <= dueDateTime;
    });
  }, [tasks, isHydrated]);

  // Now we can do the conditional return AFTER all hooks
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-violet-700 dark:text-slate-400">{tr.loading}</p>
        </div>
      </div>
    );
  }

  // Auth handlers
  const handleSignUp = async () => {
    setAuthError('');
    if (!authName.trim()) { setAuthError(tr.nameRequired); return; }
    if (!authEmail.trim()) { setAuthError(tr.emailRequired); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) { setAuthError(tr.validEmail); return; }
    if (authPassword.length < 6) { setAuthError(tr.passwordLength); return; }
    if (authPassword !== authConfirmPassword) { setAuthError(tr.passwordsNoMatch); return; }
    const result = await signUp(authName.trim(), authEmail.trim().toLowerCase(), authPassword);
    if (!result.success) { setAuthError(result.error || tr.signUpFailed); return; }
    setAuthName(''); setAuthEmail(''); setAuthPassword(''); setAuthConfirmPassword('');
  };

  const handleSignIn = async () => {
    setAuthError('');
    if (!authEmail.trim()) { setAuthError(tr.emailRequired); return; }
    if (!authPassword.trim()) { setAuthError(tr.passwordRequired); return; }
    const result = await signIn(authEmail.trim().toLowerCase(), authPassword);
    if (!result.success) { setAuthError(result.error || tr.signInFailed); return; }
    setAuthEmail(''); setAuthPassword('');
  };

  const handleForgotPassword = async () => {
    setAuthError('');
    if (!authEmail.trim()) { setAuthError(tr.resetEmailRequired); return; }
    try {
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim().toLowerCase() }),
      });
      const data = await res.json() as { success: boolean; resetUrl: string | null; error?: string };
      if (res.ok && data.success) {
        setResetUrl(data.resetUrl ?? '');
        setForgotSent(true);
      } else {
        setAuthError(data.error || tr.resetRequestFailed);
      }
    } catch {
      setAuthError(tr.resetRequestFailed);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    const supabase = getSupabaseClient();
    if (!supabase) { setAuthError('Auth not available'); return; }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) setAuthError(error.message);
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    // All features are now free - just update the subscription
    selectPlan(tier);
  };

  // Quick add handlers for calendar
  const handleQuickAddTask = async () => {
    if (!quickAddTitle.trim() || !quickAddDate) return;
    await addTask({
      title: quickAddTitle.trim(),
      completed: false,
      priority: 'medium',
      category: 'personal',
      subtasks: [],
      dueDate: quickAddDate,
    });
    setQuickAddTitle('');
    setShowQuickAddTask(false);
  };

  const handleQuickAddGoal = async () => {
    if (!quickAddTitle.trim() || !quickAddDate) return;
    await addGoal({
      title: quickAddTitle.trim(),
      color: '#8b5cf6',
      milestones: [],
      targetDate: quickAddDate,
    });
    setQuickAddTitle('');
    setShowQuickAddGoal(false);
  };

  const openQuickAddTask = (date: string) => {
    setQuickAddDate(date);
    setQuickAddTitle('');
    setShowQuickAddTask(true);
  };

  const openQuickAddGoal = (date: string) => {
    setQuickAddDate(date);
    setQuickAddTitle('');
    setShowQuickAddGoal(true);
  };

  // If not logged in, show auth screen
  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-violet-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{tr.appName}</h1>
            <p className="text-muted-foreground mt-1">{tr.appTagline}</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">
                {authMode === 'signup' ? tr.createAccount : authMode === 'forgot' ? tr.forgotPasswordTitle : tr.welcomeBack}
              </CardTitle>
              <CardDescription>
                {authMode === 'signup' ? tr.startJourney : authMode === 'forgot' ? tr.forgotPasswordDesc : tr.continueWhereLeft}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
                  {authError}
                </div>
              )}

              {/* ---- FORGOT PASSWORD MODE ---- */}
              {authMode === 'forgot' && (
                <>
                  {forgotSent ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <div className="text-4xl">🔑</div>
                      <p className="font-medium text-gray-800">{tr.resetLinkSent}</p>
                      {resetUrl ? (
                        <a
                          href={resetUrl}
                          className="mt-1 w-full break-all rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700 hover:bg-violet-100 text-center block"
                        >
                          {tr.tapToReset}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{tr.resetLinkSentDesc}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{tr.emailAddress}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  {!forgotSent && (
                    <Button
                      className="w-full bg-linear-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
                      size="lg"
                      onClick={handleForgotPassword}
                    >
                      {tr.sendResetLink}
                    </Button>
                  )}
                </>
              )}

              {/* ---- SIGN UP / SIGN IN MODE ---- */}
              {authMode !== 'forgot' && (
                <>
                  {authMode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{tr.fullName}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="John Doe"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{tr.emailAddress}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (authMode === 'signup' ? handleSignUp() : handleSignIn())}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">{tr.password}</label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => { setAuthMode('forgot'); setAuthError(''); setForgotSent(false); setResetUrl(''); }}
                          className="text-xs text-violet-600 hover:text-violet-700 hover:underline"
                        >
                          {tr.forgotPassword}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={authMode === 'signup' ? tr.atLeast6Chars : tr.enterYourPassword}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (authMode === 'signin' ? handleSignIn() : undefined)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{tr.confirmPassword}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={tr.confirmYourPassword}
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-linear-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
                    size="lg"
                    onClick={authMode === 'signup' ? handleSignUp : handleSignIn}
                  >
                    {authMode === 'signup' ? (
                      <><UserPlus className="h-4 w-4 mr-2" /> {tr.createAccountBtn}</>
                    ) : (
                      <><LogIn className="h-4 w-4 mr-2" /> {tr.signIn}</>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  {/* Google OAuth */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Button>
                </>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                {authMode === 'forgot' ? (
                  <button
                    onClick={() => { setAuthMode('signin'); setAuthError(''); setForgotSent(false); setResetUrl(''); }}
                    className="text-violet-600 hover:text-violet-700 font-medium"
                  >
                    {tr.backToSignIn}
                  </button>
                ) : authMode === 'signup' ? (
                  <>{tr.alreadyHaveAccount}{' '}
                    <button onClick={() => { setAuthMode('signin'); setAuthError(''); }} className="text-violet-600 hover:text-violet-700 font-medium">
                      {tr.signIn}
                    </button>
                  </>
                ) : (
                  <>{tr.dontHaveAccount}{' '}
                    <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="text-violet-600 hover:text-violet-700 font-medium">
                      {tr.signUp}
                    </button>
                  </>
                )}
              </p>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {tr.privacyPolicyAgree}{' '}
            <a href="/privacy-policy" className="text-violet-600 hover:underline">{tr.privacyPolicy}</a>.
          </p>
        </div>
      </div>
    );
  }

  // Show onboarding welcome screen for new users
  if (user && !showOnboarding && subscription === 'free') {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-violet-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('welcomeUser', { name: user.name })}</h1>
          <p className="text-muted-foreground mb-6">{tr.allFeaturesFreeLine}</p>
          <Button
            className="bg-linear-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
            size="lg"
            onClick={() => setShowOnboarding(true)}
          >
            {tr.getStarted}
          </Button>
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
      category: taskCategory,
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
    addGoal({ title: newGoal, color: newGoalColor, milestones: [] });
    setNewGoal('');
  };

  const handleAddHabit = () => {
    if (!newHabit.trim()) return;
    addHabit({ title: newHabit, frequency: newHabitFrequency, color: newHabitColor });
    setNewHabit('');
  };

  const sendChatMessage = async (overrideMsg?: string) => {
    const msg = overrideMsg ?? chatInput;
    if (!msg.trim() || isAiLoading) return;
    addChatMessage({ role: 'user', content: msg });
    if (!overrideMsg) setChatInput('');
    setIsAiLoading(true);
    try {
      // Build conversation history (exclude the message we just added — it's the current turn)
      const history = chatMessages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history,
          context: {
            tasks: tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed, priority: t.priority })),
            goals: goals.map(g => ({ id: g.id, title: g.title, progress: g.progress })),
            habits: habits.map(h => ({ id: h.id, title: h.title, streak: h.streak })),
          },
        }),
      });
      const data = await response.json() as { success: boolean; response?: string };
      if (data.success) {
        addChatMessage({ role: 'assistant', content: data.response ?? tr.errorTryAgain });
      } else {
        addChatMessage({ role: 'assistant', content: tr.errorTryAgain });
      }
    } catch {
      addChatMessage({ role: 'assistant', content: tr.connectionError });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to upload an avatar');
      return;
    }

    // Determine file extension from MIME type
    const ext = file.type.split('/')[1] || 'png';
    const key = `avatar.${ext}`;

    setIsUploadingAvatar(true);
    try {
      const res = await fetch(`/api/files?key=${encodeURIComponent(key)}&userId=${encodeURIComponent(user.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const data = await res.json() as { success: boolean; publicUrl?: string; error?: string };
      if (data.success && data.publicUrl) {
        setEditAvatarUrl(data.publicUrl);
        toast.success('Avatar uploaded!');
      } else {
        toast.error(data.error || 'Failed to upload avatar');
      }
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    // Optimistic update via store
    const result = await updateProfile({
      name: editName,
      profession: editProfession,
      hobbies: editHobbies,
      avatarUrl: editAvatarUrl
    });
    
    if (result.success) {
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  const handleShareProfile = async () => {
    if (!user) return;
    
    const prof = user.profession ? `a ${user.profession}` : 'using ZenPlanner';
    const hobs = user.hobbies ? ` I enjoy ${user.hobbies}.` : '';
    
    const shareData = {
      title: `${user.name}'s Profile`,
      text: `Hi! I'm ${user.name}, ${prof}.${hobs} Connect with me on ZenPlanner!`,
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (err) {
        // user canceled or failed
      }
    } else {
      // Fallbacks
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Profile info copied to clipboard!');
      } catch (err) {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const days: React.ReactNode[] = [];

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
                {event.time && <span className="mr-1">{formatTime(event.time)}</span>}
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
        <h2 className="text-2xl font-bold mb-2">{tr.appName}</h2>
        <p className="text-muted-foreground">{tr.allFeaturesFree}</p>
      </div>

      <Card className="mb-6 bg-linear-to-r from-violet-500/10 to-indigo-500/10 border-violet-200">
        <CardContent className="p-6 text-center">
          <div className="bg-violet-500 p-3 rounded-full inline-flex mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">{tr.freeForever}</h3>
          <p className="text-muted-foreground mb-4">{tr.enjoyUnlimited}</p>
          <ul className="text-left space-y-2 max-w-sm mx-auto">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{tr.unlimitedTasksGoalsHabits}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{tr.aiAdvisorUnlimited}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{tr.advancedAnalytics}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{tr.teamCollaboration}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{tr.smartReminders}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{tr.calendarSync}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks': {
        const filteredTasks = tasks.filter((task) => {
          const matchesSearch = !taskSearch || task.title.toLowerCase().includes(taskSearch.toLowerCase());
          const matchesStatus = taskFilterStatus === 'all' || (taskFilterStatus === 'completed' ? task.completed : !task.completed);
          const matchesPriority = taskFilterPriority === 'all' || task.priority === taskFilterPriority;
          return matchesSearch && matchesStatus && matchesPriority;
        });
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-violet-500" /> {tr.tasks}
              {dueReminders.length > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  {dueReminders.length} {tr.due}
                </Badge>
              )}
            </h2>

            {/* Add task row */}
            <div className="flex gap-2 mb-2">
              <Input placeholder={tr.addNewTask} value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} className="flex-1" />
              <Button onClick={handleAddTask}><Plus className="h-4 w-4" /></Button>
            </div>

            {/* Priority + category selector for new task */}
            <div className="flex gap-2 mb-2 flex-wrap items-center">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <Button key={p} variant={taskPriority === p ? 'default' : 'outline'} size="sm" onClick={() => setTaskPriority(p)} className={cn(taskPriority === p && priorityColors[p])}>
                  <Flag className="h-3 w-3 mr-1" />{tr[p]}
                </Button>
              ))}
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Due date / time / reminder */}
            <div className="flex gap-2 mb-2 flex-wrap">
              <DatePicker value={taskDueDate} onChange={setTaskDueDate} placeholder="Due date" className="w-44" />
              <Input type="time" value={taskDueTime} onChange={(e) => setTaskDueTime(e.target.value)} className="w-32" />
              <select
                value={taskReminder}
                onChange={(e) => setTaskReminder(Number(e.target.value))}
                className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value={0}>{tr.noReminder}</option>
                <option value={5}>{tr.min5Before}</option>
                <option value={15}>{tr.min15Before}</option>
                <option value={30}>{tr.min30Before}</option>
                <option value={60}>{tr.hour1Before}</option>
                <option value={1440}>{tr.day1Before}</option>
              </select>
            </div>

            {/* Filter / search row */}
            <div className="flex gap-2 mb-3 flex-wrap items-center">
              <Input
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="flex-1 min-w-[140px] h-8 text-sm"
              />
              <select
                value={taskFilterStatus}
                onChange={(e) => setTaskFilterStatus(e.target.value as 'all' | 'pending' | 'completed')}
                className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={taskFilterPriority}
                onChange={(e) => setTaskFilterPriority(e.target.value as 'all' | Priority)}
                className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
              >
                <option value="all">Any priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <motion.div key={task.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                      className={cn('group flex flex-col gap-1 p-3 rounded-lg border bg-card hover:shadow-sm transition-all', task.completed && 'opacity-60')}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTask(task.id)}>
                          {task.completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={cn('block truncate', task.completed && 'line-through')}>{task.title}</span>
                          {(task.dueDate || task.reminderMinutesBefore || task.category) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              {task.category && (
                                <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{task.category}</span>
                              )}
                              {task.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {task.dueDate}{task.dueTime && ` ${formatTime(task.dueTime)}`}
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
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingTask(task);
                          setEditTaskTitle(task.title);
                          setEditTaskPriority(task.priority);
                          setEditTaskDueDate(task.dueDate ?? '');
                          setEditTaskDueTime(task.dueTime ?? '');
                          setEditTaskCategory(task.category);
                          setEditTaskDescription(task.description ?? '');
                        }} className="opacity-0 group-hover:opacity-100 shrink-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 shrink-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {/* Subtasks */}
                      {task.subtasks.length > 0 && (
                        <div className="ml-8 space-y-1 mt-1">
                          {task.subtasks.map((sub) => (
                            <div key={sub.id} className="flex items-center gap-2 text-sm">
                              <button onClick={() => {
                                const updated = task.subtasks.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s);
                                updateTask(task.id, { subtasks: updated });
                              }}>
                                {sub.completed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                              </button>
                              <span className={cn('flex-1', sub.completed && 'line-through text-muted-foreground')}>{sub.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredTasks.length === 0 && <div className="text-center py-8 text-muted-foreground">{tasks.length === 0 ? tr.noTasksYet : 'No tasks match your filter.'}</div>}
              </div>
            </ScrollArea>
          </div>
        );
      }

      case 'calendar':
        return (
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-500" /> {tr.calendar}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openQuickAddTask(selectedDate || today)}>
                  <Plus className="h-4 w-4 mr-1" /> {tr.addTask}
                </Button>
                <Button variant="outline" size="sm" onClick={() => openQuickAddGoal(selectedDate || today)}>
                  <Target className="h-4 w-4 mr-1" /> {tr.addGoal}
                </Button>
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
              {DAYS_KEYS.map((day) => (
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
                    {selectedDate === today ? tr.today : selectedDate} - {selectedDateTasks.length} {tr.taskCount}
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
                        {task.dueTime && <span className="text-muted-foreground text-xs">{formatTime(task.dueTime)}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'ai': {
        const promptChips = [
          "How can I improve my productivity today?",
          "Review my tasks and suggest priorities",
          "Give me tips for building better habits",
          "How should I approach my goals this week?",
          "What's a good morning routine for focus?",
        ];
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" /> {tr.aiAdvisor}
            </h2>
            <ScrollArea className="flex-1 mb-2">
              <div className="space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-6">
                    <Bot className="h-12 w-12 text-violet-500 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">{tr.aiGreeting}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {promptChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendChatMessage(chip)}
                          disabled={isAiLoading}
                          className="text-xs px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', msg.role === 'user' ? 'bg-violet-500' : 'bg-linear-to-br from-violet-500 to-indigo-600')}>
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
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Chips always visible below chat when there are messages */}
            {chatMessages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {promptChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendChatMessage(chip)}
                    disabled={isAiLoading}
                    className="text-xs px-2.5 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input placeholder={tr.askAiPlaceholder} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} disabled={isAiLoading} />
              <Button onClick={() => sendChatMessage()} disabled={isAiLoading || !chatInput.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        );
      }

      case 'goals': {
        const GOAL_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" /> {tr.goals}
            </h2>
            {/* New goal row */}
            <div className="flex gap-2 mb-2">
              <Input placeholder={tr.addNewGoal} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()} className="flex-1" />
              <Button onClick={handleAddGoal}><Plus className="h-4 w-4" /></Button>
            </div>
            {/* Color picker for new goal */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewGoalColor(c)}
                  className={cn('w-6 h-6 rounded-full border-2 transition-transform', newGoalColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {goals.map((goal) => (
                  <Card key={goal.id} className="border-l-4 group" style={{ borderLeftColor: goal.color }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{goal.title}</h3>
                          {goal.targetDate && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Target: {goal.targetDate}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingGoal(goal);
                            setEditGoalTitle(goal.title);
                            setEditGoalColor(goal.color);
                            setEditGoalTargetDate(goal.targetDate ?? '');
                            setEditGoalProgress(goal.progress);
                          }}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {/* Progress slider */}
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={goal.progress}
                          onChange={(e) => updateGoal(goal.id, { progress: Number(e.target.value) })}
                          className="flex-1 accent-violet-500"
                        />
                        <span className="text-sm font-medium w-10 text-right">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-1.5 mb-3" />
                      {/* Milestones */}
                      {goal.milestones.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {goal.milestones.map((ms) => (
                            <div key={ms.id} className="flex items-center gap-2 text-sm">
                              <button onClick={() => {
                                const updated = goal.milestones.map(m => m.id === ms.id ? { ...m, completed: !m.completed } : m);
                                const completedCount = updated.filter(m => m.completed).length;
                                const progress = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : goal.progress;
                                updateGoal(goal.id, { milestones: updated, progress });
                              }}>
                                {ms.completed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                              </button>
                              <span className={cn('flex-1', ms.completed && 'line-through text-muted-foreground')}>{ms.title}</span>
                              {ms.targetDate && <span className="text-xs text-muted-foreground">{ms.targetDate}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add milestone inline */}
                      <div className="flex gap-1.5 mt-2">
                        <Input
                          placeholder="Add milestone..."
                          value={editingGoal?.id === goal.id ? newMilestone : ''}
                          onFocus={() => setEditingGoal(goal)}
                          onChange={(e) => { setEditingGoal(goal); setNewMilestone(e.target.value); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newMilestone.trim()) {
                              const ms = { id: crypto.randomUUID(), title: newMilestone.trim(), completed: false };
                              updateGoal(goal.id, { milestones: [...goal.milestones, ms] });
                              setNewMilestone('');
                            }
                          }}
                          className="h-7 text-xs flex-1"
                        />
                        <Button size="sm" className="h-7 px-2 text-xs" onClick={() => {
                          if (!newMilestone.trim()) return;
                          const ms = { id: crypto.randomUUID(), title: newMilestone.trim(), completed: false };
                          updateGoal(goal.id, { milestones: [...goal.milestones, ms] });
                          setNewMilestone('');
                        }}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {goals.length === 0 && <div className="text-center py-8 text-muted-foreground">{tr.noGoalsYet}</div>}
              </div>
            </ScrollArea>
          </div>
        );
      }

      case 'habits': {
        const HABIT_COLORS = ['#22c55e', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];
        // Build last-7-days labels
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" /> {tr.habits}
            </h2>
            {/* Add new habit */}
            <div className="flex gap-2 mb-2">
              <Input placeholder={tr.addNewHabit} value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()} className="flex-1" />
              <Button onClick={handleAddHabit}><Plus className="h-4 w-4" /></Button>
            </div>
            {/* Color + frequency for new habit */}
            <div className="flex gap-3 mb-3 items-center flex-wrap">
              <div className="flex gap-1.5">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewHabitColor(c)}
                    className={cn('w-5 h-5 rounded-full border-2 transition-transform', newHabitColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <select
                value={newHabitFrequency}
                onChange={(e) => setNewHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {habits.map((habit) => {
                  const isCompletedToday = habit.completions.some(c => c.date === today && c.completed);
                  return (
                    <Card key={habit.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleHabitCompletion(habit.id, today)}>
                              {isCompletedToday
                                ? <CheckCircle2 className="h-6 w-6" style={{ color: habit.color }} />
                                : <Circle className="h-6 w-6 text-muted-foreground" />}
                            </button>
                            <div>
                              <span className="font-medium">{habit.title}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-xs">{habit.frequency}</Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                  <span>{habit.streak} streak</span>
                                  {habit.bestStreak > 0 && <span className="text-muted-foreground/60">· best {habit.bestStreak}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingHabit(habit);
                              setEditHabitTitle(habit.title);
                              setEditHabitFrequency(habit.frequency);
                              setEditHabitColor(habit.color);
                            }}>
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteHabit(habit.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {/* 7-day completion strip */}
                        <div className="flex gap-1">
                          {last7.map((dateStr) => {
                            const done = habit.completions.some(c => c.date === dateStr && c.completed);
                            const isT = dateStr === today;
                            return (
                              <button
                                key={dateStr}
                                title={dateStr}
                                onClick={() => toggleHabitCompletion(habit.id, dateStr)}
                                className={cn(
                                  'flex-1 h-6 rounded transition-colors',
                                  done ? 'opacity-100' : 'opacity-25',
                                  isT && 'ring-1 ring-offset-1 ring-foreground'
                                )}
                                style={{ backgroundColor: habit.color }}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-0.5">
                          {last7.map((dateStr) => (
                            <span key={dateStr}>{new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })}</span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {habits.length === 0 && <div className="text-center py-8 text-muted-foreground">{tr.noHabitsYet}</div>}
              </div>
            </ScrollArea>
          </div>
        );
      }

      case 'analytics': {
        return (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" /> {tr.analytics}
            </h2>
            
            {/* Basic stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="bg-linear-to-br from-violet-500/20 to-indigo-500/20">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{stats.productivityScore}</div>
                  <div className="text-sm text-muted-foreground">{tr.productivityScore}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{stats.totalTasks}</div>
                  <div className="text-sm text-muted-foreground">{tr.totalTasks}</div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-green-500">{stats.completedTasks}</div>
                  <div className="text-sm text-muted-foreground">{tr.completed}</div>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/10">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-amber-500">{stats.pendingTasks}</div>
                  <div className="text-sm text-muted-foreground">{tr.pending}</div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{tr.completionRate}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={stats.completionRate} className="flex-1 h-3" />
                  <span className="text-2xl font-bold">{stats.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{tr.tasksByPriority}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500">{tr.high}</Badge>
                    <Progress value={(stats.tasksByPriority.high / (stats.totalTasks || 1)) * 100} className="flex-1 h-2" />
                    <span className="text-sm">{stats.tasksByPriority.high}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500">{tr.medium}</Badge>
                    <Progress value={(stats.tasksByPriority.medium / (stats.totalTasks || 1)) * 100} className="flex-1 h-2" />
                    <span className="text-sm">{stats.tasksByPriority.medium}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">{tr.low}</Badge>
                    <Progress value={(stats.tasksByPriority.low / (stats.totalTasks || 1)) * 100} className="flex-1 h-2" />
                    <span className="text-sm">{stats.tasksByPriority.low}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly trend */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tr.weeklyTrend}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-32">
                  {stats.weeklyTrend.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-violet-500 rounded-t"
                        style={{ height: `${Math.max(4, (day.completed / (day.total || 1)) * 100)}%` }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{tr.goalsProgress}</CardTitle>
                </CardHeader>
                <CardContent>
                  {goals.length > 0 ? (
                    <div className="space-y-2">
                      {goals.slice(0, 3).map((goal) => (
                        <div key={goal.id} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium truncate">{goal.title}</div>
                            <Progress value={goal.progress} className="h-2 mt-1" />
                          </div>
                          <span className="text-sm font-bold">{goal.progress}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{tr.noGoalsYetShort}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{tr.habitStreaks}</CardTitle>
                </CardHeader>
                <CardContent>
                  {habits.length > 0 ? (
                    <div className="space-y-2">
                      {habits.slice(0, 3).map((habit) => (
                        <div key={habit.id} className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{habit.title}</span>
                          <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-bold">{habit.streak}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{tr.noHabitsYetShort}</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tr.tasksByCategory}</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.totalTasks > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.tasksByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center gap-2">
                        <Badge variant="outline">{category}</Badge>
                        <Progress value={(count / stats.totalTasks) * 100} className="flex-1 h-2" />
                        <span className="text-sm">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      case 'team':
        const hasTeamFeatures = subscription === 'business' || subscription === 'enterprise';
        const maxTeamMembers = subscription === 'enterprise' ? -1 : 10;
        
        return (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> {tr.team}
              {!hasTeamFeatures && <Badge variant="outline" className="text-xs ml-2">Business</Badge>}
            </h2>
            
            {hasTeamFeatures ? (
              <>
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{tr.teamMembers}</CardTitle>
                      <Button size="sm" onClick={() => setShowInviteMember(true)}>
                        <UserPlus className="h-4 w-4 mr-1" /> {tr.invite}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamMembers.length > 0 ? (
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                            <Badge variant="outline">{member.role}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {tr.noTeamMembersYet}
                      </p>
                    )}
                    <div className="mt-4 text-sm text-muted-foreground">
                      {maxTeamMembers === -1 ? tr.unlimited : `${10 - teamMembers.length} ${tr.seatsRemaining}`}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{tr.sharedCalendarAccess}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tr.sharedCalendarDesc}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-linear-to-r from-blue-500/10 to-indigo-500/10 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-semibold mb-1">{tr.upgradeToBusiness}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tr.businessDesc}
                  </p>
                  <Button size="sm" onClick={() => setActiveTab('pricing')}>
                    {tr.viewPlans}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" /> {tr.settings}
              </h2>
              <Button variant="outline" size="sm" onClick={handleShareProfile}>
                <Share2 className="h-4 w-4 mr-2" /> Share Profile
              </Button>
            </div>
            
            <Card className="mb-4">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{tr.account}</CardTitle>
                {!isEditingProfile && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIsEditingProfile(true);
                    setEditName(user?.name || '');
                    setEditProfession(user?.profession || '');
                    setEditHobbies(user?.hobbies || '');
                    setEditAvatarUrl(user?.avatarUrl || '');
                  }}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-violet-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-muted relative">
                          {editAvatarUrl ? (
                            <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-10 w-10 text-white" />
                          )}
                          {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <label className={`absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-md ${isUploadingAvatar ? 'pointer-events-none opacity-50' : ''}`}>
                          <Camera className="h-4 w-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                        </label>
                      </div>
                      <span className="text-xs text-muted-foreground">Max size 2MB</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your Name" />
                    </div>

                    <div className="space-y-2">
                      <Label>Profession</Label>
                      <Input value={editProfession} onChange={(e) => setEditProfession(e.target.value)} placeholder="e.g. Software Engineer" />
                    </div>

                    <div className="space-y-2">
                      <Label>Hobbies / Interests</Label>
                      <Textarea 
                        value={editHobbies} 
                        onChange={(e) => setEditHobbies(e.target.value)} 
                        placeholder="e.g. Reading, Hiking, Coding"
                        className="resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)} disabled={isUploadingAvatar}>Cancel</Button>
                      <Button onClick={handleSaveProfile} disabled={isUploadingAvatar}>
                        {isUploadingAvatar ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Uploading...</> : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg truncate">{user?.name}</div>
                        <div className="text-sm text-muted-foreground truncate mb-2">{user?.email}</div>
                        
                        {user?.profession && (
                          <div className="text-sm mb-1">
                            <span className="font-medium text-xs uppercase text-muted-foreground mr-2">Profession</span>
                            {user.profession}
                          </div>
                        )}
                        
                        {user?.hobbies && (
                          <div className="text-sm">
                            <span className="font-medium text-xs uppercase text-muted-foreground mr-2">Hobbies</span>
                            {user.hobbies}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{tr.currentPlan}</div>
                          <div className="text-xs text-muted-foreground capitalize">{subscription}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('pricing')}>
                          {tr.changePlan}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tr.preferences}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{tr.timeFormat}</div>
                    <div className="text-xs text-muted-foreground">{tr.timeFormatDesc}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={timeFormat === '12h' ? 'default' : 'outline'}
                      onClick={() => setTimeFormat('12h')}
                    >
                      12h
                    </Button>
                    <Button 
                      size="sm" 
                      variant={timeFormat === '24h' ? 'default' : 'outline'}
                      onClick={() => setTimeFormat('24h')}
                    >
                      24h
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <div className="text-sm font-medium">{tr.language}</div>
                    <div className="text-xs text-muted-foreground">{tr.languageDesc}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {SUPPORTED_LOCALES.map((loc) => (
                      <Button
                        key={loc.code}
                        size="sm"
                        variant="outline"
                        onClick={() => setLocale(loc.code)}
                        className={cn('text-xs px-2 py-1 h-auto', loc.code === (useAppStore.getState().locale) && 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300')}
                      >
                        {loc.nativeLabel}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tr.dataPrivacy}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/delete-account'}>
                  <Trash2 className="h-4 w-4 mr-2" /> {tr.deleteAccount}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/privacy-policy'}>
                  <Check className="h-4 w-4 mr-2" /> {tr.privacyPolicy}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tr.appInfo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>{tr.appVersion}</p>
                  <p className="mt-1">{tr.aiPoweredProductivity}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'pricing':
        return renderPricing();

      case 'install':
        if (typeof window !== 'undefined') {
          window.location.href = '/install';
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-linear-to-r from-violet-600 via-indigo-600 to-violet-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left: logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{tr.appName}</h1>
                <p className="text-xs text-white/80">{tr.appTagline}</p>
              </div>
            </div>
            {/* Center: desktop nav */}
            {!isMobile && (
              <nav className="hidden md:flex items-center gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar flex-1 justify-center min-w-0">
                {tabs.map((tab) => (
                  <Button key={tab.id} variant="ghost" onClick={() => setActiveTab(tab.id)}
                    className={cn('text-white hover:bg-white/10 gap-2 shrink-0', activeTab === tab.id && 'bg-white/20')}>
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === 'pricing' && subscription === 'free' && (
                      <Badge className="bg-amber-500 text-xs ml-1">{tr.newBadge}</Badge>
                    )}
                  </Button>
                ))}
              </nav>
            )}
            {/* Right: user area — always visible on all screen sizes */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Pending count + subscription badge: desktop only */}
              <div className="hidden md:flex items-center gap-3">
                <div className="bg-white/10 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium">{pendingTasks} {tr.pendingCount}</span>
                </div>
                {subscription !== 'free' && (
                  <Badge className="bg-amber-500">
                    <Crown className="h-3 w-3 mr-1" />
                    {SUBSCRIPTION_PLANS.find(p => p.id === subscription)?.name}
                    {trialActive && ` (${tr.trial})`}
                  </Badge>
                )}
              </div>
              {/* Avatar + name + sign out: always visible */}
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm hidden md:inline-block max-w-[120px] truncate">{user.name}</span>
                <button onClick={signOut} className="bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition-colors shrink-0" title="Sign out">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
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

      {/* Quick Add Task Dialog */}
      <Dialog open={showQuickAddTask} onOpenChange={setShowQuickAddTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr.addTaskDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">{tr.taskTitle}</label>
              <Input
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                placeholder={tr.enterTaskTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{tr.dueDate}</label>
              <DatePicker value={quickAddDate} onChange={setQuickAddDate} placeholder={tr.dueDate} className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAddTask(false)}>{tr.cancel}</Button>
            <Button onClick={handleQuickAddTask} disabled={!quickAddTitle.trim()}>{tr.addTaskBtn}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Goal Dialog */}
      <Dialog open={showQuickAddGoal} onOpenChange={setShowQuickAddGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr.addGoalDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">{tr.goalTitle}</label>
              <Input
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                placeholder={tr.enterGoalTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddGoal()}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{tr.targetDate}</label>
              <DatePicker value={quickAddDate} onChange={setQuickAddDate} placeholder={tr.targetDate} className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAddGoal(false)}>{tr.cancel}</Button>
            <Button onClick={handleQuickAddGoal} disabled={!quickAddTitle.trim()}>{tr.addGoalBtn}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Edit Modal */}
      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <Button key={p} size="sm" variant={editTaskPriority === p ? 'default' : 'outline'} onClick={() => setEditTaskPriority(p)} className={cn(editTaskPriority === p && priorityColors[p])}>
                  <Flag className="h-3 w-3 mr-1" />{p}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium">Due Date</label>
                <DatePicker value={editTaskDueDate} onChange={setEditTaskDueDate} placeholder="Due date" className="w-full" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Due Time</label>
                <Input type="time" value={editTaskDueTime} onChange={(e) => setEditTaskDueTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={editTaskCategory}
                onChange={(e) => setEditTaskCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {/* Subtasks */}
            {editingTask && editingTask.subtasks.length > 0 && (
              <div>
                <label className="text-sm font-medium">Subtasks</label>
                <div className="space-y-1 mt-1">
                  {editingTask.subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <span className={cn('flex-1 text-sm', sub.completed && 'line-through text-muted-foreground')}>{sub.title}</span>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const updated = editingTask.subtasks.filter(s => s.id !== sub.id);
                        setEditingTask({ ...editingTask, subtasks: updated });
                      }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubtask.trim() && editingTask) {
                    const sub = { id: crypto.randomUUID(), title: newSubtask.trim(), completed: false };
                    setEditingTask({ ...editingTask, subtasks: [...editingTask.subtasks, sub] });
                    setNewSubtask('');
                  }
                }}
                className="flex-1 h-8 text-sm"
              />
              <Button size="sm" className="h-8" onClick={() => {
                if (!newSubtask.trim() || !editingTask) return;
                const sub = { id: crypto.randomUUID(), title: newSubtask.trim(), completed: false };
                setEditingTask({ ...editingTask, subtasks: [...editingTask.subtasks, sub] });
                setNewSubtask('');
              }}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editingTask) return;
              updateTask(editingTask.id, {
                title: editTaskTitle,
                description: editTaskDescription || undefined,
                priority: editTaskPriority,
                dueDate: editTaskDueDate || undefined,
                dueTime: editTaskDueTime || undefined,
                category: editTaskCategory,
                subtasks: editingTask.subtasks,
              });
              setEditingTask(null);
            }} disabled={!editTaskTitle.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Edit Modal */}
      <Dialog open={!!editingGoal && !!editGoalTitle} onOpenChange={(open) => { if (!open) { setEditingGoal(null); setEditGoalTitle(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={editGoalTitle} onChange={(e) => setEditGoalTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Target Date</label>
              <DatePicker value={editGoalTargetDate} onChange={setEditGoalTargetDate} placeholder="Target date" className="w-full" />
            </div>
            <div>
              <label className="text-sm font-medium">Progress: {editGoalProgress}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={editGoalProgress}
                onChange={(e) => setEditGoalProgress(Number(e.target.value))}
                className="w-full accent-violet-500 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditGoalColor(c)}
                    className={cn('w-7 h-7 rounded-full border-2 transition-transform', editGoalColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingGoal(null); setEditGoalTitle(''); }}>Cancel</Button>
            <Button onClick={() => {
              if (!editingGoal || !editGoalTitle.trim()) return;
              updateGoal(editingGoal.id, {
                title: editGoalTitle,
                color: editGoalColor,
                targetDate: editGoalTargetDate || undefined,
                progress: editGoalProgress,
              });
              setEditingGoal(null);
              setEditGoalTitle('');
            }} disabled={!editGoalTitle.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Habit Edit Modal */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => { if (!open) setEditingHabit(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={editHabitTitle} onChange={(e) => setEditHabitTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <select
                value={editHabitFrequency}
                onChange={(e) => setEditHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {['#22c55e', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditHabitColor(c)}
                    className={cn('w-7 h-7 rounded-full border-2 transition-transform', editHabitColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingHabit(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editingHabit || !editHabitTitle.trim()) return;
              updateHabit(editingHabit.id, {
                title: editHabitTitle,
                frequency: editHabitFrequency,
                color: editHabitColor,
              });
              setEditingHabit(null);
            }} disabled={!editHabitTitle.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
