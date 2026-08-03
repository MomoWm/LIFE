import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CornerRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatProps = {
  value: string;
  label: string;
  unit?: string;
  /** Tints the value — use a Domain hue to say which part of life this belongs to. */
  color?: string;
  size?: 'medium' | 'large';
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * A number and its label, with no container at all.
 *
 * Most figures don't need a card around them — wrapping every one in its own
 * bordered box is what flattens a screen into a grid of equal-weight tiles.
 * Sits directly in a Section or a row.
 */
export function Stat({ value, label, unit, color, size = 'medium', footer, style }: StatProps) {
  return (
    <View style={[styles.stat, style]}>
      <View style={styles.valueRow}>
        <ThemedText type={size === 'large' ? 'metric' : 'metricSmall'} style={color ? { color } : undefined}>
          {value}
        </ThemedText>
        {unit ? (
          <ThemedText type="small" themeColor="textTertiary" style={styles.unit}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="label" themeColor="textTertiary">
        {label}
      </ThemedText>
      {footer}
    </View>
  );
}

/**
 * A lightly-held stat: tonal fill, tight padding, no border.
 *
 * Between a bare Stat and a full Card — for figures that belong together as a
 * set (a 2x2 of counters) and benefit from a shared shape without each one
 * shouting.
 */
export function StatPanel({ value, label, unit, color, footer, style }: StatProps) {
  const theme = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: theme.backgroundElement }, style]}>
      <View style={styles.valueRow}>
        <ThemedText type="metricSmall" style={color ? { color } : undefined}>
          {value}
        </ThemedText>
        {unit ? (
          <ThemedText type="small" themeColor="textTertiary" style={styles.unit}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="label" themeColor="textTertiary">
        {label}
      </ThemedText>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    gap: Spacing.half,
  },
  panel: {
    flex: 1,
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: CornerRadius.medium,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one + 2,
  },
  unit: {
    marginBottom: 1,
  },
});
