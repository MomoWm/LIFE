import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { computeRetentionStats } from '@/lib/retention/retention';
import { supabase } from '@/lib/supabase/client';
import type { RetentionEventRow } from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';

export function useRetention() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.retention(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retention_events')
        .select()
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const events = data as RetentionEventRow[];
      const resets = events
        .filter((e) => e.event_type === 'reset')
        .map((e) => new Date(e.occurred_at));
      return { events, stats: computeRetentionStats(resets, new Date()) };
    },
    enabled: !!userId,
  });
}

export function useLogRetentionEvent() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { eventType: 'reset' | 'note'; note?: string }) => {
      const { error } = await supabase.from('retention_events').insert({
        user_id: userId,
        event_type: input.eventType,
        note: input.note?.trim() || null,
      });
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retention(userId) });
    },
  });
}
