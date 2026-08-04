import { format, parseISO } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeatStrip } from '@/components/ui/heat-strip';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { Section, SectionDivider } from '@/components/ui/section';
import { Stat } from '@/components/ui/stat';
import { Domain, Spacing } from '@/constants/theme';
import {
  PRAYER_LABELS,
  PRAYER_NAMES,
  computePrayerTimes,
  nextPrayer,
} from '@/lib/prayerTimes/adhanClient';
import type { PrayerName, PrayerStatus } from '@/lib/supabase/types';
import {
  useLogQadaMakeup,
  usePrayerRange,
  usePrayerStreak,
  usePrayerToday,
  useQadaBalance,
  useSetPrayerStatus,
} from '@/hooks/use-prayer';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

export default function PrayerScreen() {
  const { data: profile } = useProfile();
  const { data: logs } = usePrayerToday();
  const { data: streak } = usePrayerStreak();
  const { data: qadaBalance } = useQadaBalance();
  const { data: week } = usePrayerRange(7);
  const setStatus = useSetPrayerStatus();
  const logMakeup = useLogQadaMakeup();
  const updateProfile = useUpdateProfile();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const now = new Date();
  const hasLocation = profile?.latitude != null && profile?.longitude != null;
  const times = hasLocation
    ? computePrayerTimes(
        now,
        profile!.latitude!,
        profile!.longitude!,
        profile!.prayer_calc_method,
        profile!.prayer_madhab
      )
    : null;
  const upcoming = times ? nextPrayer(times, now) : null;

  // Always seven cells. Falling back to an empty array made the strip render
  // nothing at all before data loaded — a heading over blank space, which is
  // what an unfinished screen looks like. Outlined cells say "no data yet".
  const weekCells =
    week ?? Array.from({ length: 7 }, (_, i) => ({ date: `placeholder-${i}`, prayed: null }));

  const statusFor = (prayer: PrayerName): PrayerStatus | null =>
    logs?.find((log) => log.prayer === prayer)?.status ?? null;
  const prayedCount = PRAYER_NAMES.filter((p) => {
    const s = statusFor(p);
    return s === 'on_time' || s === 'late';
  }).length;

  const handleUseLocation = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(
          'Location permission denied — enable it in Settings to compute prayer times.'
        );
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
        {!hasLocation ? (
          <Card raised style={styles.locationCard}>
            <Icon name="location.circle.fill" size={26} tintColor={Domain.prayer} />
            <ThemedText type="subtitle">Set your location</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Prayer times are computed on-device from your coordinates — nothing is sent
              anywhere.
            </ThemedText>
            <Button
              title="Use my location"
              onPress={handleUseLocation}
              loading={locating}
              disabled={locating}
            />
            {locationError ? (
              <ThemedText type="small" themeColor="danger">
                {locationError}
              </ThemedText>
            ) : null}
          </Card>
        ) : (
          <Card raised style={styles.hero}>
            <View style={styles.heroTop}>
              <ProgressRing
                progress={prayedCount / 5}
                size={92}
                strokeWidth={7}
                color={Domain.prayer}>
                <ThemedText type="metricSmall">
                  {prayedCount}
                  <ThemedText type="small" themeColor="textTertiary">
                    /5
                  </ThemedText>
                </ThemedText>
              </ProgressRing>
              <View style={styles.heroCopy}>
                <ThemedText type="label" themeColor="textTertiary">
                  {upcoming ? 'Next prayer' : 'Today complete'}
                </ThemedText>
                <ThemedText type="subtitle">
                  {upcoming ? PRAYER_LABELS[upcoming] : 'All times passed'}
                </ThemedText>
                {upcoming && times ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {format(times[upcoming], 'h:mm a')}
                    {profile?.location_label ? ` · ${profile.location_label}` : ''}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <View style={styles.statRow}>
              <Stat value={String(streak ?? 0)} label="Day streak" color={Domain.prayer} />
              <Stat
                value={String(qadaBalance ?? 0)}
                label="Qada owed"
                footer={
                  (qadaBalance ?? 0) > 0 ? (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        logMakeup.mutate('fajr');
                      }}
                      hitSlop={6}
                      style={styles.makeup}>
                      <ThemedText type="label" style={{ color: Domain.prayer }}>
                        + Log make-up
                      </ThemedText>
                    </Pressable>
                  ) : null
                }
              />
            </View>
          </Card>
        )}

        {hasLocation ? (
          <Section title="Today" contentStyle={styles.rows}>
            {PRAYER_NAMES.map((prayer, i) => (
              <View key={prayer}>
                {i > 0 ? <SectionDivider /> : null}
                <PrayerRow
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
              </View>
            ))}
          </Section>
        ) : null}

        <Section
          title="Last 7 days"
          trailing={
            <ThemedText type="label" themeColor="textSecondary">
              {weekCells.reduce((sum, d) => sum + (d.prayed ?? 0), 0)}/35
            </ThemedText>
          }>
          <HeatStrip
            data={weekCells.map((d) => ({ value: d.prayed == null ? null : d.prayed / 5 }))}
            color={Domain.prayer}
            dayLabels={week ? week.map((d) => format(parseISO(d.date), 'EEEEE')) : undefined}
            summary={`${weekCells.filter((d) => d.prayed === 5).length} complete days in the last 7`}
          />
        </Section>
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

  const statusButton = (target: PrayerStatus, symbol: IconName, color: string, a11y: string) => {
    const selected = status === target;
    return (
      <Pressable
        onPress={() => onSetStatus(target)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${PRAYER_LABELS[prayer]} ${a11y}`}
        accessibilityState={{ selected }}
        style={[
          styles.statusButton,
          { backgroundColor: selected ? color : theme.backgroundElement },
        ]}>
        <Icon
          name={symbol}
          size={15}
          tintColor={selected ? theme.background : theme.textTertiary}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.prayerRow}>
      <View style={styles.prayerInfo}>
        <View style={styles.prayerNameRow}>
          <ThemedText type="smallBold">{PRAYER_LABELS[prayer]}</ThemedText>
          {isNext ? (
            <ThemedText type="label" style={{ color: Domain.prayer }}>
              Next
            </ThemedText>
          ) : null}
        </View>
        <ThemedText type="small" themeColor="textTertiary">
          {time}
        </ThemedText>
      </View>
      {statusButton('on_time', 'checkmark', theme.success, 'on time')}
      {statusButton('late', 'clock', theme.warning, 'late')}
      {statusButton('missed', 'xmark', theme.danger, 'missed')}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.four,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  makeup: {
    marginTop: Spacing.one,
  },
  locationCard: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  rows: {
    gap: 0,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 56,
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
  statusButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
