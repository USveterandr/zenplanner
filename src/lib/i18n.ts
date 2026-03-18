export type Locale = 'en' | 'es' | 'zh' | 'hi' | 'fr';

export const SUPPORTED_LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'zh', label: 'Mandarin', nativeLabel: '中文' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
];

export interface Translations {
  // App
  appName: string;
  appTagline: string;
  loading: string;

  // Auth
  createAccount: string;
  welcomeBack: string;
  startJourney: string;
  continueWhereLeft: string;
  fullName: string;
  emailAddress: string;
  password: string;
  confirmPassword: string;
  atLeast6Chars: string;
  enterYourPassword: string;
  confirmYourPassword: string;
  createAccountBtn: string;
  signIn: string;
  signUp: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  privacyPolicyAgree: string;
  privacyPolicy: string;
  nameRequired: string;
  emailRequired: string;
  validEmail: string;
  passwordLength: string;
  passwordsNoMatch: string;
  passwordRequired: string;
  signUpFailed: string;
  signInFailed: string;

  // Forgot password
  forgotPassword: string;
  forgotPasswordTitle: string;
  forgotPasswordDesc: string;
  sendResetLink: string;
  resetLinkSent: string;
  resetLinkSentDesc: string;
  tapToReset: string;
  backToSignIn: string;
  resetEmailRequired: string;
  resetRequestFailed: string;

  // Onboarding
  welcomeUser: string;
  allFeaturesFreeLine: string;
  getStarted: string;

  // Tabs
  tasks: string;
  calendar: string;
  aiAdvisor: string;
  goals: string;
  habits: string;
  analytics: string;
  team: string;
  settings: string;
  about: string;
  install: string;

  // Tasks
  addNewTask: string;
  noTasksYet: string;
  due: string;

  // Reminder options
  noReminder: string;
  min5Before: string;
  min15Before: string;
  min30Before: string;
  hour1Before: string;
  day1Before: string;

  // Priority
  high: string;
  medium: string;
  low: string;

  // Calendar
  addTask: string;
  addGoal: string;
  today: string;
  moreTasks: string;

  // Quick-add dialogs
  addTaskDialog: string;
  taskTitle: string;
  enterTaskTitle: string;
  dueDate: string;
  cancel: string;
  addTaskBtn: string;
  addGoalDialog: string;
  goalTitle: string;
  enterGoalTitle: string;
  targetDate: string;
  addGoalBtn: string;
  taskCount: string;

  // AI Advisor
  aiGreeting: string;
  askAiPlaceholder: string;
  errorTryAgain: string;
  connectionError: string;

  // Goals
  addNewGoal: string;
  noGoalsYet: string;

  // Habits
  addNewHabit: string;
  noHabitsYet: string;

  // Analytics
  productivityScore: string;
  totalTasks: string;
  completed: string;
  pending: string;
  completionRate: string;
  tasksByPriority: string;
  weeklyTrend: string;
  goalsProgress: string;
  habitStreaks: string;
  tasksByCategory: string;
  noGoalsYetShort: string;
  noHabitsYetShort: string;
  upgradeToPro: string;
  advancedAnalyticsDesc: string;
  viewPlans: string;

  // Team
  teamMembers: string;
  invite: string;
  noTeamMembersYet: string;
  seatsRemaining: string;
  unlimited: string;
  sharedCalendarAccess: string;
  sharedCalendarDesc: string;
  upgradeToBusiness: string;
  businessDesc: string;

  // Settings
  account: string;
  currentPlan: string;
  changePlan: string;
  preferences: string;
  timeFormat: string;
  timeFormatDesc: string;
  dataPrivacy: string;
  deleteAccount: string;
  appInfo: string;
  appVersion: string;
  aiPoweredProductivity: string;
  language: string;
  languageDesc: string;

  // About / Pricing
  allFeaturesFree: string;
  freeForever: string;
  enjoyUnlimited: string;
  unlimitedTasksGoalsHabits: string;
  aiAdvisorUnlimited: string;
  advancedAnalytics: string;
  teamCollaboration: string;
  smartReminders: string;
  calendarSync: string;

  // Pricing / Early Adopter
  choosePlan: string;
  choosePlanToStart: string;
  earlyAdopter: string;
  earlyAdopterDesc: string;
  earlyAdopterWelcome: string;
  earlyAdopterSpotsLeft: string;
  earlyAdopterSpotsFilled: string;
  lifetimeFree: string;
  popular: string;
  perMonth: string;
  trialDays: string;
  currentPlanBadge: string;
  startTrial: string;
  selectPlan: string;
  planSelected: string;

  // Header
  pendingCount: string;
  trial: string;

  // New badge
  newBadge: string;
}

