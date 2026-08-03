import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * 1-based day (1-8) of the rotating split for `dateIso`, anchored at
 * `cycleStartIso` (= day 1). Null when the cycle hasn't started yet.
 */
export function cycleDayFor(dateIso: string, cycleStartIso: string): number | null {
  const diff = differenceInCalendarDays(parseISO(dateIso), parseISO(cycleStartIso));
  if (diff < 0) return null;
  return (diff % 8) + 1;
}
