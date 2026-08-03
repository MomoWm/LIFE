import { addDays, format } from 'date-fns';
import * as Haptics from '@/lib/haptics';
import { Link, Stack } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
import { SPLIT, splitForDay } from '@/lib/workout/split';
import {
  useAddExerciseEntry,
  useAddSet,
  useEndSession,
  useExerciseCatalog,
  useSetCycleStart,
  useStartSession,
  useWorkoutToday,
  type SessionEntry,
} from '@/hooks/use-workout';
import { useTheme } from '@/hooks/use-theme';

export default function WorkoutScreen() {
  const theme = useTheme();
  const { data: today } = useWorkoutToday();
  const setCycleStart = useSetCycleStart();
  const startSession = useStartSession();

  const cycleDay = today?.cycleDay ?? null;
  const split = cycleDay ? splitForDay(cycleDay) : null;
  const session = today?.session ?? null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Workout',
          headerRight: () => (
            <Link href="/trackers/workout/history" asChild>
              <Pressable hitSlop={8}>
                <Icon name="clock.arrow.circlepath" size={20} tintColor={theme.tint} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Screen>
        {cycleDay === null ? (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={styles.setupCard}>
              <Icon name="dumbbell.fill" size={30} tintColor={theme.success} />
              <ThemedText type="subtitle" style={styles.setupTitle}>
                Start your 8-day cycle
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Chest/Shoulders/Triceps → Back/Biceps → Legs → Rest → Arms → Back & Chest → Legs →
                Rest, repeating forever. Pick which day today is:
              </ThemedText>
              <View style={styles.dayPicker}>
                {SPLIT.map((day) => (
                  <Pressable
                    key={day.day}
                    onPress={() => {
                      Haptics.selectionAsync();
                      // Anchor the cycle so that today lands on the chosen day.
                      const start = format(addDays(new Date(), -(day.day - 1)), 'yyyy-MM-dd');
                      setCycleStart.mutate(start);
                    }}
                    style={[styles.dayChip, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="smallBold">Day {day.day}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {day.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </Card>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card style={styles.todayCard}>
                <View style={styles.todayHeader}>
                  <View style={[styles.dayBadge, { backgroundColor: split?.isRest ? theme.backgroundSelected : theme.success }]}>
                    <ThemedText type="smallBold" style={{ color: split?.isRest ? theme.textSecondary : '#fff' }}>
                      Day {cycleDay}
                    </ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={styles.splitLabel}>
                    {split?.label}
                  </ThemedText>
                </View>
                {split?.isRest ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Rest day — recovery is where the muscle gets built. Next up:{' '}
                    {splitForDay((cycleDay % 8) + 1).label}.
                  </ThemedText>
                ) : session ? null : (
                  <Button
                    title="Start session"
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      startSession.mutate({ cycleDay });
                    }}
                  />
                )}
              </Card>
            </Animated.View>

            {session ? <ActiveSession session={session} muscleGroups={split?.muscleGroups ?? []} /> : null}
          </>
        )}
      </Screen>
    </>
  );
}

function ActiveSession({
  session,
  muscleGroups,
}: {
  session: NonNullable<ReturnType<typeof useWorkoutToday>['data']>['session'] & object;
  muscleGroups: string[];
}) {
  const theme = useTheme();
  const { data: catalog } = useExerciseCatalog();
  const addEntry = useAddExerciseEntry();
  const endSession = useEndSession();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!session) return null;

  const usedExerciseIds = new Set(session.entries.map((e) => e.exercise.id));
  const relevant = (catalog ?? []).filter(
    (e) => !usedExerciseIds.has(e.id) && (muscleGroups.length === 0 || muscleGroups.includes(e.muscle_group ?? ''))
  );
  const others = (catalog ?? []).filter(
    (e) => !usedExerciseIds.has(e.id) && muscleGroups.length > 0 && !muscleGroups.includes(e.muscle_group ?? '')
  );

  return (
    <>
      {session.entries.map((entry, index) => (
        <Animated.View key={entry.id} entering={FadeInDown.duration(250).delay(index * 40)}>
          <ExerciseCard entry={entry} />
        </Animated.View>
      ))}

      <Card style={styles.addCard}>
        <Pressable
          onPress={() => setPickerOpen((open) => !open)}
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}>
          <Icon name={pickerOpen ? 'chevron.down' : 'plus.circle.fill'} size={20} tintColor={theme.tint} />
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Add exercise
          </ThemedText>
        </Pressable>
        {pickerOpen ? (
          <View style={styles.pickerList}>
            {[...relevant, ...others].map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPickerOpen(false);
                  addEntry.mutate({
                    sessionId: session.id,
                    exerciseId: exercise.id,
                    position: session.entries.length + 1,
                  });
                }}
                style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}>
                <ThemedText>{exercise.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {exercise.muscle_group}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Card>

      {session.entries.length > 0 && !session.ended_at ? (
        <Button
          title="Finish workout"
          variant="tinted"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            endSession.mutate(session.id);
          }}
        />
      ) : null}
      {session.ended_at ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.doneNote}>
          Session finished at {format(new Date(session.ended_at), 'h:mm a')} — see you tomorrow.
        </ThemedText>
      ) : null}
    </>
  );
}

