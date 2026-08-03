import { format } from 'date-fns';
import { Link, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { todayIso } from '@/lib/dates';
import { PRAYER_LABELS, computePrayerTimes, nextPrayer } from '@/lib/prayerTimes/adhanClient';
import { todayPhase } from '@/lib/score/todayPhase';
import { computeTodayScore, type ScoreComponent } from '@/lib/score/todayScore';
import { splitForDay } from '@/lib/workout/split';
import { useFive45Streak, useFive45Today, useToggleTask } from '@/hooks/use-five45';
import { usePrayerStreak, usePrayerToday } from '@/hooks/use-prayer';
import { useProfile } from '@/hooks/use-profile';
import { useRetention } from '@/hooks/use-retention';
import { useSleepLogs } from '@/hooks/use-sleep';
import { useTheme } from '@/hooks/use-theme';
import { useWorkTargets, useWorkToday } from '@/hooks/use-work';
import { useWorkoutToday } from '@/hooks/use-workout';

export default function TodayScreen() {
  const theme = useTheme();
  const now = new Date();
  const phase = todayPhase(now);

  const { data: five45 } = useFive45Today();
  const { data: five45Streak } = useFive45Streak();
  const { data: prayerLogs } = usePrayerToday();
  const { data: prayerStreak } = usePrayerStreak();
  const { data: profile } = useProfile();
  const { data: retention } = useRetention();
  const { data: sleepLogs } = useSleepLogs();
  const { data: workout } = useWorkoutToday();
  const { data: work } = useWorkToday();
  const { data: targets } = useWorkTargets();
  const toggleTask = useToggleTask();

  // --- score ---
  const totalTasks = five45?.tasks.length ?? 0;
  const doneTasks = five45?.tasks.filter((t) => five45.completedTaskIds.has(t.id)).length ?? 0;
  const prayedCount =
    prayerLogs?.filter((log) => log.status === 'on_time' || log.status === 'late').length ?? 0;

  const split = workout?.cycleDay ? splitForDay(workout.cycleDay) : null;
  const workoutScore =
    workout?.session == null
      ? 0
      : workout.session.entries.some((entry) => entry.sets.length > 0)
        ? 1
        : 0.5;

  const interactionsTarget = targets?.interactions_target ?? 20;
  const pitchesTarget = targets?.pitches_target ?? 8;
  const workApplicable = work != null && (work.session != null || Object.values(work.counts).some((c) => c > 0));
  const workScore = work
    ? (Math.min(1, work.counts.interaction / interactionsTarget) +
        Math.min(1, work.counts.pitch / pitchesTarget)) /
      2
    : 0;

  const sleepLoggedToday = (sleepLogs ?? []).some((log) => log.date === todayIso());

  const components: ScoreComponent[] = [
    { key: 'five45', score: totalTasks > 0 ? doneTasks / totalTasks : 0, weight: 30, applicable: totalTasks > 0 },
    { key: 'prayer', score: prayedCount / 5, weight: 25, applicable: true },
    { key: 'workout', score: workoutScore, weight: 15, applicable: split != null && !split.isRest },
    { key: 'work', score: workScore, weight: 20, applicable: workApplicable },
    { key: 'sleep', score: sleepLoggedToday ? 1 : 0, weight: 5, applicable: (sleepLogs ?? []).length > 0 },
    {
      key: 'retention',
      score: 1,
      weight: 5,
      applicable: retention?.stats.currentStreakDays != null,
    },
  ];
  const score = computeTodayScore(components);

  // --- phase content ---
  const wakeTasks = five45?.tasks.filter((t) => t.kind === 'wake') ?? [];
  const eodTasks = five45?.tasks.filter((t) => t.kind === 'eod') ?? [];
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

  const greeting =
    phase === 'morning' ? 'Good morning' : phase === 'daytime' ? 'Lock in' : 'Finish strong';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Screen>
        <Animated.View entering={FadeInDown.duration(350)}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="small" themeColor="textSecondary">
                {format(now, 'EEEE, MMMM d')}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.greeting}>
                {greeting}
              </ThemedText>
            </View>
            <ProgressRing progress={score} size={64} strokeWidth={6} color={theme.success}>
              <ThemedText type="smallBold">{Math.round(score * 100)}</ThemedText>
            </ProgressRing>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(50)} style={styles.statRow}>
          <MiniStat symbol="flame.fill" color={theme.warning} value={five45Streak ?? 0} label="545" />
          <MiniStat symbol="moon.stars.fill" color="#7B68EE" value={prayerStreak ?? 0} label="prayer" />
          <MiniStat
            symbol="bolt.shield.fill"
            color={theme.tint}
            value={retention?.stats.currentStreakDays ?? 0}
            label="retention"
          />
        </Animated.View>

        {phase === 'morning' ? (
          <>
            <DashboardSection
              title="Morning 5"
              symbol="sunrise.fill"
              symbolColor={theme.warning}
              href="/five45"
              delay={100}>
              {wakeTasks.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Set up your wake-up tasks in the 545 tab.
                </ThemedText>
              ) : (
                wakeTasks.map((task) => (
                  <CheckboxRow
                    key={task.id}
                    title={task.title}
                    checked={five45?.completedTaskIds.has(task.id) ?? false}
                    onToggle={() =>
                      toggleTask.mutate({
                        taskId: task.id,
                        completed: five45?.completedTaskIds.has(task.id) ?? false,
                      })
                    }
                  />
                ))
              )}
            </DashboardSection>
            {upcoming && times ? (
              <InfoCard
                symbol="moon.stars.fill"
                color="#7B68EE"
                title={`${PRAYER_LABELS[upcoming]} at ${format(times[upcoming], 'h:mm a')}`}
                subtitle={`${prayedCount}/5 prayed so far`}
                href="/prayer"
                delay={150}
              />
            ) : null}
            {!sleepLoggedToday ? (
              <InfoCard
                symbol="bed.double.fill"
                color={theme.tint}
                title="Log last night's sleep"
                subtitle="Takes ten seconds while the coffee brews"
                href="/more/sleep"
                delay={200}
              />
            ) : null}
          </>
        ) : null}

        {phase === 'daytime' ? (
          <>
            <DashboardSection
              title="Knocking hours"
              symbol="briefcase.fill"
              symbolColor={theme.tint}
              href="/work"
              delay={100}>
              <View style={styles.workRow}>
                <WorkCount value={work?.counts.door ?? 0} label="doors" />
                <WorkCount
                  value={work?.counts.interaction ?? 0}
                  label={`/${interactionsTarget} talks`}
                />
                <WorkCount value={work?.counts.pitch ?? 0} label={`/${pitchesTarget} pitches`} />
                <WorkCount value={work?.counts.appointment ?? 0} label="appts" />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {work?.session == null
                  ? 'Timer not started — tap to open Work.'
                  : work.session.status === 'active'
                    ? 'Clock running.'
                    : work.session.status === 'on_break'
                      ? 'On break.'
                      : 'Day ended.'}
              </ThemedText>
            </DashboardSection>
            {split ? (
              <InfoCard
                symbol="dumbbell.fill"
                color={theme.success}
                title={split.isRest ? 'Rest day' : `Day ${workout?.cycleDay}: ${split.label}`}
                subtitle={
                  split.isRest
                    ? 'Recover — tomorrow goes hard'
                    : workout?.session
                      ? 'Session in progress'
                      : 'No session logged yet'
                }
                href="/more/workout"
                delay={150}
              />
            ) : null}
            {upcoming && times ? (
              <InfoCard
                symbol="moon.stars.fill"
                color="#7B68EE"
                title={`${PRAYER_LABELS[upcoming]} at ${format(times[upcoming], 'h:mm a')}`}
                subtitle={`${prayedCount}/5 prayed so far`}
                href="/prayer"
                delay={200}
              />
            ) : null}
          </>
        ) : null}

        {phase === 'evening' ? (
          <>
            <DashboardSection
              title="Non-negotiables"
              symbol="moon.stars.fill"
              symbolColor="#7B68EE"
              href="/five45"
              delay={100}>
              {eodTasks.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Set up your non-negotiables in the 545 tab.
                </ThemedText>
              ) : (
                eodTasks.map((task) => (
                  <CheckboxRow
                    key={task.id}
                    title={task.title}
                    checked={five45?.completedTaskIds.has(task.id) ?? false}
                    onToggle={() =>
                      toggleTask.mutate({
                        taskId: task.id,
                        completed: five45?.completedTaskIds.has(task.id) ?? false,
                      })
                    }
                  />
                ))
              )}
            </DashboardSection>
            <InfoCard
              symbol="moon.zzz.fill"
              color={theme.tint}
              title={`Prayers: ${prayedCount}/5 today`}
              subtitle={upcoming && times ? `${PRAYER_LABELS[upcoming]} still ahead at ${format(times[upcoming], 'h:mm a')}` : 'All prayer times have passed'}
              href="/prayer"
              delay={150}
            />
          </>
        ) : null}
      </Screen>
    </SafeAreaView>
  );
}

