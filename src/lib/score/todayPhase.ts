export type TodayPhase = 'morning' | 'daytime' | 'evening';

/** Which slice of the day drives the Today screen's layout. */
export function todayPhase(now: Date): TodayPhase {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'daytime';
  return 'evening';
}
