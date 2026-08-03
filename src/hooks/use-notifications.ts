import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { ensureNotificationPermissions, syncNotifications } from '@/lib/notifications/scheduler';
import { queryKeys } from '@/lib/query/keys';
import { supabase } from '@/lib/supabase/client';
import type { NotificationPreferencesRow } from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';
import { useProfile } from '@/hooks/use-profile';

export function useNotificationPrefs() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.notificationPrefs(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data as NotificationPreferencesRow | null) ?? null;
    },
    enabled: !!userId,
  });
}

export function useUpdateNotificationPrefs() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<NotificationPreferencesRow>) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update(patch)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationPrefs(userId) });
    },
  });
}

/**
 * Keeps the local notification schedule in sync with preferences whenever the
 * app comes to the foreground (prayer triggers only span today + tomorrow).
 */
export function useNotificationSync() {
  const { data: prefs } = useNotificationPrefs();
  const { data: profile } = useProfile();
  const syncing = useRef(false);

  useEffect(() => {
    if (!prefs) return;

    const sync = async () => {
      if (syncing.current) return;
      syncing.current = true;
      try {
        const granted = await ensureNotificationPermissions();
        if (granted) await syncNotifications(prefs, profile ?? null);
      } finally {
        syncing.current = false;
      }
    };

    sync();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => listener.remove();
  }, [prefs, profile]);
}
