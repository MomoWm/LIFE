import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { resolveSleepTimestamps } from '@/lib/sleep/sleep';
import { supabase } from '@/lib/supabase/client';
import type { SleepLogRow } from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';

const HISTORY_DAYS = 14;

export function useSleepLogs() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.sleep(userId),
    queryFn: async () => {
      const from = format(addDays(parseISO(todayIso()), -HISTORY_DAYS), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('sleep_logs')
        .select()
        .eq('user_id', userId)
        .gte('date', from)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as SleepLogRow[];
    },
    enabled: !!userId,
  });
}

export function useLogSleep() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      bedTime: { hours: number; minutes: number };
      wakeTime: { hours: number; minutes: number };
      quality?: number;
    }) => {
      const date = todayIso();
      const { bedAt, wakeAt } = resolveSleepTimestamps(date, input.bedTime, input.wakeTime);
      const { error } = await supabase.from('sleep_logs').upsert(
        {
          user_id: userId,
          date,
          bed_time: bedAt.toISOString(),
          wake_time: wakeAt.toISOString(),
          quality_rating: input.quality ?? null,
        },
        { onConflict: 'user_id,date' }
      );
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sleep(userId) });
    },
  });
}
