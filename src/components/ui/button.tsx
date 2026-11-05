import * as Haptics from '@/lib/haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { CornerRadius, Motion, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ title, onPress, variant = 'filled', disabled, loading, icon }: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const inactive = disabled || loading;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  // A big candy-colored pill is exactly what "playful" calls for — the old
  // dark theme avoided a saturated CTA on purpose, but on a warm paper ground
  // the bold tint fill is what makes the primary action feel alive.
  const backgroundColor =
    variant === 'filled'
      ? theme.tint
      : variant === 'destructive'
        ? 'transparent'
        : variant === 'tinted'
          ? theme.backgroundSelected
          : 'transparent';

  const textColor =
    variant === 'filled'
      ? theme.onTint
      : variant === 'destructive'
        ? theme.danger
        : variant === 'tinted'
          ? theme.text
          : theme.textSecondary;

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(Motion.pressScale, Motion.springPress);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, Motion.springPress);
        }}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={[
          styles.base,
          { backgroundColor },
          variant === 'destructive' && { borderWidth: 2, borderColor: theme.separator },
          variant === 'plain' && styles.plain,
          inactive && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon}
            <ThemedText type="smallBold" style={{ color: textColor }}>
              {title}
            </ThemedText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    minHeight: 48,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: CornerRadius.pill,
  },
  plain: {
    paddingHorizontal: Spacing.two,
  },
  disabled: {
    opacity: 0.4,
  },
});
