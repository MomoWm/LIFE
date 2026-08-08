import { CalculationMethod, Coordinates, Madhab, PrayerTimes, type CalculationParameters } from 'adhan';

import type { PrayerName } from '@/lib/db/types';

export const PRAYER_NAMES: readonly PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const CALC_METHODS = [
  'MoonsightingCommittee',
  'MuslimWorldLeague',
  'NorthAmerica',
  'Egyptian',
  'Karachi',
  'UmmAlQura',
  'Dubai',
  'Kuwait',
  'Qatar',
  'Singapore',
  'Turkey',
] as const;

export type CalcMethodName = (typeof CALC_METHODS)[number];

function paramsFor(method: string, madhab: 'shafi' | 'hanafi'): CalculationParameters {
  const factory =
    (CalculationMethod as unknown as Record<string, () => CalculationParameters>)[method] ??
    CalculationMethod.MoonsightingCommittee;
  const params = factory();
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export type DailyPrayerTimes = Record<PrayerName, Date>;

export function computePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: string,
  madhab: 'shafi' | 'hanafi'
): DailyPrayerTimes {
  const times = new PrayerTimes(new Coordinates(latitude, longitude), date, paramsFor(method, madhab));
  return {
    fajr: times.fajr,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

/** The first prayer of `times` still ahead of `now`, or null once Isha has passed. */
export function nextPrayer(times: DailyPrayerTimes, now: Date): PrayerName | null {
  for (const name of PRAYER_NAMES) {
    if (times[name] > now) return name;
  }
  return null;
}
