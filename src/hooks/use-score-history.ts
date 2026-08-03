import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { SCORE_FORMULA_VERSION, type ScoreComponent } from '@/lib/score/todayScore';
import { supabase } from '@/lib/supabase/client';
import type { DailyScoreRow } from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';

/**
 * Persists today's already-computed score (see computeTodayScore) so the
 * Insights screen has real trend history instead of only ever seeing today.
 * Safe to call on every dashboard render — it's an upsert keyed on
 * (user_id, date), so re-saving the same day just overwrites it.
 */
export function useSaveTodayScore() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { score: number; components: ScoreComponent[] }) => {
      const { error } = await supabase.from('daily_scores').upsert(
        {
          user_id: userId,
          date: todayIso(),
          score: Math.round(input.score * 1000) / 1000,
          components: input.components,
          formula_version: SCORE_FORMULA_VERSION,
        },
        { onConflict: 'user_id,date' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreHistory', userId] });
    },
  });
}

/** Trailing `days` of saved scores, oldest first, missing days filled with null. */
export function useScoreHistory(days: number) {
  const userId = useUserId();
  const to = todayIso();
  const from = format(addDays(parseISO(to), -(days - 1)), 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.scoreHistory(userId, days),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_scores')
        .select('date, score')
        .eq('user_id', userId)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });
      if (error) throw error;

      const byDate = new Map((data as Pick<DailyScoreRow, 'date' | 'score'>[]).map((row) => [row.date, row.score]));
      return Array.from({ length: days }, (_, i) => {
        const date = format(addDays(parseISO(to), i - (days - 1)), 'yyyy-MM-dd');
        return { date, score: byDate.get(date) ?? null };
      });
    },
    enabled: !!userId,
  });
}
