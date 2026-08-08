import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { table } from '@/lib/db/local-table';
import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { computeDailyCompletionStreak } from '@/lib/streaks/streaks';
import type { PrayerLogRow, PrayerName, PrayerStatus, QadaMakeupRow } from '@/lib/db/types';
import { useUserId } from '@/hooks/use-five45';

const prayerLogs = table<PrayerLogRow>('prayer_logs');
const qadaMakeups = table<QadaMakeupRow>('qada_makeups');

export function usePrayerToday() {
  const userId = useUserId();
  const date = todayIso();

  return useQuery({
    queryKey: queryKeys.prayerToday(userId, date),
    queryFn: () => prayerLogs.select((log) => log.date === date),
  });
}

export function useSetPrayerStatus() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const date = todayIso();
  const key = queryKeys.prayerToday(userId, date);

  return useMutation({
    mutationFn: async (input: { prayer: PrayerName; status: PrayerStatus | null }) => {
      const isSlot = (log: PrayerLogRow) => log.date === date && log.prayer === input.prayer;
      if (input.status === null) {
        await prayerLogs.deleteWhere(isSlot);
        return;
      }
      await prayerLogs.upsert(isSlot, {
        date,
        prayer: input.prayer,
        status: input.status,
        prayed_at: input.status === 'on_time' || input.status === 'late' ? new Date().toISOString() : null,
      });
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
      const rows = await prayerLogs.select(
        (log) => log.date >= from && (log.status === 'on_time' || log.status === 'late')
      );

      const prayedByDate = new Map<string, Set<string>>();
      for (const row of rows) {
        if (!prayedByDate.has(row.date)) prayedByDate.set(row.date, new Set());
        prayedByDate.get(row.date)!.add(row.prayer);
      }

      const completeDates = new Set<string>();
      for (const [date, prayers] of prayedByDate) {
        if (prayers.size === 5) completeDates.add(date);
      }

      return computeDailyCompletionStreak(completeDates, today);
    },
  });
}

/**
 * Prayed-count per day over a trailing window, oldest first. Days with no
 * logs at all come back as null rather than 0 so the UI can distinguish
 * "nothing recorded" from "recorded none" — collapsing them would overstate
 * a bad week.
 */
export function usePrayerRange(days: number) {
  const userId = useUserId();
  const to = todayIso();
  const from = format(addDays(parseISO(to), -(days - 1)), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [...queryKeys.prayerHistory(userId), 'range', days] as const,
    queryFn: async () => {
      const rows = await prayerLogs.select((log) => log.date >= from && log.date <= to);

      const seen = new Map<string, number>();
      for (const row of rows) {
        if (!seen.has(row.date)) seen.set(row.date, 0);
        if (row.status === 'on_time' || row.status === 'late') {
          seen.set(row.date, seen.get(row.date)! + 1);
        }
      }

      return Array.from({ length: days }, (_, i) => {
        const date = format(addDays(parseISO(to), i - (days - 1)), 'yyyy-MM-dd');
        return { date, prayed: seen.has(date) ? seen.get(date)! : null };
      });
    },
  });
}

export function useQadaBalance() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.qada(userId),
    queryFn: async () => {
      const [missed, makeups] = await Promise.all([
        prayerLogs.select((log) => log.status === 'missed'),
        qadaMakeups.select(),
      ]);
      return Math.max(0, missed.length - makeups.length);
    },
  });
}

export function useLogQadaMakeup() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prayer: PrayerName) => {
      await qadaMakeups.insert({ prayer, made_up_at: new Date().toISOString(), source_prayer_log_id: null });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.qada(userId) });
    },
  });
}
