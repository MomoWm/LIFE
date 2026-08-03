import { format, parseISO } from 'date-fns';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useWorkoutHistory } from '@/hooks/use-workout';
import { useTheme } from '@/hooks/use-theme';

export default function WorkoutHistoryScreen() {
  const theme = useTheme();
  const { data: sessions } = useWorkoutHistory();

  return (
    <>
      <Stack.Screen options={{ title: 'History', headerLargeTitle: false }} />
      <Screen>
        {(sessions ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No sessions yet — your logged workouts will show up here.
          </ThemedText>
        ) : null}
        {(sessions ?? []).map((session, index) => (
          <Animated.View key={session.id} entering={FadeInDown.duration(250).delay(index * 30)}>
            <Card style={styles.row}>
              <View style={[styles.dayBadge, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">{session.cycle_day}</ThemedText>
              </View>
              <View style={styles.info}>
                <ThemedText type="smallBold">{session.split_label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {format(parseISO(session.date), 'EEE, MMM d')} · {session.exerciseCount}{' '}
                  exercises · {session.setCount} sets
                </ThemedText>
              </View>
              {session.ended_at ? (
                <SymbolView name="checkmark.circle.fill" size={18} tintColor={theme.success} />
              ) : null}
            </Card>
          </Animated.View>
        ))}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dayBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 1,
  },
});
