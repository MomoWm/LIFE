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
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: safeStorage,
  key: 'life-query-cache',
});
