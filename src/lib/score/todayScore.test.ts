import { todayPhase } from './todayPhase';
import { computeTodayScore } from './todayScore';

describe('computeTodayScore', () => {
  it('is 1 when everything applicable is perfect', () => {
    expect(
      computeTodayScore([
        { key: 'five45', score: 1, weight: 30, applicable: true },
        { key: 'prayer', score: 1, weight: 25, applicable: true },
        { key: 'workout', score: 1, weight: 15, applicable: true },
      ])
    ).toBe(1);
  });

  it('excludes non-applicable components (rest day)', () => {
    expect(
      computeTodayScore([
        { key: 'five45', score: 1, weight: 30, applicable: true },
        { key: 'workout', score: 0, weight: 15, applicable: false },
      ])
    ).toBe(1);
  });

  it('weights components proportionally', () => {
    const score = computeTodayScore([
      { key: 'a', score: 1, weight: 75, applicable: true },
      { key: 'b', score: 0, weight: 25, applicable: true },
    ]);
    expect(score).toBeCloseTo(0.75);
  });

  it('clamps out-of-range component scores', () => {
    expect(
      computeTodayScore([
        { key: 'a', score: 4, weight: 50, applicable: true },
        { key: 'b', score: -1, weight: 50, applicable: true },
      ])
    ).toBe(0.5);
  });

  it('returns 0 when nothing applies yet', () => {
    expect(computeTodayScore([])).toBe(0);
    expect(computeTodayScore([{ key: 'a', score: 1, weight: 10, applicable: false }])).toBe(0);
  });
});

describe('todayPhase', () => {
  it('maps hours to phases with correct boundaries', () => {
    expect(todayPhase(new Date('2026-08-03T05:00:00'))).toBe('morning');
    expect(todayPhase(new Date('2026-08-03T11:59:00'))).toBe('morning');
    expect(todayPhase(new Date('2026-08-03T12:00:00'))).toBe('daytime');
    expect(todayPhase(new Date('2026-08-03T16:59:00'))).toBe('daytime');
    expect(todayPhase(new Date('2026-08-03T17:00:00'))).toBe('evening');
    expect(todayPhase(new Date('2026-08-03T23:30:00'))).toBe('evening');
  });
});
