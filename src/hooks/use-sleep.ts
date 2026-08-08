import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { table } from '@/lib/db/local-table';
import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { resolveSleepTimestamps } from '@/lib/sleep/sleep';
import type { SleepLogRow } from '@/lib/db/types';
import { useUserId } from '@/hooks/use-five45';

const HISTORY_DAYS = 14;
const sleepLogs = table<SleepLogRow>('sleep_logs');

export function useSleepLogs() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.sleep(userId),
    queryFn: async () => {
      const from = format(addDays(parseISO(todayIso()), -HISTORY_DAYS), 'yyyy-MM-dd');
      const rows = await sleepLogs.select((log) => log.date >= from);
      return rows.slice().sort((a, b) => b.date.localeCompare(a.date));
    },
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
      await sleepLogs.upsert((log) => log.date === date, {
        date,
        bed_time: bedAt.toISOString(),
        wake_time: wakeAt.toISOString(),
        quality_rating: input.quality ?? null,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sleep(userId) });
    },
  });
}
