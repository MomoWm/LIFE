import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CornerRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
};

export function Button({ title, onPress, variant = 'filled', disabled, icon }: ButtonProps) {
  const theme = useTheme();

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
          ? theme.backgroundElement
          : 'transparent';

  const textColor = variant === 'filled' || variant === 'destructive' ? '#ffffff' : theme.tint;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor },
        variant === 'plain' && styles.plain,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      {icon}
      <ThemedText type="smallBold" style={{ color: textColor }}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
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
  pressed: {
    opacity: 0.75,
  },
});
