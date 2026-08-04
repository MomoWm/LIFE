import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { CornerRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  /** One line. What this becomes once it has data — not an apology for being empty. */
  body: string;
  action?: { label: string; onPress: () => void };
  /** Domain hue for the mark, so an empty section still belongs to its screen. */
  color?: string;
};

/**
 * What a section looks like before it has anything in it.
 *
 * A new install is almost entirely empty states, so they are not an edge case —
 * they are the first impression, and a grey sentence trailing off into nothing
 * ("No tasks set for today yet") is a dead end presented as a fact. Each one
 * here is a composition instead: a held mark to anchor the eye, a line saying
 * what the space becomes, and — crucially — the way to fill it, so the user
 * never has to work out which other screen to go hunting through.
 *
 * Deliberately quiet: an outlined mark rather than a filled illustration, at
 * roughly the weight of a single row, so a screen with four empty sections
 * still reads as one page rather than four billboards.
 */
export function EmptyState({ icon, title, body, action, color }: EmptyStateProps) {
  const theme = useTheme();
  const hue = color ?? theme.textTertiary;

  return (
    <View style={styles.root}>
      <View style={[styles.mark, { borderColor: hue + '55' }]}>
        <Icon name={icon} size={20} tintColor={hue} />
      </View>
      <View style={styles.copy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textTertiary">
          {body}
        </ThemedText>
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.action,
            { borderColor: theme.separator },
            pressed && { opacity: 0.6 },
          ]}>
          <ThemedText type="label">{action.label}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    // Top-aligned: centring the mark against copy that wraps to three lines
    // leaves it floating below the title it belongs to.
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    // Dashed reads as a placeholder without needing to say so.
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  action: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: CornerRadius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
  },
});
