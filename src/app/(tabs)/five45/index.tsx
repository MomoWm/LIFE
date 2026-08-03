import { Link, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { DAY_TYPE_LABELS } from '@/lib/dayType/dayType';
import { useActiveGoals, useFive45Streak, useFive45Today, useToggleTask } from '@/hooks/use-five45';
import { useTheme } from '@/hooks/use-theme';

export default function Five45Screen() {
  const theme = useTheme();
  const { data: today, isPending } = useFive45Today();
  const { data: streak } = useFive45Streak();
  const { data: goals } = useActiveGoals();
  const toggleTask = useToggleTask();

  const wakeTasks = today?.tasks.filter((t) => t.kind === 'wake') ?? [];
  const eodTasks = today?.tasks.filter((t) => t.kind === 'eod') ?? [];
  const totalTasks = wakeTasks.length + eodTasks.length;
  const doneCount =
    today?.tasks.filter((t) => today.completedTaskIds.has(t.id)).length ?? 0;
  const progress = totalTasks > 0 ? doneCount / totalTasks : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: '545',
          headerRight: () => (
            <Link href="/five45/templates" asChild>
              <Pressable hitSlop={8}>
                <SymbolView name="slider.horizontal.3" size={22} tintColor={theme.tint} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Screen>
        <Animated.View entering={FadeInDown.duration(350)}>
          <Card style={styles.headerCard}>
            <ProgressRing progress={progress} size={72} strokeWidth={7}>
              <ThemedText type="smallBold">
                {doneCount}/{totalTasks || 10}
              </ThemedText>
            </ProgressRing>
            <View style={styles.headerText}>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                {today ? DAY_TYPE_LABELS[today.dayType].split(' (')[0] : ' '}
              </ThemedText>
              <View style={styles.streakRow}>
                <SymbolView name="flame.fill" size={16} tintColor={theme.warning} />
                <ThemedText type="small" themeColor="textSecondary">
                  {streak ?? 0} day streak
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(60)}>
          <SectionCard
            title="Morning 5"
            symbol="sunrise.fill"
            symbolColor={theme.warning}
            emptyHint="Set your 5 wake-up tasks in the template editor (top right).">
            {wakeTasks.map((task) => (
              <CheckboxRow
                key={task.id}
                title={task.title}
                checked={today?.completedTaskIds.has(task.id) ?? false}
                onToggle={() =>
                  toggleTask.mutate({
                    taskId: task.id,
                    completed: today?.completedTaskIds.has(task.id) ?? false,
                  })
                }
              />
            ))}
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(120)}>
          <Link href="/five45/goals" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <SectionCard
                title="4 Goals · 3 months"
                symbol="target"
                symbolColor={theme.tint}
                emptyHint="Tap to set your 4 short-term goals.">
                {(goals ?? []).map((goal) => (
                  <View key={goal.id} style={styles.goalRow}>
                    <View style={[styles.goalDot, { backgroundColor: theme.tint }]} />
                    <ThemedText style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </ThemedText>
                  </View>
                ))}
              </SectionCard>
            </Pressable>
          </Link>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(180)}>
          <SectionCard
            title="Non-negotiables"
            symbol="moon.stars.fill"
            symbolColor="#7B68EE"
            emptyHint="Set your 5 before-sleep non-negotiables in the template editor.">
            {eodTasks.map((task) => (
              <CheckboxRow
                key={task.id}
                title={task.title}
                checked={today?.completedTaskIds.has(task.id) ?? false}
                onToggle={() =>
                  toggleTask.mutate({
                    taskId: task.id,
                    completed: today?.completedTaskIds.has(task.id) ?? false,
                  })
                }
              />
            ))}
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(240)}>
          <Link href="/five45/review" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.reviewRow}>
                <SymbolView name="checkmark.rectangle.stack.fill" size={18} tintColor={theme.tint} />
                <ThemedText type="smallBold" style={styles.reviewTitle}>
                  Weekly review
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date().getDay() === 0 ? 'due today' : 'Sundays'}
                </ThemedText>
                <SymbolView name="chevron.right" size={13} weight="semibold" tintColor={theme.textSecondary} />
              </Card>
            </Pressable>
          </Link>
        </Animated.View>

        {isPending ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.loading}>
            Loading today…
          </ThemedText>
        ) : null}
      </Screen>
    </>
  );
}

function SectionCard({
  title,
  symbol,
  symbolColor,
  emptyHint,
  children,
}: {
  title: string;
  symbol: Parameters<typeof SymbolView>[0]['name'];
  symbolColor: string;
  emptyHint: string;
  children: React.ReactNode;
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <SymbolView name={symbol} size={18} tintColor={symbolColor} />
        <ThemedText type="smallBold">{title}</ThemedText>
      </View>
      {isEmpty ? (
        <ThemedText type="small" themeColor="textSecondary">
          {emptyHint}
        </ThemedText>
      ) : (
        children
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionCard: {
    gap: Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 34,
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalTitle: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  reviewTitle: {
    flex: 1,
  },
  loading: {
    textAlign: 'center',
  },
});
