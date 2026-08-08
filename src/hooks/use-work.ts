import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { table } from '@/lib/db/local-table';
import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import type {
  WorkBreakRow,
  WorkEventRow,
  WorkEventType,
  WorkSessionRow,
  WorkTargetsRow,
} from '@/lib/db/types';
import { useUserId } from '@/hooks/use-five45';

export type WorkToday = {
  session: (WorkSessionRow & { breaks: WorkBreakRow[] }) | null;
  counts: Record<WorkEventType, number>;
};

const EMPTY_COUNTS: Record<WorkEventType, number> = {
  door: 0,
  interaction: 0,
  pitch: 0,
  appointment: 0,
};

const workSessions = table<WorkSessionRow>('work_sessions');
const workBreaks = table<WorkBreakRow>('work_breaks');
const workEvents = table<WorkEventRow>('work_events');
const workTargets = table<WorkTargetsRow>('work_targets');

export function useWorkToday() {
  const userId = useUserId();
  const date = todayIso();

  return useQuery({
    queryKey: queryKeys.workToday(userId, date),
    queryFn: async (): Promise<WorkToday> => {
      const [sessions, breaks, events] = await Promise.all([
        workSessions.select((s) => s.date === date),
        workBreaks.select(),
        workEvents.select((e) => e.date === date),
      ]);
      const session = sessions.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

      const counts = { ...EMPTY_COUNTS };
      for (const row of events) counts[row.event_type] += 1;

      return {
        session: session
          ? { ...session, breaks: breaks.filter((b) => b.work_session_id === session.id) }
          : null,
        counts,
      };
    },
    refetchInterval: 60_000,
  });
}

function useInvalidateWorkToday() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.workToday(userId, todayIso()) });
}

export function useStartWork() {
  const invalidate = useInvalidateWorkToday();

  return useMutation({
    mutationFn: async () => {
      await workSessions.insert({
        date: todayIso(),
        started_at: new Date().toISOString(),
        ended_at: null,
        status: 'active',
      });
    },
    onSettled: invalidate,
  });
}

export function useToggleBreak() {
  const invalidate = useInvalidateWorkToday();

  return useMutation({
    mutationFn: async (session: WorkToday['session']) => {
      if (!session) return;
      if (session.status === 'active') {
        await workBreaks.insert({
          work_session_id: session.id,
          started_at: new Date().toISOString(),
          ended_at: null,
        });
        await workSessions.update(session.id, { status: 'on_break' });
      } else if (session.status === 'on_break') {
        const openBreak = session.breaks.find((b) => b.ended_at === null);
        if (openBreak) {
          await workBreaks.update(openBreak.id, { ended_at: new Date().toISOString() });
        }
        await workSessions.update(session.id, { status: 'active' });
      }
    },
    onSettled: invalidate,
  });
}

export function useEndWork() {
  const invalidate = useInvalidateWorkToday();

  return useMutation({
    mutationFn: async (session: WorkToday['session']) => {
      if (!session) return;
      const openBreak = session.breaks.find((b) => b.ended_at === null);
      if (openBreak) {
        await workBreaks.update(openBreak.id, { ended_at: new Date().toISOString() });
      }
      await workSessions.update(session.id, { status: 'ended', ended_at: new Date().toISOString() });
    },
    onSettled: invalidate,
  });
}

export function useLogWorkEvent() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const date = todayIso();
  const key = queryKeys.workToday(userId, date);

  return useMutation({
    mutationFn: async (input: { eventType: WorkEventType; sessionId: string | null }) => {
      await workEvents.insert({
        work_session_id: input.sessionId,
        date,
        event_type: input.eventType,
        occurred_at: new Date().toISOString(),
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkToday>(key);
      if (previous) {
        queryClient.setQueryData<WorkToday>(key, {
          ...previous,
          counts: {
            ...previous.counts,
            [input.eventType]: previous.counts[input.eventType] + 1,
          },
        });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useWorkTargets() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.workTargets(userId),
    queryFn: async () => (await workTargets.select())[0] ?? null,
  });
}

/** Aggregated event counts over the trailing `days` window, including today. */
export function useWorkRange(days: number) {
  const userId = useUserId();
  const to = todayIso();
  const from = format(addDays(parseISO(to), -(days - 1)), 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.workRange(userId, from, to),
    queryFn: async () => {
      const rows = await workEvents.select((e) => e.date >= from && e.date <= to);

      const counts = { ...EMPTY_COUNTS };
      const activeDays = new Set<string>();
      for (const row of rows) {
        counts[row.event_type] += 1;
        activeDays.add(row.date);
      }
      return { counts, activeDayCount: activeDays.size };
    },
  });
}

/** Minutes actually worked: wall time minus completed breaks (open break counts to now). */
export function workedMinutes(session: WorkToday['session'], now: Date): number {
  if (!session) return 0;
  const start = new Date(session.started_at).getTime();
  const end = session.ended_at ? new Date(session.ended_at).getTime() : now.getTime();
  let breakMs = 0;
  for (const brk of session.breaks) {
    const bStart = new Date(brk.started_at).getTime();
    const bEnd = brk.ended_at ? new Date(brk.ended_at).getTime() : now.getTime();
    breakMs += Math.max(0, bEnd - bStart);
  }
  return Math.max(0, Math.round((end - start - breakMs) / 60000));
}
