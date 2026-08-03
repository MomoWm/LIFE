import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { computeDailyCompletionStreak } from '@/lib/streaks/streaks';
import { supabase } from '@/lib/supabase/client';
import type { PrayerLogRow, PrayerName, PrayerStatus } from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';

export function usePrayerToday() {
  const userId = useUserId();
  const date = todayIso();

  return useQuery({
    queryKey: queryKeys.prayerToday(userId, date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_logs')
        .select()
        .eq('user_id', userId)
        .eq('date', date);
      if (error) throw error;
      return data as PrayerLogRow[];
    },
    enabled: !!userId,
  });
}

export function useSetPrayerStatus() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const date = todayIso();
  const key = queryKeys.prayerToday(userId, date);

  return useMutation({
    mutationFn: async (input: { prayer: PrayerName; status: PrayerStatus | null }) => {
      if (input.status === null) {
        const { error } = await supabase
          .from('prayer_logs')
          .delete()
          .eq('user_id', userId)
          .eq('date', date)
          .eq('prayer', input.prayer);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('prayer_logs').upsert(
        {
          user_id: userId,
          date,
          prayer: input.prayer,
          status: input.status,
          prayed_at: input.status === 'on_time' || input.status === 'late' ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,date,prayer' }
      );
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PrayerLogRow[]>(key);
      if (previous) {
        const rest = previous.filter((log) => log.prayer !== input.prayer);
        const next: PrayerLogRow[] =
          input.status === null
            ? rest
            : [
                ...rest,
                {
                  id: `optimistic-${input.prayer}`,
                  user_id: userId,
                  date,
                  prayer: input.prayer,
                  status: input.status,
                  prayed_at: null,
                  created_at: new Date().toISOString(),
                },
              ];
        queryClient.setQueryData(key, next);
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: queryKeys.prayerHistory(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.qada(userId) });
    },
  });
}

const STREAK_LOOKBACK_DAYS = 120;

/** Consecutive days with all 5 prayers logged as prayed (on time or late). */
export function usePrayerStreak() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.prayerHistory(userId),
    queryFn: async () => {
      const today = todayIso();
      const from = format(addDays(parseISO(today), -STREAK_LOOKBACK_DAYS), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('prayer_logs')
        .select('date, prayer, status')
        .eq('user_id', userId)
        .gte('date', from)
        .in('status', ['on_time', 'late']);
      if (error) throw error;

      const prayedByDate = new Map<string, Set<string>>();
      for (const row of data as Pick<PrayerLogRow, 'date' | 'prayer' | 'status'>[]) {
        if (!prayedByDate.has(row.date)) prayedByDate.set(row.date, new Set());
        prayedByDate.get(row.date)!.add(row.prayer);
      }

      const completeDates = new Set<string>();
      for (const [date, prayers] of prayedByDate) {
        if (prayers.size === 5) completeDates.add(date);
      }

      return computeDailyCompletionStreak(completeDates, today);
    },
    enabled: !!userId,
  });
}

export function useQadaBalance() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.qada(userId),
    queryFn: async () => {
      const [missedRes, makeupsRes] = await Promise.all([
        supabase
          .from('prayer_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'missed'),
        supabase
          .from('qada_makeups')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);
      if (missedRes.error) throw missedRes.error;
      if (makeupsRes.error) throw makeupsRes.error;
      return Math.max(0, (missedRes.count ?? 0) - (makeupsRes.count ?? 0));
    },
    enabled: !!userId,
  });
}

export function useLogQadaMakeup() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prayer: PrayerName) => {
      const { error } = await supabase.from('qada_makeups').insert({ user_id: userId, prayer });
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.qada(userId) });
    },
  });
}
