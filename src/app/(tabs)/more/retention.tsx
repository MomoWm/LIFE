import { format } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import { Stack } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatCard } from '@/components/ui/stat-card';
import { Spacing } from '@/constants/theme';
import { useLogRetentionEvent, useRetention } from '@/hooks/use-retention';
import { useTheme } from '@/hooks/use-theme';

export default function RetentionScreen() {
  const theme = useTheme();
  const { data } = useRetention();
  const logEvent = useLogRetentionEvent();

  const stats = data?.stats;
  const resets = data?.events.filter((e) => e.event_type === 'reset') ?? [];

  const confirmReset = () => {
    Alert.alert(
      'Reset streak?',
      'This logs a relapse and restarts your count from day 0. Honesty beats a fake number.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            logEvent.mutate({ eventType: 'reset' });
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Retention' }} />
      <Screen>
        {stats?.currentStreakDays === null ? (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={styles.startCard}>
              <Icon name="bolt.shield.fill" size={32} tintColor={theme.tint} />
              <ThemedText type="subtitle" style={styles.startTitle}>
                Start your streak
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.startText}>
                Day 0 starts now. The counter tracks full calendar days.
              </ThemedText>
              <Button
                title="Start tracking today"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  logEvent.mutate({ eventType: 'reset', note: 'Started tracking' });
                }}
              />
            </Card>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card style={styles.heroCard}>
                <ThemedText style={styles.heroNumber}>
                  {stats?.currentStreakDays ?? 0}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  days strong
                </ThemedText>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(60)} style={styles.statRow}>
              <StatCard
                label="Best run"
                value={String(stats?.bestStreakDays ?? 0)}
                unit="days"
                symbol="trophy.fill"
                symbolColor={theme.textSecondary}
              />
              <StatCard
                label="Resets"
                value={String(stats?.totalResets ?? 0)}
                symbol="arrow.counterclockwise"
                symbolColor={theme.textSecondary}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(120)}>
              <Button title="Log a reset" variant="destructive" onPress={confirmReset} />
            </Animated.View>

            {resets.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(300).delay(180)}>
                <Card style={styles.historyCard}>
                  <ThemedText type="smallBold">History</ThemedText>
                  {resets.slice(0, 10).map((event) => (
                    <View key={event.id} style={styles.historyRow}>
                      <Icon
                        name="arrow.counterclockwise.circle.fill"
                        size={16}
                        tintColor={theme.textSecondary}
                      />
                      <ThemedText type="small" style={styles.historyDate}>
                        {format(new Date(event.occurred_at), 'MMM d, yyyy')}
                      </ThemedText>
                      {event.note ? (
                        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                          {event.note}
                        </ThemedText>
                      ) : null}
                    </View>
                  ))}
                </Card>
              </Animated.View>
            ) : null}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  startCard: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  startTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  startText: {
    marginBottom: Spacing.one,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.one,
  },
  heroNumber: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  historyCard: {
    gap: Spacing.two,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  historyDate: {
    minWidth: 100,
  },
});
