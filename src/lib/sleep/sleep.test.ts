import { formatDuration, resolveSleepTimestamps, sleepDurationMinutes } from './sleep';

describe('resolveSleepTimestamps', () => {
  it('puts an evening bedtime on the previous day', () => {
    const { bedAt, wakeAt } = resolveSleepTimestamps(
      '2026-08-03',
      { hours: 22, minutes: 30 },
      { hours: 6, minutes: 0 }
    );
    expect(bedAt.getDate()).toBe(2);
    expect(bedAt.getHours()).toBe(22);
    expect(wakeAt.getDate()).toBe(3);
    expect(sleepDurationMinutes(bedAt, wakeAt)).toBe(450); // 7.5h
  });

  it('keeps a past-midnight bedtime on the wake day', () => {
    const { bedAt, wakeAt } = resolveSleepTimestamps(
      '2026-08-03',
      { hours: 1, minutes: 15 },
      { hours: 8, minutes: 45 }
    );
    expect(bedAt.getDate()).toBe(3);
    expect(sleepDurationMinutes(bedAt, wakeAt)).toBe(450);
  });

  it('handles the 15:00 boundary as previous-day', () => {
    const { bedAt } = resolveSleepTimestamps(
      '2026-08-03',
      { hours: 15, minutes: 0 },
      { hours: 23, minutes: 0 }
    );
    expect(bedAt.getDate()).toBe(2);
  });

  it('crosses month boundaries', () => {
    const { bedAt } = resolveSleepTimestamps(
      '2026-08-01',
      { hours: 23, minutes: 0 },
      { hours: 7, minutes: 0 }
    );
    expect(bedAt.getMonth()).toBe(6); // July
    expect(bedAt.getDate()).toBe(31);
  });
});

describe('sleepDurationMinutes', () => {
  it('floors invalid ranges at 0', () => {
    expect(
      sleepDurationMinutes(new Date('2026-08-03T08:00:00'), new Date('2026-08-03T06:00:00'))
    ).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats whole hours without minutes', () => {
    expect(formatDuration(480)).toBe('8h');
  });
  it('formats mixed durations', () => {
    expect(formatDuration(450)).toBe('7h 30m');
  });
});
