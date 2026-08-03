import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** Most recent Sunday (or today if it is Sunday) — the week anchor for reviews. */
export function weekStartIso(todayIsoDate: string): string {
  const today = parseISO(todayIsoDate);
  return format(addDays(today, -today.getDay()), 'yyyy-MM-dd');
}

/** True within `windowDays` of the goal cycle's end (and after it, until archived). */
export function isQuarterEndDue(cycleEndIso: string, todayIsoDate: string, windowDays = 7): boolean {
  return differenceInCalendarDays(parseISO(cycleEndIso), parseISO(todayIsoDate)) <= windowDays;
}
