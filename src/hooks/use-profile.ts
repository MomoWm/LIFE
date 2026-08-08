import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { table } from '@/lib/db/local-table';
import { queryKeys } from '@/lib/query/keys';
import type { ProfileRow } from '@/lib/db/types';
import { useUserId } from '@/hooks/use-five45';

const profiles = table<ProfileRow>('profiles');

/** One local install, one profile row — created with sane defaults on first read. */
const DEFAULTS: Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'> = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  latitude: null,
  longitude: null,
  location_label: null,
  prayer_calc_method: 'MuslimWorldLeague',
  prayer_madhab: 'shafi',
};

async function loadOrCreateProfile(): Promise<ProfileRow> {
  const existing = await profiles.select();
  if (existing[0]) return existing[0];
  return profiles.insert(DEFAULTS);
}

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: loadOrCreateProfile,
  });
}

export function useUpdateProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<ProfileRow>) => {
      const current = await loadOrCreateProfile();
      await profiles.update(current.id, patch);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: ['prayer'] });
    },
  });
}
