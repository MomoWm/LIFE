import { differenceInMinutes, parseISO, set, subDays } from 'date-fns';

/**
 * Turns "bed at HH:mm, woke at HH:mm" for a given wake-date into real timestamps.
 * A bed time in the afternoon/evening (15:00+) is assumed to be the previous
 * calendar day; anything earlier is a past-midnight bedtime on the wake day.
 */
export function resolveSleepTimestamps(
  wakeDateIso: string,
  bedTime: { hours: number; minutes: number },
  wakeTime: { hours: number; minutes: number }
): { bedAt: Date; wakeAt: Date } {
  const wakeDay = parseISO(wakeDateIso);
  const wakeAt = set(wakeDay, {
    hours: wakeTime.hours,
    minutes: wakeTime.minutes,
    seconds: 0,
    milliseconds: 0,
  });
  const bedDay = bedTime.hours >= 15 ? subDays(wakeDay, 1) : wakeDay;
  const bedAt = set(bedDay, {
    hours: bedTime.hours,
    minutes: bedTime.minutes,
    seconds: 0,
    milliseconds: 0,
  });
  return { bedAt, wakeAt };
}

/** Minutes asleep; 0 when wake precedes bed (bad input). */
export function sleepDurationMinutes(bedAt: Date, wakeAt: Date): number {
  return Math.max(0, differenceInMinutes(wakeAt, bedAt));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
