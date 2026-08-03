import { differenceInCalendarDays } from 'date-fns';

export type RetentionStats = {
  /** Days since the most recent reset; null when tracking hasn't started. */
  currentStreakDays: number | null;
  /** Longest run between resets (including the current run). */
  bestStreakDays: number;
  totalResets: number;
};

export function computeRetentionStats(resetsDesc: Date[], now: Date): RetentionStats {
  if (resetsDesc.length === 0) {
    return { currentStreakDays: null, bestStreakDays: 0, totalResets: 0 };
  }

  const sorted = [...resetsDesc].sort((a, b) => a.getTime() - b.getTime());
  const current = Math.max(0, differenceInCalendarDays(now, sorted[sorted.length - 1]));

  let best = current;
  for (let i = 1; i < sorted.length; i++) {
    best = Math.max(best, differenceInCalendarDays(sorted[i], sorted[i - 1]));
  }

  return { currentStreakDays: current, bestStreakDays: best, totalResets: sorted.length };
}
