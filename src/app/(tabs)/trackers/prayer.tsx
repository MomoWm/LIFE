import { format } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatCard } from '@/components/ui/stat-card';
import { Spacing } from '@/constants/theme';
import {
  PRAYER_LABELS,
  PRAYER_NAMES,
  computePrayerTimes,
  nextPrayer,
} from '@/lib/prayerTimes/adhanClient';
import type { PrayerName, PrayerStatus } from '@/lib/supabase/types';
import {
  useLogQadaMakeup,
  usePrayerStreak,
  usePrayerToday,
  useQadaBalance,
  useSetPrayerStatus,
} from '@/hooks/use-prayer';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

export default function PrayerScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: logs } = usePrayerToday();
  const { data: streak } = usePrayerStreak();
  const { data: qadaBalance } = useQadaBalance();
  const setStatus = useSetPrayerStatus();
  const logMakeup = useLogQadaMakeup();
  const updateProfile = useUpdateProfile();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasLocation = profile?.latitude != null && profile?.longitude != null;
  const times = hasLocation
    ? computePrayerTimes(
        new Date(),
        profile!.latitude!,
        profile!.longitude!,
        profile!.prayer_calc_method,
        profile!.prayer_madhab
      )
    : null;
  const upcoming = times ? nextPrayer(times, new Date()) : null;

  const statusFor = (prayer: PrayerName): PrayerStatus | null =>
    logs?.find((log) => log.prayer === prayer)?.status ?? null;

  const handleUseLocation = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied — enable it in iOS Settings to compute prayer times.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let label: string | null = null;
      try {
        const [place] = await Location.reverseGeocodeAsync(position.coords);
        label = place ? [place.city, place.region].filter(Boolean).join(', ') : null;
      } catch {
        // reverse geocode is best-effort; coordinates alone are enough
      }
      updateProfile.mutate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location_label: label,
      });
    } catch {
      setLocationError('Could not get your location. Try again.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Prayer' }} />
      <Screen>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.statRow}>
          <StatCard
            label="Streak"
            value={String(streak ?? 0)}
            unit="days"
            symbol="flame.fill"
            symbolColor={theme.warning}
          />
          <StatCard
            label="Qada owed"
            value={String(qadaBalance ?? 0)}
            symbol="arrow.counterclockwise"
            symbolColor={theme.tint}
            footer={
              (qadaBalance ?? 0) > 0 ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    logMakeup.mutate('fajr');
                  }}
                  style={({ pressed }) => [styles.makeupButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={{ color: theme.tint }}>
                    +1 made up
                  </ThemedText>
                </Pressable>
              ) : null
            }
          />
        </Animated.View>

        {!hasLocation ? (
          <Animated.View entering={FadeInDown.duration(300).delay(60)}>
            <Card style={styles.locationCard}>
              <Icon name="location.circle.fill" size={28} tintColor={theme.tint} />
              <ThemedText type="smallBold">Set your location</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.locationText}>
                Prayer times are computed on-device from your coordinates — nothing is sent anywhere.
              </ThemedText>
              <Button
                title={locating ? 'Locating…' : 'Use my location'}
                onPress={handleUseLocation}
                disabled={locating}
              />
              {locationError ? (
                <ThemedText type="small" themeColor="danger">
                  {locationError}
                </ThemedText>
              ) : null}
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(300).delay(60)}>
            <Card style={styles.timesCard}>
              <View style={styles.timesHeader}>
                <ThemedText type="smallBold">Today</ThemedText>
                {profile?.location_label ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {profile.location_label}
                  </ThemedText>
                ) : null}
              </View>
              {PRAYER_NAMES.map((prayer) => (
                <PrayerRow
                  key={prayer}
                  prayer={prayer}
                  time={times ? format(times[prayer], 'h:mm a') : '—'}
                  isNext={prayer === upcoming}
                  status={statusFor(prayer)}
                  onSetStatus={(status) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStatus.mutate({
                      prayer,
                      status: statusFor(prayer) === status ? null : status,
                    });
                  }}
                />
              ))}
            </Card>
          </Animated.View>
        )}
      </Screen>
    </>
  );
}

function PrayerRow({
  prayer,
  time,
  isNext,
  status,
  onSetStatus,
}: {
  prayer: PrayerName;
  time: string;
  isNext: boolean;
  status: PrayerStatus | null;
  onSetStatus: (status: PrayerStatus) => void;
}) {
  const theme = useTheme();

  const statusButton = (
    target: PrayerStatus,
    symbol: IconName,
    color: string
  ) => {
    const selected = status === target;
    return (
      <Pressable
        onPress={() => onSetStatus(target)}
        hitSlop={6}
        style={[
          styles.statusButton,
          { backgroundColor: selected ? color : theme.backgroundSelected },
        ]}>
        <Icon name={symbol} size={16} tintColor={selected ? '#fff' : theme.textSecondary} />
      </Pressable>
    );
  };

  return (
    <View style={styles.prayerRow}>
      <View style={styles.prayerInfo}>
        <View style={styles.prayerNameRow}>
          <ThemedText type="smallBold">{PRAYER_LABELS[prayer]}</ThemedText>
          {isNext ? (
            <View style={[styles.nextBadge, { backgroundColor: theme.tint }]}>
              <ThemedText style={styles.nextBadgeText}>NEXT</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {time}
        </ThemedText>
      </View>
      {statusButton('on_time', 'checkmark', theme.success)}
      {statusButton('late', 'clock', theme.warning)}
      {statusButton('missed', 'xmark', theme.danger)}
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  makeupButton: {
    marginTop: Spacing.one,
  },
  locationCard: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  locationText: {
    marginBottom: Spacing.one,
  },
  timesCard: {
    gap: Spacing.two,
  },
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
  },
  prayerInfo: {
    flex: 1,
    gap: 1,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nextBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  nextBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
