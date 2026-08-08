import * as Notifications from 'expo-notifications';
import { addDays } from 'date-fns';
import { Platform } from 'react-native';

import { PRAYER_LABELS, computePrayerTimes } from '@/lib/prayerTimes/adhanClient';
import type { NotificationPreferencesRow, ProfileRow } from '@/lib/db/types';

// Local scheduled notifications only exist on the native app; on web this
// module is a set of no-ops.
const isNative = Platform.OS !== 'web';

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!isNative) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour = 0, minute = 0] = time.split(':').map((part) => parseInt(part, 10));
  return { hour, minute };
}

/**
 * Rebuilds the full local-notification schedule from preferences. Called on
 * app foreground — prayer date-triggers only cover today + tomorrow, so
 * regular foregrounds keep the window rolling.
 */
export async function syncNotifications(
  prefs: NotificationPreferencesRow,
  profile: ProfileRow | null
): Promise<void> {
  if (!isNative) return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  if (
    prefs.prayer_enabled &&
    profile &&
    profile.latitude != null &&
    profile.longitude != null
  ) {
    for (const dayOffset of [0, 1]) {
      const day = addDays(now, dayOffset);
      const times = computePrayerTimes(
        day,
        profile.latitude,
        profile.longitude,
        profile.prayer_calc_method,
        profile.prayer_madhab
      );
      for (const [prayer, label] of Object.entries(PRAYER_LABELS)) {
        const at = times[prayer as keyof typeof times];
        if (at > now) {
          await Notifications.scheduleNotificationAsync({
            content: { title: `${label} time`, body: `It's time for ${label}.`, sound: 'default' },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
          });
        }
      }
    }
  }

  if (prefs.five45_morning_enabled) {
    const { hour, minute } = parseTime(prefs.five45_morning_time);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Morning 5',
        body: 'The second you wake up — knock out your five.',
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }

  if (prefs.weekly_review_enabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly review',
        body: 'Did your 4 goals move this week? Ten minutes, be honest.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
      },
    });
  }
}
