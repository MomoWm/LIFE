import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

import { safeStorage } from '@/lib/storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // keep cache around for a day of offline reads
      retry: 1,
    },
    mutations: {
      // 'online' (the default, stated explicitly) pauses a mutation instead
      // of failing it when there's no connection — task completions, prayer
      // logs, workout sets, and work-event taps made offline queue in the
      // mutation cache rather than being lost. Paused mutations are persisted
      // alongside queries (see asyncStoragePersister below) and replayed via
      // queryClient.resumePausedMutations() in the root layout, both right
      // after a cold-start restore and on every reconnect.
      networkMode: 'online',
      retry: 3,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: safeStorage,
  key: 'life-query-cache',
});