function ExerciseCard({ entry }: { entry: SessionEntry }) {
  const theme = useTheme();
  const addSet = useAddSet();
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const lastSet = entry.sets[entry.sets.length - 1];

  return (
    <Card style={styles.exerciseCard}>
      <Link href={{ pathname: '/trackers/workout/exercise/[id]', params: { id: entry.exercise.id } }} asChild>
        <Pressable style={({ pressed }) => [styles.exerciseHeader, pressed && styles.pressed]}>
          <ThemedText type="smallBold">{entry.exercise.name}</ThemedText>
          <Icon name="chart.xyaxis.line" size={16} tintColor={theme.tint} />
        </Pressable>
      </Link>

      {entry.sets.map((set) => (
        <View key={set.id} style={styles.setRow}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.setNumber}>
            Set {set.set_number}
          </ThemedText>
          <ThemedText type="small">
            {set.reps} reps{set.weight != null ? ` × ${set.weight} ${set.weight_unit}` : ''}
          </ThemedText>
        </View>
      ))}

      <View style={styles.addSetRow}>
        <TextInput
          value={reps}
          onChangeText={setReps}
          placeholder={lastSet ? String(lastSet.reps) : 'reps'}
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          style={[styles.setInput, { color: theme.text, borderColor: theme.separator }]}
        />
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder={lastSet?.weight != null ? String(lastSet.weight) : 'lb'}
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          style={[styles.setInput, { color: theme.text, borderColor: theme.separator }]}
        />
        <Pressable
          onPress={() => {
            const parsedReps = parseInt(reps || (lastSet ? String(lastSet.reps) : ''), 10);
            if (!Number.isFinite(parsedReps) || parsedReps <= 0) return;
            const parsedWeight = parseFloat(weight || (lastSet?.weight != null ? String(lastSet.weight) : ''));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            addSet.mutate({
              entryId: entry.id,
              setNumber: (lastSet?.set_number ?? 0) + 1,
              reps: parsedReps,
              weight: Number.isFinite(parsedWeight) ? parsedWeight : null,
            });
            setReps('');
            setWeight('');
          }}
          style={({ pressed }) => [
            styles.addSetButton,
            { backgroundColor: theme.tint },
            pressed && styles.pressed,
          ]}>
          <Icon name="plus" size={16} tintColor="#fff" />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  setupCard: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  setupTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  dayPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  dayChip: {
    borderRadius: CornerRadius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two + 2,
    width: '47%',
    gap: 1,
  },
  todayCard: {
    gap: Spacing.two,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dayBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: CornerRadius.small,
  },
  splitLabel: {
    fontSize: 20,
    lineHeight: 26,
    flex: 1,
  },
  addCard: {
    gap: Spacing.two,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pickerList: {
    gap: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  exerciseCard: {
    gap: Spacing.two,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  setNumber: {
    width: 44,
  },
  addSetRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  setInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: CornerRadius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    fontSize: 15,
    textAlign: 'center',
  },
  addSetButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneNote: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
