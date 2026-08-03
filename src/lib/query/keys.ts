export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  five45Today: (userId: string, date: string) => ['five45', 'today', userId, date] as const,
  five45Template: (userId: string, dayType: string) => ['five45', 'template', userId, dayType] as const,
  five45History: (userId: string) => ['five45', 'history', userId] as const,
  goals: (userId: string) => ['goals', userId] as const,
  prayerToday: (userId: string, date: string) => ['prayer', 'today', userId, date] as const,
  prayerHistory: (userId: string) => ['prayer', 'history', userId] as const,
  qada: (userId: string) => ['prayer', 'qada', userId] as const,
  retention: (userId: string) => ['retention', userId] as const,
  sleep: (userId: string) => ['sleep', userId] as const,
  workoutCycle: (userId: string) => ['workout', 'cycle', userId] as const,
  workoutToday: (userId: string, date: string) => ['workout', 'today', userId, date] as const,
  workoutHistory: (userId: string) => ['workout', 'history', userId] as const,
  exerciseCatalog: (userId: string) => ['workout', 'catalog', userId] as const,
  exerciseProgress: (userId: string, exerciseId: string) =>
    ['workout', 'progress', userId, exerciseId] as const,
  workToday: (userId: string, date: string) => ['work', 'today', userId, date] as const,
  workTargets: (userId: string) => ['work', 'targets', userId] as const,
  workRange: (userId: string, fromDate: string, toDate: string) =>
    ['work', 'range', userId, fromDate, toDate] as const,
  weeklyReview: (userId: string, weekStart: string) => ['reviews', 'weekly', userId, weekStart] as const,
  notificationPrefs: (userId: string) => ['notificationPrefs', userId] as const,
};
