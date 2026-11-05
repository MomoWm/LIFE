import { StyleSheet, View, type ViewProps } from 'react-native';

import { CornerRadius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  /** One tonal step forward — for the interactive/hero surface on a screen. */
  raised?: boolean;
};

/**
 * The standard LIFE surface: a flat white card lifted off the paper ground by
 * a real, soft shadow rather than a lit gradient — the "sticker" look that
 * reads as something you could pick up, not a painted panel. `raised` pushes
 * the shadow one step further, for the one hero surface on a screen.
 */
export function Card({ style, raised, children, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement },
        raised ? Shadow.raised : Shadow.resting,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

export function CardSection({ style, ...rest }: ViewProps) {
  return <View style={[styles.section, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CornerRadius.large,
    padding: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
});
