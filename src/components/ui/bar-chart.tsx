import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BarDatum = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarDatum[];
  height?: number;
  color?: string;
  /** Formats the max-value axis hint, e.g. minutes -> "8h". */
  formatValue?: (value: number) => string;
};

/** Minimal, dependency-free bar chart. Bars scale to the max value. */
export function BarChart({ data, height = 120, color, formatValue }: BarChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const barColor = color ?? theme.tint;
  const max = Math.max(1, ...data.map((d) => d.value));

  const gap = 4;
  const barWidth = data.length > 0 ? Math.max(2, (width - gap * (data.length - 1)) / data.length) : 0;

  return (
    <View style={styles.container} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {formatValue ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.maxLabel}>
          max {formatValue(max)}
        </ThemedText>
      ) : null}
      {width > 0 ? (
        <Svg width={width} height={height}>
          {data.map((datum, i) => {
            const barHeight = Math.max(2, (datum.value / max) * (height - 4));
            return (
              <Rect
                key={`${datum.label}-${i}`}
                x={i * (barWidth + gap)}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={datum.value > 0 ? barColor : theme.backgroundSelected}
              />
            );
          })}
        </Svg>
      ) : null}
      <View style={styles.labels}>
        {data.length > 0 ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {data[0].label}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {data[data.length - 1].label}
            </ThemedText>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  maxLabel: {
    alignSelf: 'flex-end',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
