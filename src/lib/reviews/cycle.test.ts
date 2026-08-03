import { isQuarterEndDue, weekStartIso } from './cycle';

describe('weekStartIso', () => {
  it('returns today when today is Sunday', () => {
    expect(weekStartIso('2026-08-02')).toBe('2026-08-02');
  });

  it('returns the previous Sunday mid-week', () => {
    expect(weekStartIso('2026-08-05')).toBe('2026-08-02'); // Wednesday
    expect(weekStartIso('2026-08-08')).toBe('2026-08-02'); // Saturday
  });

  it('crosses month boundaries', () => {
    expect(weekStartIso('2026-08-01')).toBe('2026-07-26');
  });
});

describe('isQuarterEndDue', () => {
  it('is false well before the cycle ends', () => {
    expect(isQuarterEndDue('2026-11-01', '2026-08-03')).toBe(false);
  });

  it('turns true inside the 7-day window', () => {
    expect(isQuarterEndDue('2026-08-10', '2026-08-03')).toBe(true);
    expect(isQuarterEndDue('2026-08-11', '2026-08-03')).toBe(false);
  });

  it('stays true after the end date passes', () => {
    expect(isQuarterEndDue('2026-08-01', '2026-08-03')).toBe(true);
  });
});
