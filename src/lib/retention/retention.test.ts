import { computeRetentionStats } from './retention';

const d = (iso: string) => new Date(`${iso}T12:00:00`);

describe('computeRetentionStats', () => {
  it('returns null current streak before tracking starts', () => {
    expect(computeRetentionStats([], d('2026-08-03'))).toEqual({
      currentStreakDays: null,
      bestStreakDays: 0,
      totalResets: 0,
    });
  });

  it('counts days since the only reset', () => {
    const stats = computeRetentionStats([d('2026-08-01')], d('2026-08-03'));
    expect(stats.currentStreakDays).toBe(2);
    expect(stats.bestStreakDays).toBe(2);
    expect(stats.totalResets).toBe(1);
  });

  it('is 0 on the day of a reset', () => {
    expect(computeRetentionStats([d('2026-08-03')], d('2026-08-03')).currentStreakDays).toBe(0);
  });

  it('finds the best run between historical resets', () => {
    const stats = computeRetentionStats(
      [d('2026-07-30'), d('2026-07-01'), d('2026-06-01')],
      d('2026-08-03')
    );
    expect(stats.currentStreakDays).toBe(4);
    expect(stats.bestStreakDays).toBe(30); // Jun 1 -> Jul 1
    expect(stats.totalResets).toBe(3);
  });

  it('treats the current run as best when it beats history', () => {
    const stats = computeRetentionStats([d('2026-07-01'), d('2026-06-25')], d('2026-08-03'));
    expect(stats.currentStreakDays).toBe(33);
    expect(stats.bestStreakDays).toBe(33);
  });

  it('accepts unsorted input', () => {
    const stats = computeRetentionStats([d('2026-06-01'), d('2026-07-30')], d('2026-08-03'));
    expect(stats.currentStreakDays).toBe(4);
    expect(stats.bestStreakDays).toBe(59);
  });
});
