import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import * as Haptics from '@/lib/haptics';

type CheckboxRowProps = {
  title: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Domain hue for the completed state — defaults to the app accent. */
  color?: string;
};

/**
 * A task row, and the app's most-repeated interaction.
 *
 * Checking something off is the moment the app is actually for, so it gets
 * more craft than anything else here: the mark overshoots and settles rather
 * than snapping, a ring flares out from it and dies, and the row leans in and
 * back. None of it is long — the whole sequence is under 500ms and the row is
 * usable again immediately, because a satisfying animation that makes you wait
 * stops being satisfying by the fourth task.
 *
 * Unchecking is deliberately plain. Celebrating an undo teaches nothing, and a
 * reward that fires either way is not a reward.
 */
export function CheckboxRow({ title, checked, onToggle, disabled, color }: CheckboxRowProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const accent = color ?? theme.success;

  const scale = useSharedValue(1);
  const burst = useSharedValue(0);
  const lean = useSharedValue(0);
  const checkedProgress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    checkedProgress.value = withTiming(checked ? 1 : 0, { duration: 180 });
    if (!checked || reduceMotion) return;

    scale.value = withSequence(
      withSpring(1.32, { damping: 9, stiffness: 320 }),
      withSpring(1, { damping: 13, stiffness: 220 })
    );
    // Reset before running — otherwise a re-check mid-flight would animate
    // backwards from wherever the ring had got to.
    burst.value = 0;
    burst.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.quad) });
    lean.value = withSequence(
      withSpring(1, { damping: 14, stiffness: 400 }),
      withDelay(40, withSpring(0, { damping: 16, stiffness: 200 }))
    );
  }, [checked, checkedProgress, scale, burst, lean, reduceMotion]);

  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.15, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.7, 2.1]) }],
  }));

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(lean.value, [0, 1], [0, 5]) }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: 1 - checkedProgress.value * 0.45,
  }));

  const handlePress = () => {
    // Completing is a success; undoing is just a selection. The two should not
    // feel the same in the hand.
    if (checked) {
      Haptics.selectionAsync();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={title}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Animated.View style={rowStyle}>
        <View style={styles.markWrap}>
          {/* Behind the mark and non-interactive, so it can overflow the row
              without ever intercepting a tap. */}
          <Animated.View
            style={[styles.burst, { borderColor: accent }, burstStyle]}
            pointerEvents="none"
          />
          <Animated.View style={markStyle}>
            <Icon
              name={checked ? 'checkmark.circle.fill' : 'circle'}
              size={26}
              tintColor={checked ? accent : theme.textSecondary}
            />
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.titleWrap, titleStyle]}>
        {/* Done state reads through the filled check and the dimmed label —
            a strikethrough on top of both is redundant and looks dated. */}
        <ThemedText themeColor={checked ? 'textTertiary' : 'text'}>{title}</ThemedText>
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
  markWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burst: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  titleWrap: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