const en: Translations = {
  appName: 'Zen Planner',
  appTagline: 'AI-Powered Productivity',
  loading: 'Loading Zen Planner...',

  createAccount: 'Create Your Account',
  welcomeBack: 'Welcome Back',
  startJourney: 'Start your productivity journey today',
  continueWhereLeft: 'Sign in to continue where you left off',
  fullName: 'Full Name',
  emailAddress: 'Email Address',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  atLeast6Chars: 'At least 6 characters',
  enterYourPassword: 'Enter your password',
  confirmYourPassword: 'Confirm your password',
  createAccountBtn: 'Create Account',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  alreadyHaveAccount: 'Already have an account?',
  dontHaveAccount: "Don't have an account?",
  privacyPolicyAgree: 'By creating an account, you agree to our',
  privacyPolicy: 'Privacy Policy',
  nameRequired: 'Name is required.',
  emailRequired: 'Email is required.',
  validEmail: 'Please enter a valid email address.',
  passwordLength: 'Password must be at least 6 characters.',
  passwordsNoMatch: 'Passwords do not match.',
  passwordRequired: 'Password is required.',
  signUpFailed: 'Sign up failed.',
  signInFailed: 'Sign in failed.',
  forgotPassword: 'Forgot password?',
  forgotPasswordTitle: 'Reset Password',
  forgotPasswordDesc: 'Enter your email and we\'ll send you a reset link.',
  sendResetLink: 'Send Reset Link',
  resetLinkSent: 'Your reset link is ready',
  resetLinkSentDesc: 'If an account exists for that email, you\'ll receive a reset link shortly.',
  tapToReset: 'Tap here to reset your password',
  backToSignIn: 'Back to Sign In',
  resetEmailRequired: 'Please enter your email address.',
  resetRequestFailed: 'Failed to send reset email. Please try again.',

  welcomeUser: 'Welcome, {name}!',
  allFeaturesFreeLine: 'All features are now free! Enjoy unlimited access to tasks, goals, habits, AI advisor, and more.',
  getStarted: 'Get Started',

  tasks: 'Tasks',
  calendar: 'Calendar',
  aiAdvisor: 'AI Advisor',
  goals: 'Goals',
  habits: 'Habits',
  analytics: 'Analytics',
  team: 'Team',
  settings: 'Settings',
  about: 'About',
  install: 'Install',

  addNewTask: 'Add a new task...',
  noTasksYet: 'No tasks yet. Add your first task above!',
  due: 'due',

  noReminder: 'No reminder',
  min5Before: '5 min before',
  min15Before: '15 min before',
  min30Before: '30 min before',
  hour1Before: '1 hour before',
  day1Before: '1 day before',

  high: 'high',
  medium: 'medium',
  low: 'low',

  addTask: 'Add Task',
  addGoal: 'Add Goal',
  today: 'Today',
  moreTasks: 'more',

  addTaskDialog: 'Add Task',
  taskTitle: 'Task Title',
  enterTaskTitle: 'Enter task title...',
  dueDate: 'Due Date',
  cancel: 'Cancel',
  addTaskBtn: 'Add Task',
  addGoalDialog: 'Add Goal',
  goalTitle: 'Goal Title',
  enterGoalTitle: 'Enter goal title...',
  targetDate: 'Target Date',
  addGoalBtn: 'Add Goal',
  taskCount: 'task(s)',

  aiGreeting: "Hi! I'm your AI productivity advisor. Ask me anything!",
  askAiPlaceholder: 'Ask AI for advice...',
  errorTryAgain: 'Sorry, I encountered an error. Please try again.',
  connectionError: 'Connection error. Please try again.',

  addNewGoal: 'Add a new goal...',
  noGoalsYet: 'No goals yet. Set your first goal above!',

  addNewHabit: 'Add a new habit...',
  noHabitsYet: 'No habits yet. Start tracking your first habit above!',

  productivityScore: 'Productivity Score',
  totalTasks: 'Total Tasks',
  completed: 'Completed',
  pending: 'Pending',
  completionRate: 'Completion Rate',
  tasksByPriority: 'Tasks by Priority',
  weeklyTrend: 'Weekly Trend',
  goalsProgress: 'Goals Progress',
  habitStreaks: 'Habit Streaks',
  tasksByCategory: 'Tasks by Category',
  noGoalsYetShort: 'No goals yet',
  noHabitsYetShort: 'No habits yet',
  upgradeToPro: 'Upgrade to Pro',
  advancedAnalyticsDesc: 'Get advanced analytics, weekly trends, goal tracking, and habit streaks',
  viewPlans: 'View Plans',

  teamMembers: 'Team Members',
  invite: 'Invite',
  noTeamMembersYet: 'No team members yet. Invite your first team member!',
  seatsRemaining: 'seats remaining',
  unlimited: 'Unlimited',
  sharedCalendarAccess: 'Shared Calendar Access',
  sharedCalendarDesc: 'Team members can view and edit shared tasks and goals based on their role permissions.',
  upgradeToBusiness: 'Upgrade to Business',
  businessDesc: 'Invite team members, share calendars, and collaborate together',

  account: 'Account',
  currentPlan: 'Current Plan',
  changePlan: 'Change Plan',
  preferences: 'Preferences',
  timeFormat: 'Time Format',
  timeFormatDesc: 'Choose 12-hour or 24-hour format',
  dataPrivacy: 'Data & Privacy',
  deleteAccount: 'Delete Account',
  appInfo: 'App Info',
  appVersion: 'Zen Planner v1.0.0',
  aiPoweredProductivity: 'AI-Powered Productivity App',
  language: 'Language',
  languageDesc: 'Choose your preferred language',

  allFeaturesFree: 'All features are free!',
  freeForever: 'Free Forever',
  enjoyUnlimited: 'Enjoy unlimited access to all features including:',
  unlimitedTasksGoalsHabits: 'Unlimited tasks, goals & habits',
  aiAdvisorUnlimited: 'AI Advisor - unlimited messages',
  advancedAnalytics: 'Advanced analytics',
  teamCollaboration: 'Team collaboration',
  smartReminders: 'Smart reminders',
  calendarSync: 'Calendar sync',

  choosePlan: 'Choose your plan',
  choosePlanToStart: 'Choose a plan to unlock all features and boost your productivity.',
  earlyAdopter: 'Early Adopter',
  earlyAdopterDesc: 'You\'re one of our first 100 users! All features are unlocked for you — forever.',
  earlyAdopterWelcome: 'You\'re an early adopter! All features are unlocked for you for life. Thank you for being one of our first users.',
  earlyAdopterSpotsLeft: '{count} early adopter spots remaining',
  earlyAdopterSpotsFilled: 'All early adopter spots have been filled',
  lifetimeFree: 'Lifetime Free',
  popular: 'Popular',
  perMonth: 'mo',
  trialDays: '{days}-day free trial',
  currentPlanBadge: 'Current Plan',
  startTrial: 'Start Free Trial',
  selectPlan: 'Select Plan',
  planSelected: 'Plan selected! Welcome to Zen Planner.',

  pendingCount: 'pending',
  trial: 'Trial',

  newBadge: 'NEW',
};

