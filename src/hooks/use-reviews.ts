import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { table } from '@/lib/db/local-table';
import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { weekStartIso } from '@/lib/reviews/cycle';
import type {
  GoalRow,
  QuarterlyReviewRow,
  WeeklyReviewGoalCheckinRow,
  WeeklyReviewRow,
} from '@/lib/db/types';
import { useUserId } from '@/hooks/use-five45';

const weeklyReviews = table<WeeklyReviewRow>('weekly_reviews');
const weeklyCheckins = table<WeeklyReviewGoalCheckinRow>('weekly_review_goal_checkins');
const quarterlyReviews = table<QuarterlyReviewRow>('quarterly_reviews');
const goalsTable = table<GoalRow>('goals');

export function useThisWeeksReview() {
  const userId = useUserId();
  const weekStart = weekStartIso(todayIso());

  return useQuery({
    queryKey: queryKeys.weeklyReview(userId, weekStart),
    queryFn: async () => {
      const review = (await weeklyReviews.select((r) => r.week_start_date === weekStart))[0];
      if (!review) return null;
      const checkins = await weeklyCheckins.select((c) => c.weekly_review_id === review.id);
      return { ...review, checkins };
    },
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
      const review = await weeklyReviews.upsert((r) => r.week_start_date === weekStart, {
        week_start_date: weekStart,
        reflection: input.reflection.trim() || null,
        completed_at: new Date().toISOString(),
      });

      await weeklyCheckins.deleteWhere((c) => c.weekly_review_id === review.id);
      for (const checkin of input.checkins) {
        await weeklyCheckins.insert({
          weekly_review_id: review.id,
          goal_id: checkin.goalId,
          rating: checkin.rating,
          progress_note: checkin.progressNote.trim() || null,
        });
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

      await quarterlyReviews.insert({
        cycle_start_date: anchor.cycle_start_date,
        cycle_end_date: anchor.cycle_end_date,
        reflection: input.reflection.trim() || null,
        completed_at: new Date().toISOString(),
      });

      await goalsTable.updateWhere((g) => g.status === 'active', { status: 'completed' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) });
    },
  });
}
