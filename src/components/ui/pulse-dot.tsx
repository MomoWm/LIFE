import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * A dot with a slow halo behind it, for states that are genuinely live —
 * a running work timer, a prayer window that is currently open.
 *
 * Motion here is load-bearing rather than decorative: a static dot cannot
 * distinguish "the clock is running right now" from "the clock exists". The
 * halo breathes only while `active` is true, so a paused or ended session
 * goes visibly still.
 */
export function PulseDot({ color, size = 8, active = true }: { color: string; size?: number; active?: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [active, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.45 * (1 - pulse.value) : 0,
    transform: [{ scale: 1 + pulse.value * 1.9 }],
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.halo,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          haloStyle,
        ]}
      />
      <View
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
});