const es: Translations = {
  appName: 'Zen Planner',
  appTagline: 'Productividad con IA',
  loading: 'Cargando Zen Planner...',

  createAccount: 'Crear Tu Cuenta',
  welcomeBack: 'Bienvenido de Nuevo',
  startJourney: 'Comienza tu viaje de productividad hoy',
  continueWhereLeft: 'Inicia sesión para continuar donde lo dejaste',
  fullName: 'Nombre Completo',
  emailAddress: 'Correo Electrónico',
  password: 'Contraseña',
  confirmPassword: 'Confirmar Contraseña',
  atLeast6Chars: 'Al menos 6 caracteres',
  enterYourPassword: 'Ingresa tu contraseña',
  confirmYourPassword: 'Confirma tu contraseña',
  createAccountBtn: 'Crear Cuenta',
  signIn: 'Iniciar Sesión',
  signUp: 'Registrarse',
  alreadyHaveAccount: '¿Ya tienes una cuenta?',
  dontHaveAccount: '¿No tienes una cuenta?',
  privacyPolicyAgree: 'Al crear una cuenta, aceptas nuestra',
  privacyPolicy: 'Política de Privacidad',
  nameRequired: 'El nombre es obligatorio.',
  emailRequired: 'El correo es obligatorio.',
  validEmail: 'Por favor ingresa un correo válido.',
  passwordLength: 'La contraseña debe tener al menos 6 caracteres.',
  passwordsNoMatch: 'Las contraseñas no coinciden.',
  passwordRequired: 'La contraseña es obligatoria.',
  signUpFailed: 'Error al registrarse.',
  signInFailed: 'Error al iniciar sesión.',
  forgotPassword: '¿Olvidaste tu contraseña?',
  forgotPasswordTitle: 'Restablecer contraseña',
  forgotPasswordDesc: 'Ingresa tu correo y te enviaremos un enlace de restablecimiento.',
  sendResetLink: 'Enviar enlace',
  resetLinkSent: 'Tu enlace de restablecimiento está listo',
  resetLinkSentDesc: 'Si existe una cuenta con ese correo, recibirás un enlace en breve.',
  tapToReset: 'Toca aquí para restablecer tu contraseña',
  backToSignIn: 'Volver a iniciar sesión',
  resetEmailRequired: 'Por favor ingresa tu correo electrónico.',
  resetRequestFailed: 'No se pudo enviar el correo. Inténtalo de nuevo.',

  welcomeUser: '¡Bienvenido, {name}!',
  allFeaturesFreeLine: '¡Todas las funciones son gratuitas! Disfruta acceso ilimitado a tareas, metas, hábitos, asesor IA y más.',
  getStarted: 'Comenzar',

  tasks: 'Tareas',
  calendar: 'Calendario',
  aiAdvisor: 'Asesor IA',
  goals: 'Metas',
  habits: 'Hábitos',
  analytics: 'Analíticas',
  team: 'Equipo',
  settings: 'Ajustes',
  about: 'Acerca de',
  install: 'Instalar',

  addNewTask: 'Agregar una nueva tarea...',
  noTasksYet: '¡Sin tareas aún. Agrega tu primera tarea arriba!',
  due: 'vence',

  noReminder: 'Sin recordatorio',
  min5Before: '5 min antes',
  min15Before: '15 min antes',
  min30Before: '30 min antes',
  hour1Before: '1 hora antes',
  day1Before: '1 día antes',

  high: 'alta',
  medium: 'media',
  low: 'baja',

  addTask: 'Agregar Tarea',
  addGoal: 'Agregar Meta',
  today: 'Hoy',
  moreTasks: 'más',

  addTaskDialog: 'Agregar Tarea',
  taskTitle: 'Título de la Tarea',
  enterTaskTitle: 'Escribe el título...',
  dueDate: 'Fecha Límite',
  cancel: 'Cancelar',
  addTaskBtn: 'Agregar Tarea',
  addGoalDialog: 'Agregar Meta',
  goalTitle: 'Título de la Meta',
  enterGoalTitle: 'Escribe el título de la meta...',
  targetDate: 'Fecha Objetivo',
  addGoalBtn: 'Agregar Meta',
  taskCount: 'tarea(s)',

  aiGreeting: '¡Hola! Soy tu asesor de productividad con IA. ¡Pregúntame lo que quieras!',
  askAiPlaceholder: 'Pide consejo a la IA...',
  errorTryAgain: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
  connectionError: 'Error de conexión. Por favor intenta de nuevo.',

  addNewGoal: 'Agregar una nueva meta...',
  noGoalsYet: '¡Sin metas aún. Establece tu primera meta arriba!',

  addNewHabit: 'Agregar un nuevo hábito...',
  noHabitsYet: '¡Sin hábitos aún. Comienza a rastrear tu primer hábito arriba!',

  productivityScore: 'Puntuación de Productividad',
  totalTasks: 'Total de Tareas',
  completed: 'Completadas',
  pending: 'Pendientes',
  completionRate: 'Tasa de Completación',
  tasksByPriority: 'Tareas por Prioridad',
  weeklyTrend: 'Tendencia Semanal',
  goalsProgress: 'Progreso de Metas',
  habitStreaks: 'Rachas de Hábitos',
  tasksByCategory: 'Tareas por Categoría',
  noGoalsYetShort: 'Sin metas aún',
  noHabitsYetShort: 'Sin hábitos aún',
  upgradeToPro: 'Mejorar a Pro',
  advancedAnalyticsDesc: 'Obtén analíticas avanzadas, tendencias semanales, seguimiento de metas y rachas de hábitos',
  viewPlans: 'Ver Planes',

  teamMembers: 'Miembros del Equipo',
  invite: 'Invitar',
  noTeamMembersYet: 'Sin miembros aún. ¡Invita a tu primer miembro del equipo!',
  seatsRemaining: 'lugares disponibles',
  unlimited: 'Ilimitado',
  sharedCalendarAccess: 'Acceso al Calendario Compartido',
  sharedCalendarDesc: 'Los miembros del equipo pueden ver y editar tareas y metas compartidas según sus permisos.',
  upgradeToBusiness: 'Mejorar a Business',
  businessDesc: 'Invita miembros del equipo, comparte calendarios y colabora juntos',

  account: 'Cuenta',
  currentPlan: 'Plan Actual',
  changePlan: 'Cambiar Plan',
  preferences: 'Preferencias',
  timeFormat: 'Formato de Hora',
  timeFormatDesc: 'Elige formato de 12 o 24 horas',
  dataPrivacy: 'Datos y Privacidad',
  deleteAccount: 'Eliminar Cuenta',
  appInfo: 'Info de la App',
  appVersion: 'Zen Planner v1.0.0',
  aiPoweredProductivity: 'App de Productividad con IA',
  language: 'Idioma',
  languageDesc: 'Elige tu idioma preferido',

  allFeaturesFree: '¡Todas las funciones son gratuitas!',
  freeForever: 'Gratis Para Siempre',
  enjoyUnlimited: 'Disfruta acceso ilimitado a todas las funciones incluyendo:',
  unlimitedTasksGoalsHabits: 'Tareas, metas y hábitos ilimitados',
  aiAdvisorUnlimited: 'Asesor IA - mensajes ilimitados',
  advancedAnalytics: 'Analíticas avanzadas',
  teamCollaboration: 'Colaboración en equipo',
  smartReminders: 'Recordatorios inteligentes',
  calendarSync: 'Sincronización de calendario',

  choosePlan: 'Elige tu plan',
  choosePlanToStart: 'Elige un plan para desbloquear todas las funciones y aumentar tu productividad.',
  earlyAdopter: 'Usuario Pionero',
  earlyAdopterDesc: '¡Eres uno de nuestros primeros 100 usuarios! Todas las funciones están desbloqueadas para ti — para siempre.',
  earlyAdopterWelcome: '¡Eres un usuario pionero! Todas las funciones están desbloqueadas de por vida. Gracias por ser uno de nuestros primeros usuarios.',
  earlyAdopterSpotsLeft: '{count} lugares de usuario pionero restantes',
  earlyAdopterSpotsFilled: 'Todos los lugares de usuario pionero se han llenado',
  lifetimeFree: 'Gratis de por vida',
  popular: 'Popular',
  perMonth: 'mes',
  trialDays: '{days} días de prueba gratis',
  currentPlanBadge: 'Plan Actual',
  startTrial: 'Iniciar Prueba Gratis',
  selectPlan: 'Seleccionar Plan',
  planSelected: 'Plan seleccionado. Bienvenido a Zen Planner.',

  pendingCount: 'pendientes',
  trial: 'Prueba',

  newBadge: 'NUEVO',
};

