import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * A pressable that physically depresses under the finger and springs back.
 *
 * Opacity dips read as "this element dimmed"; a scale spring reads as "this
 * element is a physical thing you pushed". Uses a spring rather than a timing
 * curve so the release overshoots very slightly, which is what makes it feel
 * responsive instead of animated.
 *
 * Layout deliberately lives on the inner Animated.View: a Pressable's style is
 * unreliable under `Link asChild` on web, which silently drops flexDirection.
 */
export function PressableScale({
  onPress,
  children,
  style,
  scaleTo = 0.975,
  disabled,
  accessibilityLabel,
}: {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 26, stiffness: 420 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 320 });
      }}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
