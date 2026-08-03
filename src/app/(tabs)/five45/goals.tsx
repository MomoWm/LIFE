import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { differenceInCalendarDays, parseISO } from 'date-fns';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
import { useActiveGoals, useSaveGoal } from '@/hooks/use-five45';
import { useTheme } from '@/hooks/use-theme';

export default function GoalsScreen() {
  const theme = useTheme();
  const { data: goals } = useActiveGoals();
  const saveGoal = useSaveGoal();

  const anchor = goals?.[0];
  const daysLeft = anchor
    ? Math.max(0, differenceInCalendarDays(parseISO(anchor.cycle_end_date), new Date()))
    : null;

  return (
    <>
      <Stack.Screen options={{ title: '4 Goals', headerLargeTitle: false }} />
      <Screen>
        <View style={styles.headerRow}>
          <SymbolView name="target" size={20} tintColor={theme.tint} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.headerText}>
            {daysLeft !== null
              ? `${daysLeft} days left in this 3-month cycle. These 4 goals show up on every day's 545.`
              : 'Set 4 goals for the next 3 months. The cycle starts when you save your first goal.'}
          </ThemedText>
        </View>

        {[1, 2, 3, 4].map((slot) => {
          const goal = goals?.find((g) => g.slot === slot);
          return (
            <GoalSlot
              key={`${slot}-${goal?.id ?? 'empty'}`}
              slot={slot}
              initialTitle={goal?.title ?? ''}
              initialDescription={goal?.description ?? ''}
              onSave={(title, description) => saveGoal.mutate({ slot, title, description })}
            />
          );
        })}
      </Screen>
    </>
  );
}

function GoalSlot({
  slot,
  initialTitle,
  initialDescription,
  onSave,
}: {
  slot: number;
  initialTitle: string;
  initialDescription: string;
  onSave: (title: string, description: string) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const commit = () => {
    if (title.trim() !== initialTitle.trim() || description.trim() !== initialDescription.trim()) {
      onSave(title, description);
    }
  };

  return (
    <Card style={styles.goalCard}>
      <View style={styles.slotRow}>
        <View style={[styles.slotBadge, { backgroundColor: theme.tint }]}>
          <ThemedText type="smallBold" style={styles.slotNumber}>
            {slot}
          </ThemedText>
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          onEndEditing={commit}
          placeholder={`Goal ${slot}`}
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[styles.titleInput, { color: theme.text }]}
        />
      </View>
      <TextInput
        value={description}
        onChangeText={setDescription}
        onEndEditing={commit}
        placeholder="Why it matters / what done looks like…"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[
          styles.descriptionInput,
          { color: theme.textSecondary, borderColor: theme.separator },
        ]}
      />
    </Card>
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
  goalCard: {
    gap: Spacing.two,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  slotBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotNumber: {
    color: '#fff',
  },
  titleInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: Spacing.one,
  },
  descriptionInput: {
    fontSize: 14,
    lineHeight: 19,
    minHeight: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    borderRadius: CornerRadius.small,
  },
});
