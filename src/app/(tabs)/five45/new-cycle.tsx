import { format, parseISO } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import { Stack, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
import { useActiveGoals } from '@/hooks/use-five45';
import { useCompleteQuarter } from '@/hooks/use-reviews';
import { useTheme } from '@/hooks/use-theme';

export default function NewCycleScreen() {
  const theme = useTheme();
  const { data: goals } = useActiveGoals();
  const completeQuarter = useCompleteQuarter();
  const [reflection, setReflection] = useState('');

  const anchor = goals?.[0];

  return (
    <>
      <Stack.Screen options={{ title: 'Close the Quarter', headerLargeTitle: false }} />
      <Screen>
        {anchor ? (
          <>
            <View style={styles.headerRow}>
              <Icon name="flag.checkered" size={20} tintColor={theme.tint} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.headerText}>
                Cycle {format(parseISO(anchor.cycle_start_date), 'MMM d')} –{' '}
                {format(parseISO(anchor.cycle_end_date), 'MMM d')}. Closing archives these 4 goals
                and opens fresh slots for the next 3 months.
              </ThemedText>
            </View>

            <Card style={styles.goalsCard}>
              {(goals ?? []).map((goal) => (
                <View key={goal.id} style={styles.goalRow}>
                  <View style={[styles.slotBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="smallBold">{goal.slot}</ThemedText>
                  </View>
                  <ThemedText style={styles.goalTitle}>{goal.title}</ThemedText>
                </View>
              ))}
            </Card>

            <Card style={styles.reflectionCard}>
              <ThemedText type="smallBold">Quarter retrospective</ThemedText>
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                placeholder="Which goals landed? Which didn't, and why? What changes next quarter…"
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[styles.reflectionInput, { color: theme.text, borderColor: theme.separator }]}
              />
            </Card>

            <Button
              title="Complete cycle & set new goals"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                completeQuarter.mutate(
                  { reflection, activeGoals: goals ?? [] },
                  {
                    onSuccess: () => router.replace('/five45/goals'),
                  }
                );
              }}
            />
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No active goal cycle — set your 4 goals first.
          </ThemedText>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  goalsCard: {
    gap: Spacing.two,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  slotBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    flex: 1,
  },
  reflectionCard: {
    gap: Spacing.two,
  },
  reflectionInput: {
    fontSize: 15,
    lineHeight: 20,
    minHeight: 90,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: CornerRadius.small + 2,
    padding: Spacing.two + 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
