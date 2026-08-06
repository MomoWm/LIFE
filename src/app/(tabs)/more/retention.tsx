import { format } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import { Stack } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { Section, SectionDivider } from '@/components/ui/section';
import { Stat } from '@/components/ui/stat';
import { Domain, Spacing } from '@/constants/theme';
import { useLogRetentionEvent, useRetention } from '@/hooks/use-retention';
import { useTheme } from '@/hooks/use-theme';

export default function RetentionScreen() {
  const theme = useTheme();
  const { data } = useRetention();
  const logEvent = useLogRetentionEvent();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const stats = data?.stats;
  const resets = data?.events.filter((e) => e.event_type === 'reset') ?? [];

  const handleReset = () => {
    setConfirmingReset(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logEvent.mutate({ eventType: 'reset' });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Discipline' }} />
      <Screen>
        {stats?.currentStreakDays === null ? (
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
        ) : (
          <>
            <Card raised style={styles.heroCard}>
              <ThemedText type="display">{stats?.currentStreakDays ?? 0}</ThemedText>
              <ThemedText type="label" themeColor="textTertiary">
                days strong
              </ThemedText>
            </Card>

            <Section title="All time">
              <View style={styles.statRow}>
                <Stat
                  value={String(stats?.bestStreakDays ?? 0)}
                  label="Best run"
                  unit="d"
                  color={Domain.routine}
                />
                <Stat value={String(stats?.totalResets ?? 0)} label="Resets" />
              </View>
            </Section>

            <Button
              title="Log a reset"
              variant="destructive"
              onPress={() => setConfirmingReset(true)}
            />

            {resets.length > 0 ? (
              <Section title="History" contentStyle={styles.historyList}>
                {resets.slice(0, 10).map((event, i) => (
                  <View key={event.id}>
                    {i > 0 ? <SectionDivider /> : null}
                    <View style={styles.historyRow}>
                      <ThemedText type="small" style={styles.historyDate}>
                        {format(new Date(event.occurred_at), 'MMM d, yyyy')}
                      </ThemedText>
                      {event.note ? (
                        <ThemedText
                          type="small"
                          themeColor="textTertiary"
                          numberOfLines={1}
                          style={styles.historyNote}>
                          {event.note}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                ))}
              </Section>
            ) : null}
          </>
        )}
      </Screen>
      <ConfirmDialog
        visible={confirmingReset}
        title="Reset streak?"
        message="This logs a relapse and restarts your count from day 0. Honesty beats a fake number."
        confirmLabel="Reset"
        destructive
        onConfirm={handleReset}
        onCancel={() => setConfirmingReset(false)}
      />
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
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  historyList: {
    gap: 0,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  historyDate: {
    minWidth: 104,
  },
  historyNote: {
    flex: 1,
  },
});
