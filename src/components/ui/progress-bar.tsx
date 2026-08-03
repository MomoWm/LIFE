import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  /** 0-1. Values above 1 clamp — exceeding a target fills the bar, never overflows it. */
  progress: number;
  color?: string;
  height?: number;
  /** Announced to screen readers, since a bar alone conveys nothing. */
  label?: string;
};

export function ProgressBar({ progress, color, height = 6, label }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.backgroundSelected }]}>
      <View
        style={{
          height,
          borderRadius: height / 2,
          width: `${clamped * 100}%`,
          backgroundColor: color ?? theme.tint,
        }}
      />
    </View>
  );
}

/**
 * Discrete progress — one segment per unit, for counts small enough to read at
 * a glance (the five daily prayers, days of a cycle). A segmented bar says
 * "3 of 5" without a number attached; a continuous bar can't.
 */
export function SegmentedProgress({
  total,
  filled,
  color,
  height = 4,
  label,
}: {
  total: number;
  filled: number;
  color?: string;
  height?: number;
  label?: string;
}) {
  const theme = useTheme();
  return (
    <View accessible={!!label} accessibilityLabel={label} style={styles.segments}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height,
            borderRadius: height / 2,
            backgroundColor: i < filled ? (color ?? theme.tint) : 'rgba(255,255,255,0.10)',
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
  },
});
