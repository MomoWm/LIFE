import { Stack, router, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Section, SectionDivider } from '@/components/ui/section';
import { Domain, Motion, Spacing } from '@/constants/theme';
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
  color?: string;
  preview: string;
};

export default function MoreScreen() {
  const { data: workout } = useWorkoutToday();
  const { data: retention } = useRetention();
  const { data: sleepLogs } = useSleepLogs();
  const { data: scoreHistory } = useScoreHistory(7);

  const split = workout?.cycleDay ? splitForDay(workout.cycleDay) : null;
  const workoutPreview =
    workout?.cycleDay == null ? 'Not set up' : split?.isRest ? 'Rest day' : `Day ${workout.cycleDay} of 8`;

  const streak = retention?.stats.currentStreakDays;
  const disciplinePreview = streak == null ? 'Not started' : `${streak} day${streak === 1 ? '' : 's'}`;

  const lastNight = (sleepLogs ?? []).find((log) => log.date === todayIso());
  const sleepPreview = lastNight
    ? formatDuration(sleepDurationMinutes(new Date(lastNight.bed_time), new Date(lastNight.wake_time)))
    : 'Not logged';

  const scored = (scoreHistory ?? []).filter((d): d is { date: string; score: number } => d.score != null);
  const avgScore = scored.length > 0 ? scored.reduce((sum, d) => sum + d.score, 0) / scored.length : null;
  const insightsPreview = avgScore != null ? `${Math.round(avgScore * 100)} avg` : 'No data yet';

  // Grouped by what the destination is *for*, so the hub reads as an index of
  // the app rather than an undifferentiated settings list.
  const groups: { title: string; items: MoreLink[] }[] = [
    {
      title: 'Body',
      items: [
        {
          href: '/more/workout',
          title: 'Workout',
          symbol: 'dumbbell.fill',
          color: Domain.training,
          preview: workoutPreview,
        },
        {
          href: '/more/sleep',
          title: 'Sleep',
          symbol: 'moon.zzz.fill',
          color: Domain.sleep,
          preview: sleepPreview,
        },
        {
          href: '/more/retention',
          title: 'Discipline',
          symbol: 'bolt.shield.fill',
          color: Domain.routine,
          preview: disciplinePreview,
        },
      ],
    },
    {
      title: 'Analysis',
      items: [
        {
          href: '/more/insights',
          title: 'Insights',
          symbol: 'chart.xyaxis.line',
          preview: insightsPreview,
        },
      ],
    },
    {
      title: 'App',
      items: [
        { href: '/more/settings', title: 'Settings', symbol: 'gearshape.fill', preview: '' },
      ],
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'More' }} />
      <Screen>
        {groups.map((group, gi) => (
          <Animated.View
            key={group.title}
            entering={FadeInDown.duration(Motion.entry).delay(gi * 50)}>
            <Section title={group.title} contentStyle={styles.rows}>
              {group.items.map((item, i) => (
                <View key={item.title}>
                  {i > 0 ? <SectionDivider inset={44} /> : null}
                  <MoreRow item={item} />
                </View>
              ))}
            </Section>
          </Animated.View>
        ))}
      </Screen>
    </>
  );
}

function MoreRow({ item }: { item: MoreLink }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(item.href as never)}
      accessibilityRole="button"
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: theme.backgroundElement }]}>
          <Icon name={item.symbol} size={17} tintColor={item.color ?? theme.textSecondary} />
        </View>
        <ThemedText type="smallBold" style={styles.title}>
          {item.title}
        </ThemedText>
        {item.preview ? (
          <ThemedText type="small" themeColor="textTertiary" style={styles.preview}>
            {item.preview}
          </ThemedText>
        ) : null}
        <Icon name="chevron.right" size={12} weight="semibold" tintColor={theme.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 56,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  preview: {
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.6,
  },
});
