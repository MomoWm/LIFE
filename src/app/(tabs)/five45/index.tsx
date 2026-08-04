import { Stack, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedProgress } from '@/components/ui/progress-bar';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { Section, SectionDivider } from '@/components/ui/section';
import { CornerRadius, Domain, Spacing } from '@/constants/theme';
import { DAY_TYPE_LABELS } from '@/lib/dayType/dayType';
import { useActiveGoals, useFive45Streak, useFive45Today, useToggleTask } from '@/hooks/use-five45';
import { useTheme } from '@/hooks/use-theme';

export default function Five45Screen() {
  const theme = useTheme();
  const { data: today } = useFive45Today();
  const { data: streak } = useFive45Streak();
  const { data: goals } = useActiveGoals();
  const toggleTask = useToggleTask();

  const wakeTasks = today?.tasks.filter((t) => t.kind === 'wake') ?? [];
  const eodTasks = today?.tasks.filter((t) => t.kind === 'eod') ?? [];
  const totalTasks = wakeTasks.length + eodTasks.length;
  const isDone = (id: string) => today?.completedTaskIds.has(id) ?? false;
  const doneCount = today?.tasks.filter((t) => isDone(t.id)).length ?? 0;
  const wakeDone = wakeTasks.filter((t) => isDone(t.id)).length;
  const eodDone = eodTasks.filter((t) => isDone(t.id)).length;
  const progress = totalTasks > 0 ? doneCount / totalTasks : 0;

  const toggle = (id: string) => toggleTask.mutate({ taskId: id, completed: isDone(id) });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Routine',
          headerRight: () => (
            // A bare 20pt glyph is both an unreadable label and a tap target
            // well under the 44pt minimum — it reads as a stray mark in the
            // corner. A bordered pill with the word in it is legible at any
            // size and is its own hit area.
            <Pressable
              onPress={() => router.push('/five45/templates')}
              accessibilityRole="button"
              accessibilityLabel="Edit templates"
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerAction,
                { borderColor: theme.separator },
                pressed && { opacity: 0.6 },
              ]}>
              <Icon name="slider.horizontal.3" size={15} tintColor={theme.textSecondary} />
              <ThemedText type="label" themeColor="textSecondary">
                Templates
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <Screen>
        {/* Progress first: the ring and the two phase bars say where the day
            stands before any label is read. */}
        <Card raised style={styles.hero}>
          <View style={styles.heroTop}>
            <ProgressRing progress={progress} size={92} strokeWidth={7} color={Domain.routine}>
              <ThemedText type="metricSmall">
                {doneCount}
                <ThemedText type="small" themeColor="textTertiary">
                  /{totalTasks || 10}
                </ThemedText>
              </ThemedText>
            </ProgressRing>
            <View style={styles.heroCopy}>
              <ThemedText type="label" themeColor="textTertiary">
                {today ? DAY_TYPE_LABELS[today.dayType].split(' (')[0] : ' '}
              </ThemedText>
              <ThemedText type="subtitle">
                {progress === 1 && totalTasks > 0 ? 'Day complete' : 'In progress'}
              </ThemedText>
              <View style={styles.streakLine}>
                <Icon name="flame.fill" size={13} tintColor={theme.textTertiary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {streak ?? 0} day streak
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.phaseRow}>
            <View style={styles.phase}>
              <View style={styles.phaseHead}>
                <ThemedText type="label" themeColor="textTertiary">
                  Morning
                </ThemedText>
                <ThemedText type="label" themeColor="textSecondary">
                  {wakeDone}/{wakeTasks.length || 5}
                </ThemedText>
              </View>
              <SegmentedProgress
                total={wakeTasks.length || 5}
                filled={wakeDone}
                color={Domain.routine}
                label={`Morning ${wakeDone} of ${wakeTasks.length || 5}`}
              />
            </View>
            <View style={styles.phase}>
              <View style={styles.phaseHead}>
                <ThemedText type="label" themeColor="textTertiary">
                  Evening
                </ThemedText>
                <ThemedText type="label" themeColor="textSecondary">
                  {eodDone}/{eodTasks.length || 5}
                </ThemedText>
              </View>
              <SegmentedProgress
                total={eodTasks.length || 5}
                filled={eodDone}
                color={Domain.routine}
                label={`Evening ${eodDone} of ${eodTasks.length || 5}`}
              />
            </View>
          </View>
        </Card>

        <Section
          title="Morning 5"
          trailing={
            <ThemedText type="label" themeColor="textSecondary">
              {wakeDone}/{wakeTasks.length || 5}
            </ThemedText>
          }>
          {wakeTasks.length === 0 ? (
            <EmptyState
                icon="checklist"
                color={Domain.routine}
                title="Your morning 5"
                body="Five things, before the day starts."
                action={{ label: 'Set them', onPress: () => router.push('/five45/templates') }}
              />
          ) : (
            wakeTasks.map((task) => (
              <CheckboxRow
                key={task.id}
                title={task.title}
                checked={isDone(task.id)}
                onToggle={() => toggle(task.id)}
              />
            ))
          )}
        </Section>

        {/* Goals sit between the two task blocks the way they sit between the
            two ends of the day — the quarter-long work the daily reps serve. */}
        <Section
          title="4 Goals · this quarter"
          onPress={() => router.push('/five45/goals')}
          contentStyle={styles.goalList}>
          {(goals ?? []).length === 0 ? (
            <EmptyState
                icon="target"
                color={Domain.routine}
                title="Four goals"
                body="What this quarter is for."
                action={{ label: 'Set them', onPress: () => router.push('/five45/goals') }}
              />
          ) : (
            (goals ?? []).map((goal, i) => (
              <View key={goal.id}>
                {i > 0 ? <SectionDivider /> : null}
                <View style={styles.goalRow}>
                  <ThemedText type="label" themeColor="textTertiary" style={styles.goalIndex}>
                    {i + 1}
                  </ThemedText>
                  <ThemedText style={styles.goalTitle} numberOfLines={1}>
                    {goal.title}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </Section>

        <Section
          title="Non-negotiables"
          trailing={
            <ThemedText type="label" themeColor="textSecondary">
              {eodDone}/{eodTasks.length || 5}
            </ThemedText>
          }>
          {eodTasks.length === 0 ? (
            <EmptyState
                icon="checklist"
                color={Domain.routine}
                title="Your evening 5"
                body="Five you don't sleep without."
                action={{ label: 'Set them', onPress: () => router.push('/five45/templates') }}
              />
          ) : (
            eodTasks.map((task) => (
              <CheckboxRow
                key={task.id}
                title={task.title}
                checked={isDone(task.id)}
                onToggle={() => toggle(task.id)}
              />
            ))
          )}
        </Section>

        {/* An inline row, not a card — it is one line of text and a link. */}
        <Pressable onPress={() => router.push('/five45/review')} accessibilityRole="button">
          <View style={[styles.reviewRow, { borderTopColor: theme.separator }]}>
            <Icon name="checkmark.rectangle.stack.fill" size={16} tintColor={theme.textSecondary} />
            <ThemedText type="smallBold" style={styles.reviewTitle}>
              Weekly review
            </ThemedText>
            <ThemedText type="label" themeColor="textTertiary">
              {new Date().getDay() === 0 ? 'Due today' : 'Sundays'}
            </ThemedText>
            <Icon name="chevron.right" size={12} weight="semibold" tintColor={theme.textTertiary} />
          </View>
        </Pressable>

      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    minHeight: 34,
    paddingHorizontal: Spacing.two + 2,
    // The large-title header doesn't inset its right accessory on web, so the
    // pill's border ran off the edge of the screen.
    marginRight: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: CornerRadius.medium,
  },
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
  streakLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  phaseRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  phase: {
    flex: 1,
    gap: Spacing.one + 2,
  },
  phaseHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalList: {
    gap: 0,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  goalIndex: {
    width: 12,
  },
  goalTitle: {
    flex: 1,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    minHeight: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  reviewTitle: {
    flex: 1,
  },
});
