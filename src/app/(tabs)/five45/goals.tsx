import { Link, Stack } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { differenceInCalendarDays, parseISO } from 'date-fns';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Family, Spacing } from '@/constants/theme';
import { todayIso } from '@/lib/dates';
import { isQuarterEndDue } from '@/lib/reviews/cycle';
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
          <Icon name="target" size={20} tintColor={theme.tint} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.headerText}>
            {daysLeft !== null
              ? `${daysLeft} days left in this 3-month cycle. These 4 goals show up on every day's 545.`
              : 'Set 4 goals for the next 3 months. The cycle starts when you save your first goal.'}
          </ThemedText>
        </View>

        {anchor && isQuarterEndDue(anchor.cycle_end_date, todayIso()) ? (
          <Link href="/five45/new-cycle" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <Card style={[styles.cycleBanner, { borderColor: theme.tint }]}>
                <Icon name="flag.checkered" size={18} tintColor={theme.tint} />
                <View style={styles.cycleBannerText}>
                  <ThemedText type="smallBold">Cycle ending — close the quarter</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Reflect, archive these goals, and set the next 4.
                  </ThemedText>
                </View>
                <Icon name="chevron.right" size={13} weight="semibold" tintColor={theme.textSecondary} />
              </Card>
            </Pressable>
          </Link>
        ) : null}

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
          <ThemedText type="smallBold" style={[styles.slotNumber, { color: theme.onTint }]}>
            {slot}
          </ThemedText>
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={commit}
          placeholder={`Goal ${slot}`}
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[styles.titleInput, { color: theme.text }]}
        />
      </View>
      <TextInput
        value={description}
        onChangeText={setDescription}
        onBlur={commit}
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
  cycleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
  },
  cycleBannerText: {
    flex: 1,
    gap: 1,
  },
  pressed: {
    opacity: 0.7,
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
  },
  titleInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: Family.medium,
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
