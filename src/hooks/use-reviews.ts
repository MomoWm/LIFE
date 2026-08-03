import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { weekStartIso } from '@/lib/reviews/cycle';
import { supabase } from '@/lib/supabase/client';
import type { GoalRow, WeeklyReviewGoalCheckinRow, WeeklyReviewRow } from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';

export function useThisWeeksReview() {
  const userId = useUserId();
  const weekStart = weekStartIso(todayIso());

  return useQuery({
    queryKey: queryKeys.weeklyReview(userId, weekStart),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*, weekly_review_goal_checkins(*)')
        .eq('user_id', userId)
        .eq('week_start_date', weekStart)
        .maybeSingle();
      if (error) throw error;
      const raw = data as unknown as
        | (WeeklyReviewRow & { weekly_review_goal_checkins: WeeklyReviewGoalCheckinRow[] })
        | null;
      return raw ? { ...raw, checkins: raw.weekly_review_goal_checkins } : null;
    },
    enabled: !!userId,
  });
}

export type GoalCheckinInput = {
  goalId: string;
  rating: number | null;
  progressNote: string;
};

export function useSaveWeeklyReview() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const weekStart = weekStartIso(todayIso());

  return useMutation({
    mutationFn: async (input: { reflection: string; checkins: GoalCheckinInput[] }) => {
      const { data: review, error } = await supabase
        .from('weekly_reviews')
        .upsert(
          {
            user_id: userId,
            week_start_date: weekStart,
            reflection: input.reflection.trim() || null,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,week_start_date' }
        )
        .select()
        .single();
      if (error) throw error;

      const { error: clearError } = await supabase
        .from('weekly_review_goal_checkins')
        .delete()
        .eq('weekly_review_id', review.id);
      if (clearError) throw clearError;

      if (input.checkins.length > 0) {
        const { error: insertError } = await supabase.from('weekly_review_goal_checkins').insert(
          input.checkins.map((checkin) => ({
            weekly_review_id: review.id,
            user_id: userId,
            goal_id: checkin.goalId,
            rating: checkin.rating,
            progress_note: checkin.progressNote.trim() || null,
          }))
        );
        if (insertError) throw insertError;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklyReview(userId, weekStart) });
    },
  });
}

/** Archives the active goals and records the quarter; goal slots open for the next cycle. */
export function useCompleteQuarter() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { reflection: string; activeGoals: GoalRow[] }) => {
      const anchor = input.activeGoals[0];
      if (!anchor) throw new Error('No active goal cycle to complete');

      const { error: reviewError } = await supabase.from('quarterly_reviews').insert({
        user_id: userId,
        cycle_start_date: anchor.cycle_start_date,
        cycle_end_date: anchor.cycle_end_date,
        reflection: input.reflection.trim() || null,
        completed_at: new Date().toISOString(),
      });
      if (reviewError) throw reviewError;

      const { error: archiveError } = await supabase
        .from('goals')
        .update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('status', 'active');
      if (archiveError) throw archiveError;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) });
    },
  });
}
