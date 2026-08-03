import * as Haptics from '@/lib/haptics';
import { Icon } from '@/components/ui/icon';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CheckboxRowProps = {
  title: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function CheckboxRow({ title, checked, onToggle, disabled }: CheckboxRowProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const checkedProgress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    checkedProgress.value = withTiming(checked ? 1 : 0, { duration: 180 });
    if (checked) {
      scale.value = withSequence(withSpring(1.25, { damping: 12 }), withSpring(1, { damping: 14 }));
    }
  }, [checked, checkedProgress, scale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: 1 - checkedProgress.value * 0.45,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Animated.View style={circleStyle}>
        <Icon
          name={checked ? 'checkmark.circle.fill' : 'circle'}
          size={26}
          tintColor={checked ? theme.success : theme.textSecondary}
        />
      </Animated.View>
      <Animated.View style={[styles.titleWrap, titleStyle]}>
        <ThemedText
          style={checked && { textDecorationLine: 'line-through' }}
          themeColor={checked ? 'textSecondary' : 'text'}>
          {title}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    minHeight: 46,
  },
  titleWrap: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
