import { format } from 'date-fns';
import { router } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { EmptyState } from '@/components/ui/empty-state';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar, SegmentedProgress } from '@/components/ui/progress-bar';
import { PulseDot } from '@/components/ui/pulse-dot';
import { SegmentRing, type RingSegment } from '@/components/ui/segment-ring';
import { Screen } from '@/components/ui/screen';
import { Section, SectionDivider } from '@/components/ui/section';
import { Stat } from '@/components/ui/stat';
import { Domain, Spacing } from '@/constants/theme';
import { todayIso } from '@/lib/dates';
import { PRAYER_LABELS, computePrayerTimes, nextPrayer } from '@/lib/prayerTimes/adhanClient';
import { todayPhase } from '@/lib/score/todayPhase';
import { computeTodayScore, type ScoreComponent } from '@/lib/score/todayScore';
import { splitForDay } from '@/lib/workout/split';
import { useFive45Streak, useFive45Today, useToggleTask } from '@/hooks/use-five45';
import { usePrayerStreak, usePrayerToday } from '@/hooks/use-prayer';
import { useProfile } from '@/hooks/use-profile';
import { useRetention } from '@/hooks/use-retention';
import { useCountUp } from '@/hooks/use-count-up';
import { useCountdown } from '@/hooks/use-countdown';
import { useSaveTodayScore } from '@/hooks/use-score-history';
import { useSleepLogs } from '@/hooks/use-sleep';
import { useTheme } from '@/hooks/use-theme';
import { useWorkTargets, useWorkToday } from '@/hooks/use-work';
import { useWorkoutToday } from '@/hooks/use-workout';

