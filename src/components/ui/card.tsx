import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { CornerRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The standard LIFE surface: a tonal step above the ground with a hairline
 * border. Depth comes from layering, never from drop shadows.
 */
export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.card, { borderColor: theme.separator }, style]}
      {...rest}
    />
  );
}

export function CardSection({ style, ...rest }: ViewProps) {
  return <View style={[styles.section, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CornerRadius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
});