function MiniStat({
  symbol,
  color,
  value,
  label,
}: {
  symbol: IconName;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <Card style={styles.miniStat}>
      <Icon name={symbol} size={14} tintColor={color} />
      <ThemedText type="smallBold" style={styles.miniStatValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

function DashboardSection({
  title,
  symbol,
  symbolColor,
  href,
  delay,
  children,
}: {
  title: string;
  symbol: IconName;
  symbolColor: string;
  href: Href;
  delay: number;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(350).delay(delay)}>
      <Card style={styles.sectionCard}>
        <Link href={href} asChild>
          <Pressable style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
            <Icon name={symbol} size={17} tintColor={symbolColor} />
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              {title}
            </ThemedText>
            <Icon name="chevron.right" size={13} weight="semibold" tintColor={theme.textSecondary} />
          </Pressable>
        </Link>
        {children}
      </Card>
    </Animated.View>
  );
}

function InfoCard({
  symbol,
  color,
  title,
  subtitle,
  href,
  delay,
}: {
  symbol: IconName;
  color: string;
  title: string;
  subtitle: string;
  href: Href;
  delay: number;
}) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(350).delay(delay)}>
      <Link href={href} asChild>
        <Pressable style={({ pressed }) => pressed && styles.pressed}>
          <Card style={styles.infoCard}>
            <Icon name={symbol} size={20} tintColor={color} />
            <View style={styles.infoText}>
              <ThemedText type="smallBold">{title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            </View>
            <Icon name="chevron.right" size={13} weight="semibold" tintColor={theme.textSecondary} />
          </Card>
        </Pressable>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 28,
    lineHeight: 34,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  miniStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.two + 2,
  },
  miniStatValue: {
    fontVariant: ['tabular-nums'],
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
  sectionTitle: {
    flex: 1,
  },
  workRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.one,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  infoText: {
    flex: 1,
    gap: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});

function WorkCount({ value, label }: { value: number; label: string }) {
  return (
    <View style={workCountStyles.container}>
      <ThemedText type="smallBold" style={workCountStyles.value}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const workCountStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 1,
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
});
