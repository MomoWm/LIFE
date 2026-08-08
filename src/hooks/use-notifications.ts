import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { table } from '@/lib/db/local-table';
import { ensureNotificationPermissions, syncNotifications } from '@/lib/notifications/scheduler';
import { queryKeys } from '@/lib/query/keys';
import type { NotificationPreferencesRow } from '@/lib/db/types';
import { useUserId } from '@/hooks/use-five45';
import { useProfile } from '@/hooks/use-profile';

const notificationPrefs = table<NotificationPreferencesRow>('notification_preferences');

const DEFAULTS: Omit<NotificationPreferencesRow, 'id' | 'updated_at'> = {
  prayer_enabled: true,
  five45_morning_enabled: true,
  five45_morning_time: '06:00',
  work_reminders_enabled: true,
  weekly_review_enabled: true,
  quarterly_review_enabled: true,
};

async function loadOrCreatePrefs(): Promise<NotificationPreferencesRow> {
  const existing = await notificationPrefs.select();
  if (existing[0]) return existing[0];
  return notificationPrefs.insert(DEFAULTS);
}

export function useNotificationPrefs() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.notificationPrefs(userId),
    queryFn: loadOrCreatePrefs,
  });
}

export function useUpdateNotificationPrefs() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<NotificationPreferencesRow>) => {
      const current = await loadOrCreatePrefs();
      await notificationPrefs.update(current.id, patch);
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
