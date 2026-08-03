import * as Haptics from 'expo-haptics';
import { Link, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
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
    symbol: Parameters<typeof SymbolView>[0]['name'];
    color: string;
    target: number | null;
  }[] = [
    { type: 'door', label: 'Doors', symbol: 'door.left.hand.open', color: theme.tint, target: targets?.doors_target ?? null },
    { type: 'interaction', label: 'Interactions', symbol: 'person.2.fill', color: theme.success, target: targets?.interactions_target ?? 20 },
    { type: 'pitch', label: 'Pitches', symbol: 'megaphone.fill', color: theme.warning, target: targets?.pitches_target ?? 8 },
    { type: 'appointment', label: 'Appointments', symbol: 'calendar.badge.plus', color: '#7B68EE', target: targets?.appointments_target ?? null },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Work',
          headerRight: () => (
            <Link href="/work/funnel" asChild>
              <Pressable hitSlop={8}>
                <SymbolView name="chart.bar.fill" size={20} tintColor={theme.tint} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Screen>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={styles.timerCard}>
            {session === null ? (
              <>
                <ThemedText type="smallBold">Knocking hours</ThemedText>
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
                <View style={styles.timerHeader}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          session.status === 'active'
                            ? theme.success
                            : session.status === 'on_break'
                              ? theme.warning
                              : theme.textSecondary,
                      },
                    ]}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {session.status === 'active'
                      ? 'On the doors'
                      : session.status === 'on_break'
                        ? 'On break'
                        : 'Day ended'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.timerText}>{formatElapsed(minutes)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  hours worked today
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
        </Animated.View>

        <View style={styles.counterGrid}>
          {counters.map((counter, index) => (
            <Animated.View
              key={counter.type}
              entering={FadeInDown.duration(300).delay(60 + index * 50)}
              style={styles.counterCell}>
              <CounterCard
                label={counter.label}
                symbol={counter.symbol}
                color={counter.color}
                count={today?.counts[counter.type] ?? 0}
                target={counter.target}
                onTap={() => {
                  logEvent.mutate({ eventType: counter.type, sessionId: isLive ? session.id : null });
                }}
              />
            </Animated.View>
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Tap a card every time it happens — every door, every conversation, every pitch. The
          funnel (top right) shows where you’re leaking.
        </ThemedText>
      </Screen>
    </>
  );
}

function CounterCard({
  label,
  symbol,
  color,
  count,
  target,
  onTap,
}: {
  label: string;
  symbol: Parameters<typeof SymbolView>[0]['name'];
  color: string;
  count: number;
  target: number | null;
  onTap: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hitTarget = target != null && count >= target;

  return (
    <Pressable
      onPress={() => {
        scale.set(withSequence(withSpring(0.95, { damping: 20 }), withSpring(1, { damping: 12 })));
        Haptics.impactAsync(
          hitTarget ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
        );
        onTap();
      }}>
      <Animated.View style={animatedStyle}>
        <Card style={styles.counterCard}>
          <View style={styles.counterHeader}>
            <SymbolView name={symbol} size={16} tintColor={color} />
            {hitTarget ? (
              <SymbolView name="checkmark.seal.fill" size={14} tintColor={theme.success} />
            ) : null}
          </View>
          <ThemedText style={styles.counterValue}>{count}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {label}
            {target != null ? ` / ${target}` : ''}
          </ThemedText>
          {target != null ? (
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: hitTarget ? theme.success : color,
                    width: `${Math.min(100, (count / target) * 100)}%`,
                  },
                ]}
              />
            </View>
          ) : null}
        </Card>
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
    gap: Spacing.one + 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignSelf: 'stretch',
    marginTop: Spacing.one,
  },
  timerButton: {
    flex: 1,
  },
  counterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  counterCell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  counterCard: {
    gap: Spacing.one,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 5,
    borderRadius: CornerRadius.small,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  progressFill: {
    height: '100%',
    borderRadius: CornerRadius.small,
  },
  hint: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
});