const zh: Translations = {
  appName: 'Zen Planner',
  appTagline: 'AI 驱动的生产力工具',
  loading: '正在加载 Zen Planner...',

  createAccount: '创建您的账户',
  welcomeBack: '欢迎回来',
  startJourney: '今天开始您的效率之旅',
  continueWhereLeft: '登录以继续您的工作',
  fullName: '全名',
  emailAddress: '电子邮件地址',
  password: '密码',
  confirmPassword: '确认密码',
  atLeast6Chars: '至少6个字符',
  enterYourPassword: '输入您的密码',
  confirmYourPassword: '确认您的密码',
  createAccountBtn: '创建账户',
  signIn: '登录',
  signUp: '注册',
  alreadyHaveAccount: '已有账户？',
  dontHaveAccount: '还没有账户？',
  privacyPolicyAgree: '创建账户即表示您同意我们的',
  privacyPolicy: '隐私政策',
  nameRequired: '姓名为必填项。',
  emailRequired: '电子邮件为必填项。',
  validEmail: '请输入有效的电子邮件地址。',
  passwordLength: '密码至少需要6个字符。',
  passwordsNoMatch: '两次密码不一致。',
  passwordRequired: '密码为必填项。',
  signUpFailed: '注册失败。',
  signInFailed: '登录失败。',
  forgotPassword: '忘记密码？',
  forgotPasswordTitle: '重置密码',
  forgotPasswordDesc: '输入您的邮箱，我们将发送重置链接。',
  sendResetLink: '发送重置链接',
  resetLinkSent: '您的重置链接已准备好',
  resetLinkSentDesc: '如果该邮箱已注册账号，您将收到重置链接。',
  tapToReset: '点击此处重置您的密码',
  backToSignIn: '返回登录',
  resetEmailRequired: '请输入您的电子邮件地址。',
  resetRequestFailed: '发送重置邮件失败，请重试。',

  welcomeUser: '欢迎，{name}！',
  allFeaturesFreeLine: '所有功能现在免费！享受任务、目标、习惯、AI顾问等无限访问权限。',
  getStarted: '开始使用',

  tasks: '任务',
  calendar: '日历',
  aiAdvisor: 'AI 顾问',
  goals: '目标',
  habits: '习惯',
  analytics: '分析',
  team: '团队',
  settings: '设置',
  about: '关于',
  install: '安装',

  addNewTask: '添加新任务...',
  noTasksYet: '还没有任务。在上方添加您的第一个任务！',
  due: '截止',

  noReminder: '无提醒',
  min5Before: '提前5分钟',
  min15Before: '提前15分钟',
  min30Before: '提前30分钟',
  hour1Before: '提前1小时',
  day1Before: '提前1天',

  high: '高',
  medium: '中',
  low: '低',

  addTask: '添加任务',
  addGoal: '添加目标',
  today: '今天',
  moreTasks: '更多',

  addTaskDialog: '添加任务',
  taskTitle: '任务标题',
  enterTaskTitle: '输入任务标题...',
  dueDate: '截止日期',
  cancel: '取消',
  addTaskBtn: '添加任务',
  addGoalDialog: '添加目标',
  goalTitle: '目标标题',
  enterGoalTitle: '输入目标标题...',
  targetDate: '目标日期',
  addGoalBtn: '添加目标',
  taskCount: '个任务',

  aiGreeting: '嗨！我是您的 AI 效率顾问。有任何问题都可以问我！',
  askAiPlaceholder: '向 AI 寻求建议...',
  errorTryAgain: '抱歉，遇到了错误。请重试。',
  connectionError: '连接错误。请重试。',

  addNewGoal: '添加新目标...',
  noGoalsYet: '还没有目标。在上方设置您的第一个目标！',

  addNewHabit: '添加新习惯...',
  noHabitsYet: '还没有习惯。在上方开始追踪您的第一个习惯！',

  productivityScore: '生产力评分',
  totalTasks: '总任务',
  completed: '已完成',
  pending: '待处理',
  completionRate: '完成率',
  tasksByPriority: '按优先级分类任务',
  weeklyTrend: '每周趋势',
  goalsProgress: '目标进度',
  habitStreaks: '习惯连续记录',
  tasksByCategory: '按类别分类任务',
  noGoalsYetShort: '还没有目标',
  noHabitsYetShort: '还没有习惯',
  upgradeToPro: '升级到专业版',
  advancedAnalyticsDesc: '获取高级分析、每周趋势、目标跟踪和习惯连续记录',
  viewPlans: '查看计划',

  teamMembers: '团队成员',
  invite: '邀请',
  noTeamMembersYet: '还没有团队成员。邀请您的第一位团队成员！',
  seatsRemaining: '个席位剩余',
  unlimited: '无限制',
  sharedCalendarAccess: '共享日历访问',
  sharedCalendarDesc: '团队成员可以根据其角色权限查看和编辑共享任务和目标。',
  upgradeToBusiness: '升级到商业版',
  businessDesc: '邀请团队成员、共享日历并共同协作',

  account: '账户',
  currentPlan: '当前计划',
  changePlan: '更改计划',
  preferences: '偏好设置',
  timeFormat: '时间格式',
  timeFormatDesc: '选择12小时或24小时格式',
  dataPrivacy: '数据与隐私',
  deleteAccount: '删除账户',
  appInfo: '应用信息',
  appVersion: 'Zen Planner v1.0.0',
  aiPoweredProductivity: 'AI 驱动的效率应用',
  language: '语言',
  languageDesc: '选择您的首选语言',

  allFeaturesFree: '所有功能免费！',
  freeForever: '永久免费',
  enjoyUnlimited: '享受所有功能的无限访问，包括：',
  unlimitedTasksGoalsHabits: '无限任务、目标和习惯',
  aiAdvisorUnlimited: 'AI 顾问 - 无限消息',
  advancedAnalytics: '高级分析',
  teamCollaboration: '团队协作',
  smartReminders: '智能提醒',
  calendarSync: '日历同步',

  choosePlan: '选择您的计划',
  choosePlanToStart: '选择一个计划来解锁所有功能，提升您的生产力。',
  earlyAdopter: '早期用户',
  earlyAdopterDesc: '您是我们前100位用户之一！所有功能已永久为您解锁。',
  earlyAdopterWelcome: '您是早期用户！所有功能已终身为您解锁。感谢您成为我们的首批用户。',
  earlyAdopterSpotsLeft: '剩余 {count} 个早期用户名额',
  earlyAdopterSpotsFilled: '所有早期用户名额已满',
  lifetimeFree: '终身免费',
  popular: '热门',
  perMonth: '月',
  trialDays: '{days}天免费试用',
  currentPlanBadge: '当前计划',
  startTrial: '开始免费试用',
  selectPlan: '选择计划',
  planSelected: '计划已选择！欢迎使用 Zen Planner。',

  pendingCount: '待处理',
  trial: '试用',

  newBadge: '新',
};

