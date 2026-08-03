import { cycleDayFor } from './cycle';
import { SPLIT, splitForDay } from './split';

describe('cycleDayFor', () => {
  it('is day 1 on the start date', () => {
    expect(cycleDayFor('2026-08-01', '2026-08-01')).toBe(1);
  });

  it('walks the first cycle', () => {
    expect(cycleDayFor('2026-08-04', '2026-08-01')).toBe(4);
    expect(cycleDayFor('2026-08-08', '2026-08-01')).toBe(8);
  });

  it('wraps to day 1 after day 8', () => {
    expect(cycleDayFor('2026-08-09', '2026-08-01')).toBe(1);
    expect(cycleDayFor('2026-08-17', '2026-08-01')).toBe(1);
  });

  it('handles long spans and month boundaries', () => {
    // 2026-08-01 + 32 days = 2026-09-02; 32 % 8 = 0 -> day 1
    expect(cycleDayFor('2026-09-02', '2026-08-01')).toBe(1);
    expect(cycleDayFor('2026-09-05', '2026-08-01')).toBe(4);
  });

  it('spans leap-year February correctly', () => {
    // 2028 is a leap year: Feb 28 -> Mar 1 is 2 days.
    expect(cycleDayFor('2028-03-01', '2028-02-28')).toBe(3);
  });

  it('returns null before the cycle starts', () => {
    expect(cycleDayFor('2026-07-31', '2026-08-01')).toBeNull();
  });
});

describe('splitForDay', () => {
  it('maps all 8 days to the fixed rotation', () => {
    expect(splitForDay(1).label).toBe('Chest · Shoulders · Triceps');
    expect(splitForDay(4).isRest).toBe(true);
    expect(splitForDay(8).isRest).toBe(true);
    expect(splitForDay(6).label).toBe('Back & Chest');
  });

  it('has exactly 8 days with 2 rest days', () => {
    expect(SPLIT).toHaveLength(8);
    expect(SPLIT.filter((d) => d.isRest)).toHaveLength(2);
  });
});
