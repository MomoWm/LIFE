import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionProps = {
  /** Uppercase eyebrow. Omit for an unlabelled group. */
  title?: string;
  /** Right-aligned value or status in the header — a count, a streak, a state. */
  trailing?: ReactNode;
  /** Makes the whole header tappable and shows a chevron. */
  onPress?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * A group of related content sitting directly on the page ground — no fill, no
 * border, no elevation.
 *
 * This is the counterweight to Card. When every block on a screen is a card,
 * everything claims the same importance and the page reads as an unfinished
 * dashboard. Sections carry ordinary grouped content quietly, so the few real
 * Cards left on a screen actually mean something.
 */
export function Section({ title, trailing, onPress, children, style, contentStyle }: SectionProps) {
  const theme = useTheme();

  const header =
    title || trailing ? (
      <View style={styles.header}>
        {title ? (
          <ThemedText type="label" themeColor="textTertiary" style={styles.title}>
            {title}
          </ThemedText>
        ) : (
          <View style={styles.title} />
        )}
        {trailing}
        {onPress ? (
          <Icon name="chevron.right" size={12} weight="semibold" tintColor={theme.textTertiary} />
        ) : null}
      </View>
    ) : null;

  return (
    <View style={[styles.section, style]}>
      {header && onPress ? (
        // Layout lives on the inner View: a Pressable's style is unreliable
        // under Link asChild on web, and this header is reused in both cases.
        <Pressable onPress={onPress} accessibilityRole="button">
          {header}
        </Pressable>
      ) : (
        header
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

/** Hairline rule for separating rows *within* a section, instead of splitting them into cards. */
export function SectionDivider({ inset = 0 }: { inset?: number }) {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.separator, marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 20,
  },
  title: {
    flex: 1,
  },
  content: {
    gap: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