const hi: Translations = {
  appName: 'Zen Planner',
  appTagline: 'AI-संचालित उत्पादकता',
  loading: 'Zen Planner लोड हो रहा है...',

  createAccount: 'अपना खाता बनाएं',
  welcomeBack: 'वापस स्वागत है',
  startJourney: 'आज अपनी उत्पादकता यात्रा शुरू करें',
  continueWhereLeft: 'जहाँ छोड़ा था वहाँ से जारी रखने के लिए साइन इन करें',
  fullName: 'पूरा नाम',
  emailAddress: 'ईमेल पता',
  password: 'पासवर्ड',
  confirmPassword: 'पासवर्ड की पुष्टि करें',
  atLeast6Chars: 'कम से कम 6 अक्षर',
  enterYourPassword: 'अपना पासवर्ड दर्ज करें',
  confirmYourPassword: 'अपना पासवर्ड पुष्टि करें',
  createAccountBtn: 'खाता बनाएं',
  signIn: 'साइन इन करें',
  signUp: 'साइन अप करें',
  alreadyHaveAccount: 'पहले से खाता है?',
  dontHaveAccount: 'खाता नहीं है?',
  privacyPolicyAgree: 'खाता बनाकर आप हमारी सहमति देते हैं',
  privacyPolicy: 'गोपनीयता नीति',
  nameRequired: 'नाम आवश्यक है।',
  emailRequired: 'ईमेल आवश्यक है।',
  validEmail: 'कृपया एक वैध ईमेल पता दर्ज करें।',
  passwordLength: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
  passwordsNoMatch: 'पासवर्ड मेल नहीं खाते।',
  passwordRequired: 'पासवर्ड आवश्यक है।',
  signUpFailed: 'साइन अप विफल।',
  signInFailed: 'साइन इन विफल।',
  forgotPassword: 'पासवर्ड भूल गए?',
  forgotPasswordTitle: 'पासवर्ड रीसेट करें',
  forgotPasswordDesc: 'अपना ईमेल दर्ज करें और हम आपको एक रीसेट लिंक भेजेंगे।',
  sendResetLink: 'रीसेट लिंक भेजें',
  resetLinkSent: 'आपका रीसेट लिंक तैयार है',
  resetLinkSentDesc: 'यदि उस ईमेल पर कोई खाता है, तो आपको शीघ्र ही एक रीसेट लिंक मिलेगा।',
  tapToReset: 'पासवर्ड रीसेट करने के लिए यहां टैप करें',
  backToSignIn: 'साइन इन पर वापस जाएं',
  resetEmailRequired: 'कृपया अपना ईमेल पता दर्ज करें।',
  resetRequestFailed: 'रीसेट ईमेल भेजने में विफल। कृपया पुनः प्रयास करें।',

  welcomeUser: 'स्वागत है, {name}!',
  allFeaturesFreeLine: 'सभी सुविधाएँ अब मुफ्त हैं! कार्यों, लक्ष्यों, आदतों, AI सलाहकार और अधिक तक असीमित पहुँच का आनंद लें।',
  getStarted: 'शुरू करें',

  tasks: 'कार्य',
  calendar: 'कैलेंडर',
  aiAdvisor: 'AI सलाहकार',
  goals: 'लक्ष्य',
  habits: 'आदतें',
  analytics: 'विश्लेषण',
  team: 'टीम',
  settings: 'सेटिंग्स',
  about: 'के बारे में',
  install: 'इंस्टॉल करें',

  addNewTask: 'नया कार्य जोड़ें...',
  noTasksYet: 'अभी कोई कार्य नहीं। ऊपर अपना पहला कार्य जोड़ें!',
  due: 'देय',

  noReminder: 'कोई रिमाइंडर नहीं',
  min5Before: '5 मिनट पहले',
  min15Before: '15 मिनट पहले',
  min30Before: '30 मिनट पहले',
  hour1Before: '1 घंटा पहले',
  day1Before: '1 दिन पहले',

  high: 'उच्च',
  medium: 'मध्यम',
  low: 'कम',

  addTask: 'कार्य जोड़ें',
  addGoal: 'लक्ष्य जोड़ें',
  today: 'आज',
  moreTasks: 'और',

  addTaskDialog: 'कार्य जोड़ें',
  taskTitle: 'कार्य शीर्षक',
  enterTaskTitle: 'कार्य शीर्षक दर्ज करें...',
  dueDate: 'नियत तारीख',
  cancel: 'रद्द करें',
  addTaskBtn: 'कार्य जोड़ें',
  addGoalDialog: 'लक्ष्य जोड़ें',
  goalTitle: 'लक्ष्य शीर्षक',
  enterGoalTitle: 'लक्ष्य शीर्षक दर्ज करें...',
  targetDate: 'लक्ष्य तारीख',
  addGoalBtn: 'लक्ष्य जोड़ें',
  taskCount: 'कार्य',

  aiGreeting: 'नमस्ते! मैं आपका AI उत्पादकता सलाहकार हूँ। कुछ भी पूछें!',
  askAiPlaceholder: 'AI से सलाह माँगें...',
  errorTryAgain: 'क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
  connectionError: 'कनेक्शन त्रुटि। कृपया पुनः प्रयास करें।',

  addNewGoal: 'नया लक्ष्य जोड़ें...',
  noGoalsYet: 'अभी कोई लक्ष्य नहीं। ऊपर अपना पहला लक्ष्य निर्धारित करें!',

  addNewHabit: 'नई आदत जोड़ें...',
  noHabitsYet: 'अभी कोई आदत नहीं। ऊपर अपनी पहली आदत ट्रैक करना शुरू करें!',

  productivityScore: 'उत्पादकता स्कोर',
  totalTasks: 'कुल कार्य',
  completed: 'पूर्ण',
  pending: 'लंबित',
  completionRate: 'पूर्णता दर',
  tasksByPriority: 'प्राथमिकता के अनुसार कार्य',
  weeklyTrend: 'साप्ताहिक रुझान',
  goalsProgress: 'लक्ष्य प्रगति',
  habitStreaks: 'आदत स्ट्रीक',
  tasksByCategory: 'श्रेणी के अनुसार कार्य',
  noGoalsYetShort: 'अभी कोई लक्ष्य नहीं',
  noHabitsYetShort: 'अभी कोई आदत नहीं',
  upgradeToPro: 'Pro में अपग्रेड करें',
  advancedAnalyticsDesc: 'उन्नत विश्लेषण, साप्ताहिक रुझान, लक्ष्य ट्रैकिंग और आदत स्ट्रीक प्राप्त करें',
  viewPlans: 'योजनाएँ देखें',

  teamMembers: 'टीम सदस्य',
  invite: 'आमंत्रित करें',
  noTeamMembersYet: 'अभी कोई टीम सदस्य नहीं। अपने पहले टीम सदस्य को आमंत्रित करें!',
  seatsRemaining: 'सीटें बची हैं',
  unlimited: 'असीमित',
  sharedCalendarAccess: 'साझा कैलेंडर एक्सेस',
  sharedCalendarDesc: 'टीम सदस्य अपनी भूमिका अनुमतियों के आधार पर साझा कार्यों और लक्ष्यों को देख और संपादित कर सकते हैं।',
  upgradeToBusiness: 'Business में अपग्रेड करें',
  businessDesc: 'टीम सदस्यों को आमंत्रित करें, कैलेंडर साझा करें और मिलकर सहयोग करें',

  account: 'खाता',
  currentPlan: 'वर्तमान योजना',
  changePlan: 'योजना बदलें',
  preferences: 'प्राथमिकताएँ',
  timeFormat: 'समय प्रारूप',
  timeFormatDesc: '12-घंटे या 24-घंटे प्रारूप चुनें',
  dataPrivacy: 'डेटा और गोपनीयता',
  deleteAccount: 'खाता हटाएं',
  appInfo: 'ऐप जानकारी',
  appVersion: 'Zen Planner v1.0.0',
  aiPoweredProductivity: 'AI-संचालित उत्पादकता ऐप',
  language: 'भाषा',
  languageDesc: 'अपनी पसंदीदा भाषा चुनें',

  allFeaturesFree: 'सभी सुविधाएँ मुफ्त हैं!',
  freeForever: 'हमेशा के लिए मुफ्त',
  enjoyUnlimited: 'सभी सुविधाओं तक असीमित पहुँच का आनंद लें जिसमें शामिल हैं:',
  unlimitedTasksGoalsHabits: 'असीमित कार्य, लक्ष्य और आदतें',
  aiAdvisorUnlimited: 'AI सलाहकार - असीमित संदेश',
  advancedAnalytics: 'उन्नत विश्लेषण',
  teamCollaboration: 'टीम सहयोग',
  smartReminders: 'स्मार्ट रिमाइंडर',
  calendarSync: 'कैलेंडर सिंक',

  choosePlan: 'अपना प्लान चुनें',
  choosePlanToStart: 'सभी सुविधाओं को अनलॉक करने और अपनी उत्पादकता बढ़ाने के लिए एक प्लान चुनें।',
  earlyAdopter: 'अर्ली एडॉप्टर',
  earlyAdopterDesc: 'आप हमारे पहले 100 उपयोगकर्ताओं में से एक हैं! सभी सुविधाएँ आपके लिए हमेशा के लिए अनलॉक हैं।',
  earlyAdopterWelcome: 'आप एक अर्ली एडॉप्टर हैं! सभी सुविधाएँ आजीवन आपके लिए अनलॉक हैं। हमारे पहले उपयोगकर्ताओं में से होने के लिए धन्यवाद।',
  earlyAdopterSpotsLeft: '{count} अर्ली एडॉप्टर स्थान शेष',
  earlyAdopterSpotsFilled: 'सभी अर्ली एडॉप्टर स्थान भर गए हैं',
  lifetimeFree: 'आजीवन मुफ्त',
  popular: 'लोकप्रिय',
  perMonth: 'माह',
  trialDays: '{days}-दिन मुफ्त परीक्षण',
  currentPlanBadge: 'वर्तमान प्लान',
  startTrial: 'मुफ्त परीक्षण शुरू करें',
  selectPlan: 'प्लान चुनें',
  planSelected: 'प्लान चुना गया! Zen Planner में आपका स्वागत है।',

  pendingCount: 'लंबित',
  trial: 'परीक्षण',

  newBadge: 'नया',
};

