import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { supabase } from '@/lib/supabase/client';
import type { ProfileRow } from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select().eq('id', userId).single();
      if (error) throw error;
      return data as ProfileRow;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<ProfileRow>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: ['prayer'] });
    },
  });
}
