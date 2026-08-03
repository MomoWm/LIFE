import { resolveDayType } from './dayType';

describe('resolveDayType', () => {
  // 2026-08-03 is a Monday; walk a full week from there.
  const cases: [string, string][] = [
    ['2026-08-02', 'sunday'],
    ['2026-08-03', 'standard'], // Monday
    ['2026-08-04', 'meeting'], // Tuesday
    ['2026-08-05', 'standard'], // Wednesday
    ['2026-08-06', 'standard'], // Thursday
    ['2026-08-07', 'meeting'], // Friday
    ['2026-08-08', 'saturday'],
  ];

  it.each(cases)('resolves %s to %s', (iso, expected) => {
    expect(resolveDayType(new Date(`${iso}T09:00:00`))).toBe(expected);
  });
});
