import { computeFunnel, formatRate } from './funnel';

describe('computeFunnel', () => {
  it('computes all stage rates', () => {
    const rates = computeFunnel({ doors: 100, interactions: 20, pitches: 8, appointments: 2 });
    expect(rates.interactionRate).toBeCloseTo(0.2);
    expect(rates.pitchRate).toBeCloseTo(0.4);
    expect(rates.appointmentRate).toBeCloseTo(0.25);
    expect(rates.overallRate).toBeCloseTo(0.02);
  });

  it('guards every divide-by-zero with null', () => {
    expect(computeFunnel({ doors: 0, interactions: 0, pitches: 0, appointments: 0 })).toEqual({
      interactionRate: null,
      pitchRate: null,
      appointmentRate: null,
      overallRate: null,
    });
  });

  it('handles a partial funnel (doors but nothing else)', () => {
    const rates = computeFunnel({ doors: 50, interactions: 0, pitches: 0, appointments: 0 });
    expect(rates.interactionRate).toBe(0);
    expect(rates.pitchRate).toBeNull();
    expect(rates.overallRate).toBe(0);
  });
});

describe('formatRate', () => {
  it('renders null as a dash', () => {
    expect(formatRate(null)).toBe('—');
  });
  it('rounds to whole percent', () => {
    expect(formatRate(0.256)).toBe('26%');
  });
});
