import * as Haptics from '@/lib/haptics';
import { Link, Stack, router } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { CornerRadius, Domain, Spacing } from '@/constants/theme';
import { computeFunnel, formatRate } from '@/lib/funnel/funnel';
import type { WorkEventType } from '@/lib/supabase/types';
import {
  useEndWork,
  useLogWorkEvent,
  useStartWork,
  useToggleBreak,
  useWorkTargets,
  useWorkToday,
  workedMinutes,
} from '@/hooks/use-work';
import { useTheme } from '@/hooks/use-theme';

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function WorkScreen() {
  const theme = useTheme();
  const { data: today } = useWorkToday();
  const { data: targets } = useWorkTargets();
  const startWork = useStartWork();
  const toggleBreak = useToggleBreak();
  const endWork = useEndWork();
  const logEvent = useLogWorkEvent();

  const session = today?.session ?? null;
  const isLive = session != null && session.status !== 'ended';

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const minutes = workedMinutes(session, now);

  const counters: {
    type: WorkEventType;
    label: string;
    symbol: IconName;
    target: number | null;
  }[] = [
    { type: 'door', label: 'Doors', symbol: 'door.left.hand.open', target: targets?.doors_target ?? null },
    {
      type: 'interaction',
      label: 'Interactions',
      symbol: 'person.2.fill',
      target: targets?.interactions_target ?? 20,
    },
    { type: 'pitch', label: 'Pitches', symbol: 'megaphone.fill', target: targets?.pitches_target ?? 8 },
    {
      type: 'appointment',
      label: 'Appointments',
      symbol: 'calendar.badge.plus',
      target: targets?.appointments_target ?? null,
    },
  ];

  const counts = today?.counts ?? { door: 0, interaction: 0, pitch: 0, appointment: 0 };
  const rates = computeFunnel({
    doors: counts.door,
    interactions: counts.interaction,
    pitches: counts.pitch,
    appointments: counts.appointment,
  });

  const statusLabel =
    session === null
      ? 'Not started'
      : session.status === 'active'
        ? 'On the doors'
        : session.status === 'on_break'
          ? 'On break'
          : 'Day ended';

  const statusColor =
    session?.status === 'active'
      ? theme.success
      : session?.status === 'on_break'
        ? theme.warning
        : theme.textTertiary;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Work',
          headerRight: () => (
            <Link href="/work/funnel" asChild>
              <Pressable hitSlop={8}>
                <Icon name="chart.bar.fill" size={18} tintColor={theme.textSecondary} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Screen>
        {/* The clock is the screen's anchor while a session runs. */}
        <Card raised style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText type="label" themeColor="textTertiary">
              {statusLabel}
            </ThemedText>
          </View>

          {session === null ? (
            <>
              <ThemedText type="title">Knocking hours</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Start the clock when you hit the doors. Breaks pause it.
              </ThemedText>
              <Button
                title="Start work"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  startWork.mutate();
                }}
              />
            </>
          ) : (
            <>
              <ThemedText type="display">{formatElapsed(minutes)}</ThemedText>
              <ThemedText type="label" themeColor="textTertiary">
                Hours worked today
              </ThemedText>
              {session.status !== 'ended' ? (
                <View style={styles.timerButtons}>
                  <View style={styles.timerButton}>
                    <Button
                      title={session.status === 'on_break' ? 'Resume' : 'Break'}
                      variant="tinted"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        toggleBreak.mutate(session);
                      }}
                    />
                  </View>
                  <View style={styles.timerButton}>
                    <Button
                      title="End day"
                      variant="destructive"
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        endWork.mutate(session);
                      }}
                    />
                  </View>
                </View>
              ) : null}
            </>
          )}
        </Card>

        <Section title="Tap as it happens">
          <View style={styles.counterGrid}>
            {counters.map((counter) => (
              <View key={counter.type} style={styles.counterCell}>
                <CounterTile
                  label={counter.label}
                  symbol={counter.symbol}
                  count={counts[counter.type]}
                  target={counter.target}
                  onTap={() =>
                    logEvent.mutate({
                      eventType: counter.type,
                      sessionId: isLive ? session.id : null,
                    })
                  }
                />
              </View>
            ))}
          </View>
        </Section>

        {/* Today's conversion inline, so the funnel is visible without a
            detour — the full windowed view stays behind the header icon. */}
        <Section title="Today's funnel" onPress={() => router.push('/work/funnel')}>
          {counts.door === 0 ? (
            <ThemedText type="small" themeColor="textTertiary">
              Nothing logged yet today.
            </ThemedText>
          ) : (
            <View style={styles.funnel}>
              <FunnelStep label="Doors" value={counts.door} max={counts.door} rate={null} />
              <FunnelStep
                label="Interactions"
                value={counts.interaction}
                max={counts.door}
                rate={formatRate(rates.interactionRate)}
              />
              <FunnelStep
                label="Pitches"
                value={counts.pitch}
                max={counts.door}
                rate={formatRate(rates.pitchRate)}
              />
              <FunnelStep
                label="Appointments"
                value={counts.appointment}
                max={counts.door}
                rate={formatRate(rates.appointmentRate)}
              />
            </View>
          )}
        </Section>
      </Screen>
    </>
  );
}

function FunnelStep({
  label,
  value,
  max,
  rate,
}: {
  label: string;
  value: number;
  max: number;
  rate: string | null;
}) {
  return (
    <View style={styles.funnelStep}>
      <View style={styles.funnelHead}>
        <ThemedText type="label" themeColor="textTertiary" style={styles.funnelLabel}>
          {label}
        </ThemedText>
        {rate ? (
          <ThemedText type="label" themeColor="textTertiary">
            {rate}
          </ThemedText>
        ) : null}
        <ThemedText type="smallBold" style={styles.funnelValue}>
          {value}
        </ThemedText>
      </View>
      <ProgressBar
        progress={max > 0 ? value / max : 0}
        color={Domain.work}
        height={5}
        label={`${label} ${value}`}
      />
    </View>
  );
}

function CounterTile({
  label,
  symbol,
  count,
  target,
  onTap,
}: {
  label: string;
  symbol: IconName;
  count: number;
  target: number | null;
  onTap: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const hitTarget = target != null && count >= target;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add one ${label}. Currently ${count}${target ? ` of ${target}` : ''}.`}
      onPress={() => {
        scale.set(withSequence(withSpring(0.95, { damping: 20 }), withSpring(1, { damping: 12 })));
        Haptics.impactAsync(
          hitTarget ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
        );
        onTap();
      }}>
      <Animated.View
        style={[animatedStyle, styles.counterTile, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.counterHeader}>
          <Icon name={symbol} size={15} tintColor={hitTarget ? Domain.work : theme.textTertiary} />
          {hitTarget ? (
            <Icon name="checkmark.seal.fill" size={13} tintColor={theme.success} />
          ) : null}
        </View>
        <ThemedText type="metric">{count}</ThemedText>
        <ThemedText type="label" themeColor="textTertiary">
          {label}
          {target != null ? ` / ${target}` : ''}
        </ThemedText>
        {target != null ? (
          <ProgressBar
            progress={count / target}
            color={hitTarget ? theme.success : Domain.work}
            height={4}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  timerCard: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
  timerButton: {
    flex: 1,
  },
  counterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + 2,
  },
  counterCell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  counterTile: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: CornerRadius.medium,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 16,
  },
  funnel: {
    gap: Spacing.three,
  },
  funnelStep: {
    gap: Spacing.one + 2,
  },
  funnelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  funnelLabel: {
    flex: 1,
  },
  funnelValue: {
    fontVariant: ['tabular-nums'],
  },
});
