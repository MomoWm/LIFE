import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { supabase } from '@/lib/supabase/client';
import type {
  WorkBreakRow,
  WorkEventRow,
  WorkEventType,
  WorkSessionRow,
  WorkTargetsRow,
} from '@/lib/supabase/types';
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

export function useWorkToday() {
  const userId = useUserId();
  const date = todayIso();

  return useQuery({
    queryKey: queryKeys.workToday(userId, date),
    queryFn: async (): Promise<WorkToday> => {
      const [sessionRes, eventsRes] = await Promise.all([
        supabase
          .from('work_sessions')
          .select('*, work_breaks(*)')
          .eq('user_id', userId)
          .eq('date', date)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('work_events').select('event_type').eq('user_id', userId).eq('date', date),
      ]);
      if (sessionRes.error) throw sessionRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const counts = { ...EMPTY_COUNTS };
      for (const row of eventsRes.data as Pick<WorkEventRow, 'event_type'>[]) {
        counts[row.event_type] += 1;
      }

      const raw = sessionRes.data as unknown as
        | (WorkSessionRow & { work_breaks: WorkBreakRow[] })
        | null;

      return {
        session: raw ? { ...raw, breaks: raw.work_breaks } : null,
        counts,
      };
    },
    enabled: !!userId,
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
  const userId = useUserId();
  const invalidate = useInvalidateWorkToday();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('work_sessions')
        .insert({ user_id: userId, date: todayIso(), status: 'active' });
      if (error) throw error;
    },
    onSettled: invalidate,
  });
}

export function useToggleBreak() {
  const userId = useUserId();
  const invalidate = useInvalidateWorkToday();

  return useMutation({
    mutationFn: async (session: WorkToday['session']) => {
      if (!session) return;
      if (session.status === 'active') {
        const [breakRes, sessionRes] = await Promise.all([
          supabase.from('work_breaks').insert({ work_session_id: session.id, user_id: userId }),
          supabase.from('work_sessions').update({ status: 'on_break' }).eq('id', session.id),
        ]);
        if (breakRes.error) throw breakRes.error;
        if (sessionRes.error) throw sessionRes.error;
      } else if (session.status === 'on_break') {
        const openBreak = session.breaks.find((b) => b.ended_at === null);
        if (openBreak) {
          const { error } = await supabase
            .from('work_breaks')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', openBreak.id);
          if (error) throw error;
        }
        const { error } = await supabase
          .from('work_sessions')
          .update({ status: 'active' })
          .eq('id', session.id);
        if (error) throw error;
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
        const { error } = await supabase
          .from('work_breaks')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', openBreak.id);
        if (error) throw error;
      }
      const { error } = await supabase
        .from('work_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', session.id);
      if (error) throw error;
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
      const { error } = await supabase.from('work_events').insert({
        user_id: userId,
        work_session_id: input.sessionId,
        date,
        event_type: input.eventType,
      });
      if (error) throw error;
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_targets')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data as WorkTargetsRow | null) ?? null;
    },
    enabled: !!userId,
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
      const { data, error } = await supabase
        .from('work_events')
        .select('event_type, date')
        .eq('user_id', userId)
        .gte('date', from)
        .lte('date', to);
      if (error) throw error;

      const counts = { ...EMPTY_COUNTS };
      const activeDays = new Set<string>();
      for (const row of data as Pick<WorkEventRow, 'event_type' | 'date'>[]) {
        counts[row.event_type] += 1;
        activeDays.add(row.date);
      }
      return { counts, activeDayCount: activeDays.size };
    },
    enabled: !!userId,
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
