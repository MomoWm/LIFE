import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'display' | 'metric' | 'metricSmall' | 'title' | 'subtitle' | 'small' | 'smallBold' | 'label';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'display' && styles.display,
        type === 'metric' && styles.metric,
        type === 'metricSmall' && styles.metricSmall,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'label' && styles.label,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Hero numerals are always tabular so a ticking counter never reflows.
  display: { ...Type.display, fontVariant: ['tabular-nums'] },
  metric: { ...Type.metric, fontVariant: ['tabular-nums'] },
  metricSmall: { ...Type.metricSmall, fontVariant: ['tabular-nums'] },
  title: Type.title,
  subtitle: Type.subtitle,
  default: Type.body,
  small: Type.small,
  smallBold: Type.smallBold,
  label: { ...Type.label, textTransform: 'uppercase' },
});
