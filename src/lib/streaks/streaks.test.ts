import { computeDailyCompletionStreak, daysSince } from './streaks';

describe('computeDailyCompletionStreak', () => {
  it('returns 0 for no completed days', () => {
    expect(computeDailyCompletionStreak(new Set(), '2026-08-03')).toBe(0);
  });

  it('counts today when today is complete', () => {
    const done = new Set(['2026-08-03', '2026-08-02', '2026-08-01']);
    expect(computeDailyCompletionStreak(done, '2026-08-03')).toBe(3);
  });

  it('does not break the streak while today is still incomplete', () => {
    const done = new Set(['2026-08-02', '2026-08-01']);
    expect(computeDailyCompletionStreak(done, '2026-08-03')).toBe(2);
  });

  it('breaks on a gap day', () => {
    const done = new Set(['2026-08-03', '2026-08-01']);
    expect(computeDailyCompletionStreak(done, '2026-08-03')).toBe(1);
  });

  it('returns 0 when the last completion is 2+ days old', () => {
    const done = new Set(['2026-08-01']);
    expect(computeDailyCompletionStreak(done, '2026-08-03')).toBe(0);
  });

  it('crosses month boundaries', () => {
    const done = new Set(['2026-08-01', '2026-07-31', '2026-07-30']);
    expect(computeDailyCompletionStreak(done, '2026-08-01')).toBe(3);
  });
});

describe('daysSince', () => {
  it('is 0 on the same calendar day', () => {
    expect(daysSince(new Date('2026-08-03T01:00:00'), new Date('2026-08-03T23:00:00'))).toBe(0);
  });

  it('counts calendar days, not 24h periods', () => {
    expect(daysSince(new Date('2026-08-02T23:30:00'), new Date('2026-08-03T00:30:00'))).toBe(1);
  });

  it('floors future starts at 0', () => {
    expect(daysSince(new Date('2026-08-10T00:00:00'), new Date('2026-08-03T00:00:00'))).toBe(0);
  });

  it('counts long spans', () => {
    expect(daysSince(new Date('2026-01-01T12:00:00'), new Date('2026-08-03T12:00:00'))).toBe(214);
  });
});
