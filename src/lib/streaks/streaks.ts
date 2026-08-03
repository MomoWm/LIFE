import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** 'YYYY-MM-DD' */
export type IsoDate = string;

function shiftIsoDate(date: IsoDate, days: number): IsoDate {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd');
}

/**
 * Counts consecutive completed days ending at (or just before) `todayIso`.
 * A day that isn't completed yet doesn't break the streak until it's over —
 * so an incomplete "today" still shows yesterday's streak, not zero.
 */
export function computeDailyCompletionStreak(
  completedDates: ReadonlySet<IsoDate>,
  todayIso: IsoDate
): number {
  let cursor = completedDates.has(todayIso) ? todayIso : shiftIsoDate(todayIso, -1);
  let streak = 0;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = shiftIsoDate(cursor, -1);
  }

  return streak;
}

/** Whole calendar days elapsed since `start`, floored at 0 for future/invalid inputs. */
export function daysSince(start: Date, now: Date = new Date()): number {
  return Math.max(0, differenceInCalendarDays(now, start));
}
