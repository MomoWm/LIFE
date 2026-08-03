import { format, parseISO } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import { Stack, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
import { todayIso } from '@/lib/dates';
import { weekStartIso } from '@/lib/reviews/cycle';
import { useActiveGoals } from '@/hooks/use-five45';
import { useSaveWeeklyReview, useThisWeeksReview } from '@/hooks/use-reviews';
import { useTheme } from '@/hooks/use-theme';

export default function WeeklyReviewScreen() {
  const theme = useTheme();
  const { data: goals } = useActiveGoals();
  const { data: existing } = useThisWeeksReview();
  const save = useSaveWeeklyReview();

  const [reflection, setReflection] = useState(existing?.reflection ?? '');
  const [ratings, setRatings] = useState<Record<string, number | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const weekLabel = format(parseISO(weekStartIso(todayIso())), 'MMM d');

  return (
    <>
      <Stack.Screen options={{ title: 'Weekly Review', headerLargeTitle: false }} />
      <Screen>
        <ThemedText type="small" themeColor="textSecondary">
          Week of {weekLabel}. Score each goal honestly — did it actually move this week?
        </ThemedText>

        {existing?.completed_at ? (
          <Card style={styles.doneBanner}>
            <Icon name="checkmark.seal.fill" size={18} tintColor={theme.success} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.doneText}>
              Already completed this week — saving again overwrites it.
            </ThemedText>
          </Card>
        ) : null}

        {(goals ?? []).map((goal) => (
          <Card key={goal.id} style={styles.goalCard}>
            <ThemedText type="smallBold">{goal.title}</ThemedText>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const current = ratings[goal.id] ?? null;
                return (
                  <Pressable
                    key={star}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setRatings((prev) => ({
                        ...prev,
                        [goal.id]: prev[goal.id] === star ? null : star,
                      }));
                    }}
                    hitSlop={4}>
                    <Icon
                      name={current != null && star <= current ? 'star.fill' : 'star'}
                      size={24}
                      tintColor={current != null && star <= current ? theme.tint : theme.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={notes[goal.id] ?? ''}
              onChangeText={(text) => setNotes((prev) => ({ ...prev, [goal.id]: text }))}
              placeholder="What moved? What's blocked?"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.noteInput, { color: theme.text, borderColor: theme.separator }]}
            />
          </Card>
        ))}

        <Card style={styles.reflectionCard}>
          <ThemedText type="smallBold">The week overall</ThemedText>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="Wins, misses, and the one thing to fix next week…"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.reflectionInput, { color: theme.text, borderColor: theme.separator }]}
          />
        </Card>

        <Button
          title="Save review"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            save.mutate(
              {
                reflection,
                checkins: (goals ?? []).map((goal) => ({
                  goalId: goal.id,
                  rating: ratings[goal.id] ?? null,
                  progressNote: notes[goal.id] ?? '',
                })),
              },
              { onSuccess: () => router.back() }
            );
          }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  doneText: {
    flex: 1,
  },
  goalCard: {
    gap: Spacing.two,
  },
  starRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  noteInput: {
    fontSize: 14,
    lineHeight: 19,
    minHeight: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  reflectionCard: {
    gap: Spacing.two,
  },
  reflectionInput: {
    fontSize: 15,
    lineHeight: 20,
    minHeight: 80,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: CornerRadius.small + 2,
    padding: Spacing.two + 2,
  },
});
