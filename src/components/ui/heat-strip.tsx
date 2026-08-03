import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type HeatCell = {
  /** 0-1 intensity, or null for a day with no data (distinct from a zero day). */
  value: number | null;
  label?: string;
};

type HeatStripProps = {
  data: HeatCell[];
  color?: string;
  /** Row of day initials under the cells — for a 7-day week view. */
  dayLabels?: string[];
  cellHeight?: number;
  /** Plain-language summary for screen readers, since color alone conveys nothing. */
  summary?: string;
};

/**
 * Consistency at a glance: one cell per day, opacity carrying intensity.
 *
 * Missing days render as an empty outline rather than a zero-value cell — "I
 * didn't log this" and "I logged zero" are different facts, and collapsing
 * them would overstate a bad week.
 */
export function HeatStrip({ data, color, dayLabels, cellHeight = 34, summary }: HeatStripProps) {
  const theme = useTheme();
  const fill = color ?? theme.tint;

  return (
    <View accessible={!!summary} accessibilityLabel={summary}>
      <View style={styles.row}>
        {data.map((cell, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              { height: cellHeight },
              cell.value == null
                ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.separator }
                : {
                    backgroundColor: fill,
                    // Floor at 0.14 so a logged-but-empty day still reads as
                    // present rather than vanishing into the ground.
                    opacity: 0.14 + cell.value * 0.86,
                  },
            ]}
          />
        ))}
      </View>
      {dayLabels ? (
        <View style={[styles.row, styles.labels]}>
          {dayLabels.map((d, i) => (
            <ThemedText key={i} type="label" themeColor="textTertiary" style={styles.dayLabel}>
              {d}
            </ThemedText>
          ))}
        </View>
      ) : null}
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
    borderRadius: 5,
  },
  labels: {
    marginTop: Spacing.one + 2,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
  },
});
