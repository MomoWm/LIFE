import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { table } from '@/lib/db/local-table';
import { queryKeys } from '@/lib/query/keys';
import { computeRetentionStats } from '@/lib/retention/retention';
import type { RetentionEventRow } from '@/lib/db/types';
import { useUserId } from '@/hooks/use-five45';

const retentionEvents = table<RetentionEventRow>('retention_events');

export function useRetention() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.retention(userId),
    queryFn: async () => {
      const events = (await retentionEvents.select())
        .slice()
        .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
        .slice(0, 200);
      const resets = events
        .filter((e) => e.event_type === 'reset')
        .map((e) => new Date(e.occurred_at));
      return { events, stats: computeRetentionStats(resets, new Date()) };
    },
  });
}

export function useLogRetentionEvent() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { eventType: 'reset' | 'note'; note?: string }) => {
      await retentionEvents.insert({
        event_type: input.eventType,
        occurred_at: new Date().toISOString(),
        note: input.note?.trim() || null,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retention(userId) });
    },
  });
}
