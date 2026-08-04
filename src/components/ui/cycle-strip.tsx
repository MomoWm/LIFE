import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CycleDay = {
  day: number;
  isRest: boolean;
  label: string;
};

/**
 * The training cycle drawn as the loop it actually is.
 *
 * "Day 3 of 8" is a fact you have to hold in your head to make sense of;
 * a strip shows where today sits in the rhythm, what is behind, and — most
 * usefully — that a rest day is coming. Rest days are hollow rather than
 * absent, because skipping a rest day is not progress.
 */
export function CycleStrip({
  days,
  currentDay,
  color,
}: {
  days: CycleDay[];
  currentDay: number | null;
  color: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={
        currentDay ? `Day ${currentDay} of ${days.length} in the training cycle` : 'Cycle not set up'
      }>
      {days.map((d) => {
        const isToday = d.day === currentDay;
        const isPast = currentDay != null && d.day < currentDay;
        return (
          <View key={d.day} style={styles.cell}>
            <View
              style={[
                styles.bar,
                d.isRest
                  ? { borderColor: theme.separator, borderWidth: StyleSheet.hairlineWidth }
                  : { backgroundColor: color, opacity: isToday ? 1 : isPast ? 0.5 : 0.18 },
                isToday && styles.today,
                isToday && { borderColor: color },
              ]}
            />
            <ThemedText
              type="label"
              themeColor={isToday ? 'text' : 'textTertiary'}
              style={styles.dayLabel}>
              {d.day}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one + 1,
  },
  bar: {
    width: '100%',
    height: 30,
    borderRadius: 6,
  },
  today: {
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
