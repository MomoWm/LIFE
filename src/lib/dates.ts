import { format } from 'date-fns';

/** 'YYYY-MM-DD' in the device's local calendar. All `date` columns use this. */
export function todayIso(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}
