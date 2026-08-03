import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BarChart } from '@/components/ui/bar-chart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatCard } from '@/components/ui/stat-card';
import { Spacing } from '@/constants/theme';
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

  const loggedNights = (logs ?? []).length;
  const avgMinutes =
    loggedNights > 0
      ? Math.round(
          (logs ?? []).reduce(
            (sum, log) =>
              sum + sleepDurationMinutes(new Date(log.bed_time), new Date(log.wake_time)),
            0
          ) / loggedNights
        )
      : 0;

  return (
    <>
      <Stack.Screen options={{ title: 'Sleep' }} />
      <Screen>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.statRow}>
          <StatCard
            label="Last night"
            value={
              todayLog
                ? formatDuration(
                    sleepDurationMinutes(new Date(todayLog.bed_time), new Date(todayLog.wake_time))
                  )
                : '—'
            }
            symbol="bed.double.fill"
            symbolColor={theme.tint}
          />
          <StatCard
            label="14-day avg"
            value={loggedNights > 0 ? formatDuration(avgMinutes) : '—'}
            symbol="chart.bar.fill"
            symbolColor={theme.success}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(60)}>
          <Card style={styles.logCard}>
            <ThemedText type="smallBold">
              {todayLog ? 'Update last night' : 'Log last night'}
            </ThemedText>

            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <ThemedText type="small" themeColor="textSecondary">
                  Bed time
                </ThemedText>
                <DateTimePicker
                  value={bedTime}
                  mode="time"
                  display="compact"
                  onChange={(_event, date) => date && setBedTime(date)}
                />
              </View>
              <View style={styles.pickerColumn}>
                <ThemedText type="small" themeColor="textSecondary">
                  Wake time
                </ThemedText>
                <DateTimePicker
                  value={wakeTime}
                  mode="time"
                  display="compact"
                  onChange={(_event, date) => date && setWakeTime(date)}
                />
              </View>
            </View>

            <View style={styles.qualityRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Quality
              </ThemedText>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setQuality(star === quality ? null : star);
                  }}
                  hitSlop={4}>
                  <SymbolView
                    name={quality != null && star <= quality ? 'star.fill' : 'star'}
                    size={22}
                    tintColor={quality != null && star <= quality ? theme.warning : theme.textSecondary}
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
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(120)}>
          <Card style={styles.chartCard}>
            <ThemedText type="smallBold">Last 14 nights</ThemedText>
            <BarChart data={chartData} formatValue={formatDuration} color={theme.tint} />
          </Card>
        </Animated.View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  logCard: {
    gap: Spacing.three,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  pickerColumn: {
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chartCard: {
    gap: Spacing.two,
  },
});