const fr: Translations = {
  appName: 'Zen Planner',
  appTagline: 'Productivité Propulsée par l\'IA',
  loading: 'Chargement de Zen Planner...',

  createAccount: 'Créer Votre Compte',
  welcomeBack: 'Bon Retour',
  startJourney: 'Commencez votre voyage de productivité aujourd\'hui',
  continueWhereLeft: 'Connectez-vous pour continuer là où vous en étiez',
  fullName: 'Nom Complet',
  emailAddress: 'Adresse E-mail',
  password: 'Mot de passe',
  confirmPassword: 'Confirmer le mot de passe',
  atLeast6Chars: 'Au moins 6 caractères',
  enterYourPassword: 'Entrez votre mot de passe',
  confirmYourPassword: 'Confirmez votre mot de passe',
  createAccountBtn: 'Créer un Compte',
  signIn: 'Se Connecter',
  signUp: 'S\'inscrire',
  alreadyHaveAccount: 'Vous avez déjà un compte ?',
  dontHaveAccount: 'Vous n\'avez pas de compte ?',
  privacyPolicyAgree: 'En créant un compte, vous acceptez notre',
  privacyPolicy: 'Politique de Confidentialité',
  nameRequired: 'Le nom est obligatoire.',
  emailRequired: 'L\'e-mail est obligatoire.',
  validEmail: 'Veuillez entrer une adresse e-mail valide.',
  passwordLength: 'Le mot de passe doit comporter au moins 6 caractères.',
  passwordsNoMatch: 'Les mots de passe ne correspondent pas.',
  passwordRequired: 'Le mot de passe est obligatoire.',
  signUpFailed: 'Échec de l\'inscription.',
  signInFailed: 'Échec de la connexion.',
  forgotPassword: 'Mot de passe oublié ?',
  forgotPasswordTitle: 'Réinitialiser le mot de passe',
  forgotPasswordDesc: 'Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.',
  sendResetLink: 'Envoyer le lien',
  resetLinkSent: 'Votre lien de réinitialisation est prêt',
  resetLinkSentDesc: 'Si un compte existe pour cet e-mail, vous recevrez un lien très prochainement.',
  tapToReset: 'Appuyez ici pour réinitialiser votre mot de passe',
  backToSignIn: 'Retour à la connexion',
  resetEmailRequired: 'Veuillez entrer votre adresse e-mail.',
  resetRequestFailed: 'Échec de l\'envoi de l\'e-mail. Veuillez réessayer.',

  welcomeUser: 'Bienvenue, {name} !',
  allFeaturesFreeLine: 'Toutes les fonctionnalités sont maintenant gratuites ! Profitez d\'un accès illimité aux tâches, objectifs, habitudes, conseiller IA et plus.',
  getStarted: 'Commencer',

  tasks: 'Tâches',
  calendar: 'Calendrier',
  aiAdvisor: 'Conseiller IA',
  goals: 'Objectifs',
  habits: 'Habitudes',
  analytics: 'Analytiques',
  team: 'Équipe',
  settings: 'Paramètres',
  about: 'À propos',
  install: 'Installer',

  addNewTask: 'Ajouter une nouvelle tâche...',
  noTasksYet: 'Aucune tâche pour l\'instant. Ajoutez votre première tâche ci-dessus !',
  due: 'échéance',

  noReminder: 'Aucun rappel',
  min5Before: '5 min avant',
  min15Before: '15 min avant',
  min30Before: '30 min avant',
  hour1Before: '1 heure avant',
  day1Before: '1 jour avant',

  high: 'élevée',
  medium: 'moyenne',
  low: 'faible',

  addTask: 'Ajouter une Tâche',
  addGoal: 'Ajouter un Objectif',
  today: 'Aujourd\'hui',
  moreTasks: 'plus',

  addTaskDialog: 'Ajouter une Tâche',
  taskTitle: 'Titre de la Tâche',
  enterTaskTitle: 'Entrez le titre de la tâche...',
  dueDate: 'Date d\'échéance',
  cancel: 'Annuler',
  addTaskBtn: 'Ajouter la Tâche',
  addGoalDialog: 'Ajouter un Objectif',
  goalTitle: 'Titre de l\'Objectif',
  enterGoalTitle: 'Entrez le titre de l\'objectif...',
  targetDate: 'Date Cible',
  addGoalBtn: 'Ajouter l\'Objectif',
  taskCount: 'tâche(s)',

  aiGreeting: 'Bonjour ! Je suis votre conseiller IA en productivité. Posez-moi n\'importe quelle question !',
  askAiPlaceholder: 'Demandez conseil à l\'IA...',
  errorTryAgain: 'Désolé, j\'ai rencontré une erreur. Veuillez réessayer.',
  connectionError: 'Erreur de connexion. Veuillez réessayer.',

  addNewGoal: 'Ajouter un nouvel objectif...',
  noGoalsYet: 'Aucun objectif pour l\'instant. Définissez votre premier objectif ci-dessus !',

  addNewHabit: 'Ajouter une nouvelle habitude...',
  noHabitsYet: 'Aucune habitude pour l\'instant. Commencez à suivre votre première habitude ci-dessus !',

  productivityScore: 'Score de Productivité',
  totalTasks: 'Total des Tâches',
  completed: 'Terminées',
  pending: 'En attente',
  completionRate: 'Taux d\'Achèvement',
  tasksByPriority: 'Tâches par Priorité',
  weeklyTrend: 'Tendance Hebdomadaire',
  goalsProgress: 'Progrès des Objectifs',
  habitStreaks: 'Séries d\'Habitudes',
  tasksByCategory: 'Tâches par Catégorie',
  noGoalsYetShort: 'Aucun objectif',
  noHabitsYetShort: 'Aucune habitude',
  upgradeToPro: 'Passer à Pro',
  advancedAnalyticsDesc: 'Obtenez des analyses avancées, des tendances hebdomadaires, le suivi des objectifs et les séries d\'habitudes',
  viewPlans: 'Voir les Plans',

  teamMembers: 'Membres de l\'Équipe',
  invite: 'Inviter',
  noTeamMembersYet: 'Aucun membre pour l\'instant. Invitez votre premier membre d\'équipe !',
  seatsRemaining: 'places restantes',
  unlimited: 'Illimité',
  sharedCalendarAccess: 'Accès au Calendrier Partagé',
  sharedCalendarDesc: 'Les membres de l\'équipe peuvent afficher et modifier les tâches et objectifs partagés selon leurs autorisations.',
  upgradeToBusiness: 'Passer à Business',
  businessDesc: 'Invitez des membres, partagez des calendriers et collaborez ensemble',

  account: 'Compte',
  currentPlan: 'Plan Actuel',
  changePlan: 'Changer de Plan',
  preferences: 'Préférences',
  timeFormat: 'Format d\'Heure',
  timeFormatDesc: 'Choisissez le format 12 heures ou 24 heures',
  dataPrivacy: 'Données et Confidentialité',
  deleteAccount: 'Supprimer le Compte',
  appInfo: 'Infos sur l\'Application',
  appVersion: 'Zen Planner v1.0.0',
  aiPoweredProductivity: 'Application de Productivité IA',
  language: 'Langue',
  languageDesc: 'Choisissez votre langue préférée',

  allFeaturesFree: 'Toutes les fonctionnalités sont gratuites !',
  freeForever: 'Gratuit Pour Toujours',
  enjoyUnlimited: 'Profitez d\'un accès illimité à toutes les fonctionnalités, notamment :',
  unlimitedTasksGoalsHabits: 'Tâches, objectifs et habitudes illimités',
  aiAdvisorUnlimited: 'Conseiller IA - messages illimités',
  advancedAnalytics: 'Analyses avancées',
  teamCollaboration: 'Collaboration en équipe',
  smartReminders: 'Rappels intelligents',
  calendarSync: 'Synchronisation du calendrier',

  choosePlan: 'Choisissez votre plan',
  choosePlanToStart: 'Choisissez un plan pour débloquer toutes les fonctionnalités et booster votre productivité.',
  earlyAdopter: 'Adopteur Précoce',
  earlyAdopterDesc: 'Vous êtes l\'un de nos 100 premiers utilisateurs ! Toutes les fonctionnalités sont débloquées pour vous — à vie.',
  earlyAdopterWelcome: 'Vous êtes un adopteur précoce ! Toutes les fonctionnalités sont débloquées à vie. Merci d\'être l\'un de nos premiers utilisateurs.',
  earlyAdopterSpotsLeft: '{count} places d\'adopteur précoce restantes',
  earlyAdopterSpotsFilled: 'Toutes les places d\'adopteur précoce sont prises',
  lifetimeFree: 'Gratuit à vie',
  popular: 'Populaire',
  perMonth: 'mois',
  trialDays: '{days} jours d\'essai gratuit',
  currentPlanBadge: 'Plan Actuel',
  startTrial: 'Commencer l\'Essai Gratuit',
  selectPlan: 'Sélectionner le Plan',
  planSelected: 'Plan sélectionné ! Bienvenue sur Zen Planner.',

  pendingCount: 'en attente',
  trial: 'Essai',

  newBadge: 'NOUVEAU',
};

export const translations: Record<Locale, Translations> = { en, es, zh, hi, fr };

/**
 * Detect the best supported locale from the browser's language settings.
 * Falls back to 'en' if no match is found.
 */
export function detectSystemLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of langs) {
    const code = lang.split('-')[0].toLowerCase();
    // Map common variants
    if (code === 'zh' || lang.startsWith('zh')) return 'zh';
    if (code === 'es') return 'es';
    if (code === 'hi') return 'hi';
    if (code === 'fr') return 'fr';
    if (code === 'en') return 'en';
  }
  return 'en';
}

/**
 * Simple interpolation: replaces {name} style tokens.
 */
export function t(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), val),
    text
  );
}
