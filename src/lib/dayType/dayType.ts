export type DayType = 'standard' | 'meeting' | 'saturday' | 'sunday';

export const DAY_TYPES: readonly DayType[] = ['standard', 'meeting', 'saturday', 'sunday'];

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  standard: 'Standard (Mon/Wed/Thu)',
  meeting: 'Meeting day (Tue/Fri)',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const WEEKDAY_TO_DAY_TYPE: Record<number, DayType> = {
  0: 'sunday',
  1: 'standard',
  2: 'meeting',
  3: 'standard',
  4: 'standard',
  5: 'meeting',
  6: 'saturday',
};

/** Resolves which 545 template applies to a given date, using its local calendar day. */
export function resolveDayType(date: Date): DayType {
  return WEEKDAY_TO_DAY_TYPE[date.getDay()];
}
