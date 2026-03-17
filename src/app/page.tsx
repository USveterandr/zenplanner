'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Check, CreditCard, LogOut, Mail, Lock, UserPlus, LogIn, Eye, EyeOff, Clock, Users, Settings, Share2, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
    tasks, goals, habits, addTask, toggleTask, deleteTask,
    addGoal, addHabit, toggleHabitCompletion, addChatMessage, chatMessages,
    _hasHydrated: storeHasHydrated, activeTab, setActiveTab, selectedDate, setSelectedDate,
    subscription, setSubscription, user, signUp, signIn, signOut,
    subscriptionInfo, selectPlan, teamMembers, canAddGoal, canAddHabit,
    setLocale, locale,
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
    return () => clearTimeout(timer);
  }, []);

  // Listen for Supabase auth state changes (handles OAuth redirect back into the app)
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && !user) {
          const { id, email, user_metadata } = session.user;
          const name =
            (user_metadata?.full_name as string | undefined) ||
            (user_metadata?.name as string | undefined) ||
            email?.split('@')[0] ||
            'User';

          // Ensure D1 row exists for OAuth users via the existing login endpoint
          try {
            const res = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'oauth_sync', userId: id, email, name }),
            });
            // Best-effort — ignore errors here
          } catch { /* noop */ }

          useAppStore.setState({
            user: { id, name, email: email ?? '' },
            accessToken: session.access_token ?? null,
          });
          await useAppStore.getState().loadUserData();
        }
      }
    );

    return () => authSub.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

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

  // All useMemo hooks MUST be before any conditional returns
  const calendarEvents = useMemo(() => getCalendarEvents(tasks, goals), [tasks, goals]);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const todayTasks = useMemo(() => getTasksForDate(tasks, today), [tasks, today]);
  const selectedDateTasks = useMemo(() => selectedDate ? getTasksForDate(tasks, selectedDate) : [], [tasks, selectedDate]);
  const trialActive = useMemo(() => isTrialActive(subscriptionInfo), [subscriptionInfo]);
  const trialDaysLeft = useMemo(() => getTrialDaysRemaining(subscriptionInfo), [subscriptionInfo]);
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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
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
        redirectTo: `${window.location.origin}/auth/callback`,
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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
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
                      className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
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
                    className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('welcomeUser', { name: user.name })}</h1>
          <p className="text-muted-foreground mb-6">{tr.allFeaturesFreeLine}</p>
          <Button
            className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
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

      <Card className="mb-6 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-200">
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
      case 'tasks':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-violet-500" /> {tr.tasks}
              {dueReminders.length > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  {dueReminders.length} {tr.due}
                </Badge>
              )}
            </h2>

            <div className="flex gap-2 mb-2">
              <Input placeholder={tr.addNewTask} value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} className="flex-1" />
              <Button onClick={handleAddTask}><Plus className="h-4 w-4" /></Button>
            </div>

            <div className="flex gap-2 mb-2 flex-wrap">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <Button key={p} variant={taskPriority === p ? 'default' : 'outline'} size="sm" onClick={() => setTaskPriority(p)} className={cn(taskPriority === p && priorityColors[p])}>
                  <Flag className="h-3 w-3 mr-1" />{tr[p]}
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
                <option value={0}>{tr.noReminder}</option>
                <option value={5}>{tr.min5Before}</option>
                <option value={15}>{tr.min15Before}</option>
                <option value={30}>{tr.min30Before}</option>
                <option value={60}>{tr.hour1Before}</option>
                <option value={1440}>{tr.day1Before}</option>
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
                      <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 shrink-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {tasks.length === 0 && <div className="text-center py-8 text-muted-foreground">{tr.noTasksYet}</div>}
              </div>
            </ScrollArea>
          </div>
        );

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

      case 'ai':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" /> {tr.aiAdvisor}
            </h2>
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-violet-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">{tr.aiGreeting}</p>
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
              <Input placeholder={tr.askAiPlaceholder} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} disabled={isAiLoading} />
              <Button onClick={sendChatMessage} disabled={isAiLoading || !chatInput.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" /> {tr.goals}
            </h2>
            <div className="flex gap-2 mb-4">
              <Input placeholder={tr.addNewGoal} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()} className="flex-1" />
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
                {goals.length === 0 && <div className="text-center py-8 text-muted-foreground">{tr.noGoalsYet}</div>}
              </div>
            </ScrollArea>
          </div>
        );

      case 'habits':
        return (
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" /> {tr.habits}
            </h2>
            <div className="flex gap-2 mb-4">
              <Input placeholder={tr.addNewHabit} value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()} className="flex-1" />
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
                {habits.length === 0 && <div className="text-center py-8 text-muted-foreground">{tr.noHabitsYet}</div>}
              </div>
            </ScrollArea>
          </div>
        );

      case 'analytics':
        const hasAdvancedAnalytics = subscription === 'pro' || subscription === 'business' || subscription === 'enterprise';
        
        return (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" /> {tr.analytics}
              {!hasAdvancedAnalytics && (
                <Badge variant="outline" className="text-xs ml-2">Pro</Badge>
              )}
            </h2>
            
            {/* Basic Analytics - Available to all */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
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
            
            {/* Advanced Analytics - Pro+ Only */}
            {hasAdvancedAnalytics ? (
              <>
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
                    <div className="space-y-2">
                      {Object.entries(stats.tasksByCategory).map(([category, count]) => (
                        <div key={category} className="flex items-center gap-2">
                          <Badge variant="outline">{category}</Badge>
                          <Progress value={(count / stats.totalTasks) * 100} className="flex-1 h-2" />
                          <span className="text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="mb-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-200">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-violet-500" />
                  <h3 className="font-semibold mb-1">{tr.upgradeToPro}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tr.advancedAnalyticsDesc}
                  </p>
                  <Button size="sm" onClick={() => setActiveTab('pricing')}>
                    {tr.viewPlans}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

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
              <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200">
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
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" /> {tr.settings}
            </h2>
            
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tr.account}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
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
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{tr.appName}</h1>
                <p className="text-xs text-white/80">{tr.appTagline}</p>
              </div>
            </div>
            {!isMobile && (
              <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar flex-1 lg:flex-none">
                {tabs.map((tab) => (
                  <Button key={tab.id} variant="ghost" onClick={() => setActiveTab(tab.id)}
                    className={cn('text-white hover:bg-white/10 gap-2', activeTab === tab.id && 'bg-white/20')}>
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === 'pricing' && subscription === 'free' && (
                      <Badge className="bg-amber-500 text-xs ml-1">{tr.newBadge}</Badge>
                    )}
                  </Button>
                ))}
              </nav>
            )}
            <div className="hidden md:flex items-center gap-4">
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
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm hidden lg:inline">{user.name}</span>
                <button onClick={signOut} className="bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition-colors" title="Sign out">
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
              <Input
                type="date"
                value={quickAddDate}
                onChange={(e) => setQuickAddDate(e.target.value)}
              />
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
              <Input
                type="date"
                value={quickAddDate}
                onChange={(e) => setQuickAddDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAddGoal(false)}>{tr.cancel}</Button>
            <Button onClick={handleQuickAddGoal} disabled={!quickAddTitle.trim()}>{tr.addGoalBtn}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
