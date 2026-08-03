import { addDays, format, parseISO } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import { Stack } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BarChart } from '@/components/ui/bar-chart';
import { HeatStrip } from '@/components/ui/heat-strip';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Section } from '@/components/ui/section';
import { Stat } from '@/components/ui/stat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TimeField } from '@/components/ui/time-field';
import { Domain, Spacing } from '@/constants/theme';
import { todayIso } from '@/lib/dates';
import { formatDuration, sleepDurationMinutes } from '@/lib/sleep/sleep';
import { useLogSleep, useSleepLogs } from '@/hooks/use-sleep';
import { useTheme } from '@/hooks/use-theme';

export default function SleepScreen() {
  const theme = useTheme();
  const { data: logs } = useSleepLogs();
  const logSleep = useLogSleep();

  const todayLog = logs?.find((log) => log.date === todayIso());

  const [bedTime, setBedTime] = useState(() => {
    const d = new Date();
    d.setHours(22, 30, 0, 0);
    return d;
  });
  const [wakeTime, setWakeTime] = useState(() => {
    const d = new Date();
    d.setHours(6, 0, 0, 0);
    return d;
  });
  const [quality, setQuality] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const today = todayIso();
    const byDate = new Map((logs ?? []).map((log) => [log.date, log]));
    return Array.from({ length: 14 }, (_, i) => {
      const date = format(addDays(parseISO(today), i - 13), 'yyyy-MM-dd');
      const log = byDate.get(date);
      return {
        label: format(parseISO(date), 'MMM d'),
        value: log
          ? sleepDurationMinutes(new Date(log.bed_time), new Date(log.wake_time))
          : 0,
      };
    });
  }, [logs]);

  // Sleep quality is meaningless without a reference point, so everything is
  // expressed against a target rather than as a bare duration.
  const TARGET_MINUTES = 8 * 60;

  const durationsByDate = new Map(
    (logs ?? []).map((log) => [
      log.date,
      sleepDurationMinutes(new Date(log.bed_time), new Date(log.wake_time)),
    ])
  );

  const lastNightMinutes = todayLog
    ? sleepDurationMinutes(new Date(todayLog.bed_time), new Date(todayLog.wake_time))
    : null;

  const seriesFor = (days: number, offset = 0) =>
    Array.from({ length: days }, (_, i) => {
      const date = format(addDays(parseISO(todayIso()), i - (days - 1) - offset), 'yyyy-MM-dd');
      return { date, minutes: durationsByDate.get(date) ?? null };
    });

  const week = seriesFor(7);
  const priorWeek = seriesFor(7, 7);
  const mean = (rows: { minutes: number | null }[]) => {
    const vals = rows.map((r) => r.minutes).filter((m): m is number => m != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const weekMean = mean(week);
  const priorMean = mean(priorWeek);
  // Only claim a trend when both weeks actually have data — comparing against
  // an empty week would invent a swing that never happened.
  const trendMinutes = weekMean != null && priorMean != null ? weekMean - priorMean : null;
  const nightsLogged = week.filter((d) => d.minutes != null).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Sleep' }} />
      <Screen>
        {/* Analytics first, form second — this screen is for reading your
            sleep, not for filling in a nightly form. */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card raised style={styles.hero}>
            <View style={styles.heroTop}>
              <ProgressRing
                progress={(lastNightMinutes ?? 0) / TARGET_MINUTES}
                size={92}
                strokeWidth={7}
                color={Domain.sleep}>
                <ThemedText type="metricSmall">
                  {lastNightMinutes != null ? formatDuration(lastNightMinutes) : '—'}
                </ThemedText>
              </ProgressRing>
              <View style={styles.heroCopy}>
                <ThemedText type="label" themeColor="textTertiary">
                  Last night
                </ThemedText>
                <ThemedText type="subtitle">
                  {lastNightMinutes == null
                    ? 'Not logged'
                    : lastNightMinutes >= TARGET_MINUTES
                      ? 'On target'
                      : `${formatDuration(TARGET_MINUTES - lastNightMinutes)} short`}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Target {formatDuration(TARGET_MINUTES)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.statRow}>
              <Stat
                value={weekMean != null ? formatDuration(weekMean) : '—'}
                label="7-night avg"
                color={Domain.sleep}
              />
              <Stat
                value={
                  trendMinutes == null
                    ? '—'
                    : `${trendMinutes >= 0 ? '+' : '−'}${formatDuration(Math.abs(trendMinutes))}`
                }
                label="vs last week"
              />
              <Stat value={`${nightsLogged}/7`} label="Nights logged" />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(60)}>
          <Section
            title="This week"
            trailing={
              <ThemedText type="label" themeColor="textSecondary">
                vs {formatDuration(TARGET_MINUTES)} target
              </ThemedText>
            }>
            <HeatStrip
              data={week.map((d) => ({
                value: d.minutes == null ? null : Math.min(1, d.minutes / TARGET_MINUTES),
              }))}
              color={Domain.sleep}
              dayLabels={week.map((d) => format(parseISO(d.date), 'EEEEE'))}
              summary={`${nightsLogged} of 7 nights logged, averaging ${
                weekMean != null ? formatDuration(weekMean) : 'no data'
              }`}
            />
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(110)}>
          <Section title="Last 14 nights">
            <BarChart data={chartData} formatValue={formatDuration} color={Domain.sleep} />
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(160)}>
          <Section title={todayLog ? 'Update last night' : 'Log last night'}>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <ThemedText type="label" themeColor="textTertiary">
                  Bed time
                </ThemedText>
                <TimeField value={bedTime} onChange={setBedTime} />
              </View>
              <View style={styles.pickerColumn}>
                <ThemedText type="label" themeColor="textTertiary">
                  Wake time
                </ThemedText>
                <TimeField value={wakeTime} onChange={setWakeTime} />
              </View>
            </View>

            <View style={styles.qualityRow}>
              <ThemedText type="label" themeColor="textTertiary">
                Quality
              </ThemedText>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setQuality(star === quality ? null : star);
                  }}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`Quality ${star} of 5`}>
                  <Icon
                    name={quality != null && star <= quality ? 'star.fill' : 'star'}
                    size={20}
                    tintColor={quality != null && star <= quality ? Domain.sleep : theme.textTertiary}
                  />
                </Pressable>
              ))}
            </View>

            <Button
              title="Save"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                logSleep.mutate({
                  bedTime: { hours: bedTime.getHours(), minutes: bedTime.getMinutes() },
                  wakeTime: { hours: wakeTime.getHours(), minutes: wakeTime.getMinutes() },
                  quality: quality ?? undefined,
                });
              }}
            />
          </Section>
        </Animated.View>
      </Screen>
    </>
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
    gap: Spacing.four,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  pickerColumn: {
    gap: Spacing.one + 2,
    alignItems: 'flex-start',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    marginTop: Spacing.one,
  },
});