export default function TodayScreen() {
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

  const saveTodayScore = useSaveTodayScore();
  const lastSavedScore = useRef<number | null>(null);
  useEffect(() => {
    // Rounded so a display-invisible floating-point wobble doesn't trigger a
    // write on every render; a real change in the underlying data still does.
    const rounded = Math.round(score * 1000) / 1000;
    if (lastSavedScore.current === rounded) return;
    lastSavedScore.current = rounded;
    saveTodayScore.mutate({ score, components });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

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

  // Score components, labelled for the hero breakdown. Showing how the number
  // was reached beats restating it in prose, and it doubles as the answer to
  // "what should I do next" — the shortest bar is the gap.
  const breakdown = [
    { key: 'five45', label: 'Routine', color: Domain.routine },
    { key: 'prayer', label: 'Prayer', color: Domain.prayer },
    { key: 'work', label: 'Work', color: Domain.work },
    { key: 'workout', label: 'Training', color: Domain.training },
  ].map((row) => {
    const component = components.find((c) => c.key === row.key);
    // Categories that don't apply today (a rest day, an unconfigured tracker)
    // keep their place but read as empty track — they are genuinely excluded
    // from scoring, and a 0% arc would read as failure.
    return {
      ...row,
      applicable: component?.applicable ?? false,
      score: component?.score ?? 0,
      weight: component?.weight ?? 1,
    };
  });

  const ringSegments: RingSegment[] = breakdown.map((row) => ({
    key: row.label,
    weight: row.weight,
    score: row.score,
    color: row.color,
    applicable: row.applicable,
  }));

  // The score climbs into place rather than appearing, and the next prayer
  // counts down live instead of being a time printed once.
  const displayScore = Math.round(useCountUp(score * 100));
  const nextPrayerAt = upcoming && times ? times[upcoming] : null;
  const countdown = useCountdown(nextPrayerAt);

  const phaseTasks = phase === 'evening' ? eodTasks : wakeTasks;
  const phaseTitle = phase === 'evening' ? 'Non-negotiables' : 'Morning 5';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Screen>
        {/* ---- Hero: the one Card on the screen, so it reads as the anchor ---- */}
        <Card raised style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroHeadline}>
              <ThemedText type="label" themeColor="textTertiary">
                {format(now, 'EEEE, MMMM d')}
              </ThemedText>
              <ThemedText type="title">{greeting}</ThemedText>
              {countdown && upcoming ? (
                <View style={styles.liveRow}>
                  <PulseDot color={Domain.prayer} size={7} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {PRAYER_LABELS[upcoming]} {countdown}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          {/* One ring, one arc per category, each sized by how much it counts
              and filled by how much is done — the whole day in a glance. */}
          <View style={styles.ringWrap}>
            <SegmentRing segments={ringSegments} size={168} strokeWidth={11}>
              <ThemedText type="display" style={styles.scoreText}>
                {displayScore}
              </ThemedText>
              <ThemedText type="label" themeColor="textTertiary">
                Today
              </ThemedText>
            </SegmentRing>
          </View>

          <View style={styles.legend}>
            {breakdown.map((row) => (
              <View key={row.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: row.color, opacity: row.applicable ? 1 : 0.25 }]} />
                <ThemedText type="label" themeColor="textTertiary">
                  {row.label}
                </ThemedText>
                <ThemedText
                  type="label"
                  themeColor={row.applicable ? 'textSecondary' : 'textTertiary'}>
                  {row.applicable ? Math.round(row.score * 100) : '—'}
                </ThemedText>
              </View>
            ))}
          </View>

        </Card>

        {/* ---- Streaks: bare numbers on the ground, no containers ---- */}
        <Section title="Streaks">
          <View style={styles.streakRow}>
            <CountingStat value={five45Streak ?? 0} label="Routine" color={Domain.routine} />
            <CountingStat value={prayerStreak ?? 0} label="Prayer" color={Domain.prayer} />
            <CountingStat value={retention?.stats.currentStreakDays ?? 0} label="Discipline" />
          </View>
        </Section>

        {/* ---- The actual work for this part of the day ---- */}
        <Section
          title={phaseTitle}
          trailing={
            phaseTasks.length > 0 ? (
              <ThemedText type="label" themeColor="textSecondary">
                {phaseTasks.filter((t) => five45?.completedTaskIds.has(t.id)).length}/
                {phaseTasks.length}
              </ThemedText>
            ) : null
          }
          onPress={() => router.push('/five45')}>
          {phaseTasks.length === 0 ? (
            <EmptyState
              icon="checklist"
              color={Domain.routine}
              title="Nothing set for today"
              body="Build the template once and it repeats on every day of this type."
              action={{ label: 'Set it up', onPress: () => router.push('/five45/templates') }}
            />
          ) : (
            phaseTasks.map((task) => (
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
        </Section>

        {/* ---- Everything else, grouped into one section with rules between
               rows rather than four isolated cards ---- */}
        <Section title="Today at a glance">
          <GlanceRow
            symbol="moon.stars.fill"
            color={Domain.prayer}
            title="Prayer"
            detail={
              upcoming && times
                ? `${PRAYER_LABELS[upcoming]} at ${format(times[upcoming], 'h:mm a')}`
                : 'All prayer times have passed'
            }
            onPress={() => router.push('/prayer')}
            visual={
              <SegmentedProgress
                total={5}
                filled={prayedCount}
                color={Domain.prayer}
                label={`${prayedCount} of 5 prayers`}
              />
            }
          />
          <SectionDivider inset={44} />
          <GlanceRow
            symbol="briefcase.fill"
            color={Domain.work}
            title="Work"
            detail={
              work?.session == null
                ? 'Not started — begin when you head out'
                : work.session.status === 'active'
                  ? 'Clock running'
                  : work.session.status === 'on_break'
                    ? 'On break'
                    : 'Day ended'
            }
            trailing={`${work?.counts.interaction ?? 0}/${interactionsTarget}`}
            live={work?.session?.status === 'active'}
            onPress={() => router.push('/work')}
            visual={
              <ProgressBar
                progress={(work?.counts.interaction ?? 0) / interactionsTarget}
                color={Domain.work}
                height={4}
                label={`${work?.counts.interaction ?? 0} of ${interactionsTarget} interactions`}
              />
            }
          />
          <SectionDivider inset={44} />
          <GlanceRow
            symbol="dumbbell.fill"
            color={Domain.training}
            title="Training"
            detail={
              split == null
                ? 'Tell it where you are in the 8-day split'
                : split.isRest
                  ? 'Rest day — recovery counts'
                  : `Day ${workout?.cycleDay}: ${split.label}`
            }
            onPress={() => router.push('/more/workout')}
          />
          {!sleepLoggedToday ? (
            <>
              <SectionDivider inset={44} />
              <GlanceRow
                symbol="moon.zzz.fill"
                color={Domain.sleep}
                title="Sleep"
                detail="Last night still unlogged"
                onPress={() => router.push('/more/sleep')}
              />
            </>
          ) : null}
        </Section>
      </Screen>
    </SafeAreaView>
  );
}

/**
 * One line of the at-a-glance group: icon, name, current state, and an
 * optional inline progress visual. Deliberately not a Card — these are peers
 * inside a single section, and boxing each one is what made the old dashboard
 * read as a wall of equal-weight tiles.
 */
function GlanceRow({
  symbol,
  color,
  title,
  detail,
  trailing,
  visual,
  live,
  onPress,
}: {
  symbol: IconName;
  color: string;
  title: string;
  detail: string;
  trailing?: string;
  visual?: React.ReactNode;
  live?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <PressableScale onPress={onPress} style={styles.glance} accessibilityLabel={`${title}. ${detail}`}>
      <View style={[styles.glanceIcon, { backgroundColor: theme.backgroundElement }]}>
        {live ? <PulseDot color={color} size={9} /> : <Icon name={symbol} size={17} tintColor={color} />}
      </View>
        <View style={styles.glanceBody}>
          <View style={styles.glanceHead}>
            <ThemedText type="smallBold" style={styles.glanceTitle}>
              {title}
            </ThemedText>
            {trailing ? (
              <ThemedText type="label" themeColor="textSecondary">
                {trailing}
              </ThemedText>
            ) : null}
            <Icon name="chevron.right" size={12} weight="semibold" tintColor={theme.textTertiary} />
          </View>
          <ThemedText type="small" themeColor="textTertiary">
            {detail}
          </ThemedText>
          {visual ? <View style={styles.glanceVisual}>{visual}</View> : null}
        </View>
    </PressableScale>
  );
}

/** A streak figure that climbs to its value rather than appearing at it. */
function CountingStat({ value, label, color }: { value: number; label: string; color?: string }) {
  const shown = Math.round(useCountUp(value, 700));
  return <Stat value={String(shown)} label={label} unit="d" color={color} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  hero: {
    gap: Spacing.four,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroHeadline: {
    flex: 1,
    gap: Spacing.one,
  },
  scoreText: {
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -2,
  },
  ringWrap: {
    alignItems: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two + 2,
  },
  legendItem: {
    // Two per row rather than four across: at phone width four columns
    // orphaned the last item onto its own line.
    flexBasis: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  breakdown: {
    gap: Spacing.three,
  },
  breakdownRow: {
    flex: 1,
    gap: Spacing.one + 2,
  },
  breakdownHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  glance: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  glanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glanceBody: {
    flex: 1,
    gap: 2,
  },
  glanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  glanceTitle: {
    flex: 1,
  },
  glanceVisual: {
    marginTop: Spacing.two,
  },
});
