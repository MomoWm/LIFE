import * as Haptics from '@/lib/haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const backgroundColor =
    variant === 'filled'
      ? theme.tint
      : variant === 'destructive'
        ? theme.danger
        : variant === 'tinted'
          ? theme.backgroundSelected
          : 'transparent';

  const textColor =
    variant === 'filled'
      ? theme.onTint
      : variant === 'destructive'
        ? '#FFFFFF'
        : variant === 'tinted'
          ? theme.text
          : theme.tint;

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withTiming(Motion.pressScale, { duration: Motion.press });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: Motion.press });
        }}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={[
          styles.base,
          { backgroundColor },
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
    minHeight: 44,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: CornerRadius.medium,
  },
  plain: {
    paddingHorizontal: Spacing.two,
  },
  disabled: {
    opacity: 0.4,
  },
});
