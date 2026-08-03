export type ScoreComponent = {
  key: string;
  /** 0-1 completion for this tracker today. */
  score: number;
  weight: number;
  /** False when the tracker doesn't apply today (e.g. workout rest day). */
  applicable: boolean;
};

/**
 * Weighted average over applicable components only, so a rest day or an
 * unconfigured tracker never drags the score down. Returns 0-1.
 */
export function computeTodayScore(components: ScoreComponent[]): number {
  const applicable = components.filter((c) => c.applicable && c.weight > 0);
  if (applicable.length === 0) return 0;
  const totalWeight = applicable.reduce((sum, c) => sum + c.weight, 0);
  const weighted = applicable.reduce((sum, c) => sum + Math.max(0, Math.min(1, c.score)) * c.weight, 0);
  return weighted / totalWeight;
}
