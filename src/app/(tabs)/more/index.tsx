import { Link, Stack, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Motion, Spacing } from '@/constants/theme';
import { todayIso } from '@/lib/dates';
import { formatDuration, sleepDurationMinutes } from '@/lib/sleep/sleep';
import { splitForDay } from '@/lib/workout/split';
import { useRetention } from '@/hooks/use-retention';
import { useScoreHistory } from '@/hooks/use-score-history';
import { useSleepLogs } from '@/hooks/use-sleep';
import { useTheme } from '@/hooks/use-theme';
import { useWorkoutToday } from '@/hooks/use-workout';

type MoreLink = {
  href: Href;
  title: string;
  symbol: IconName;
  preview: string;
};

export default function MoreScreen() {
  const theme = useTheme();
  const { data: workout } = useWorkoutToday();
  const { data: retention } = useRetention();
  const { data: sleepLogs } = useSleepLogs();
  const { data: scoreHistory } = useScoreHistory(7);

  const split = workout?.cycleDay ? splitForDay(workout.cycleDay) : null;
  const workoutPreview = workout?.cycleDay == null ? 'Not set up' : split?.isRest ? 'Rest day' : `Day ${workout.cycleDay} of 8`;

  const streak = retention?.stats.currentStreakDays;
  const disciplinePreview = streak == null ? 'Not started' : `${streak} day${streak === 1 ? '' : 's'}`;

  const lastNight = (sleepLogs ?? []).find((log) => log.date === todayIso());
  const sleepPreview = lastNight
    ? formatDuration(sleepDurationMinutes(new Date(lastNight.bed_time), new Date(lastNight.wake_time)))
    : 'Not logged';

  const scored = (scoreHistory ?? []).filter((d): d is { date: string; score: number } => d.score != null);
  const avgScore = scored.length > 0 ? scored.reduce((sum, d) => sum + d.score, 0) / scored.length : null;
  const insightsPreview = avgScore != null ? `${Math.round(avgScore * 100)} avg` : 'No data yet';

  const destinations: MoreLink[] = [
    { href: '/more/workout', title: 'Workout', symbol: 'dumbbell.fill', preview: workoutPreview },
    { href: '/more/retention', title: 'Discipline', symbol: 'bolt.shield.fill', preview: disciplinePreview },
    { href: '/more/sleep', title: 'Sleep', symbol: 'moon.zzz.fill', preview: sleepPreview },
    { href: '/more/insights', title: 'Insights', symbol: 'chart.xyaxis.line', preview: insightsPreview },
    { href: '/more/settings', title: 'Settings', symbol: 'gearshape.fill', preview: '' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'More' }} />
      <Screen>
        {destinations.map((destination, index) => (
          <Animated.View
            key={destination.title}
            entering={FadeInDown.duration(Motion.entry).delay(index * 40)}>
            <Link href={destination.href} asChild>
              <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <Card style={styles.row}>
                  <View style={[styles.iconBadge, { backgroundColor: `${theme.tint}1F` }]}>
                    <Icon name={destination.symbol} size={20} tintColor={theme.tint} />
                  </View>
                  <ThemedText type="subtitle" style={styles.title}>
                    {destination.title}
                  </ThemedText>
                  {destination.preview ? (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.preview}>
                      {destination.preview}
                    </ThemedText>
                  ) : null}
                  <Icon
                    name="chevron.right"
                    size={14}
                    weight="semibold"
                    tintColor={theme.textTertiary}
                  />
                </Card>
              </Pressable>
            </Link>
          </Animated.View>
        ))}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  preview: {
    fontVariant: ['tabular-nums'],
    marginRight: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
  },
});
