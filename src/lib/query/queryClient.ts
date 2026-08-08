import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

import { safeStorage } from '@/lib/storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      // 'always' — every query here reads local device storage, not a
      // server. TanStack Query's default networkMode pauses queries and
      // mutations when the browser reports itself offline; that rule exists
      // for requests that need a network and is actively wrong for one that
      // doesn't. Reads and writes must succeed with the radio off, since the
      // radio was never involved.
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: safeStorage,
  key: 'life-query-cache',
});
