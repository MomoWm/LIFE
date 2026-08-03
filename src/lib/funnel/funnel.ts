export type FunnelCounts = {
  doors: number;
  interactions: number;
  pitches: number;
  appointments: number;
};

export type FunnelRates = {
  /** interactions / doors */
  interactionRate: number | null;
  /** pitches / interactions */
  pitchRate: number | null;
  /** appointments / pitches */
  appointmentRate: number | null;
  /** appointments / doors */
  overallRate: number | null;
};

function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export function computeFunnel(counts: FunnelCounts): FunnelRates {
  return {
    interactionRate: rate(counts.interactions, counts.doors),
    pitchRate: rate(counts.pitches, counts.interactions),
    appointmentRate: rate(counts.appointments, counts.pitches),
    overallRate: rate(counts.appointments, counts.doors),
  };
}

export function formatRate(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}
