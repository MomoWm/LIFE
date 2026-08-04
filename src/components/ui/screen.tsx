import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { HeaderHeightContext } from '@react-navigation/elements';
import type { PropsWithChildren } from 'react';
import { Children, useContext } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing, WideBreakpoint } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
}>;

/** True on iPad and other wide viewports — screens use it to go two-column. */
export function useIsWide() {
  const { width } = useWindowDimensions();
  return width >= WideBreakpoint;
}

/**
 * Standard scrollable screen body. `contentInsetAdjustmentBehavior` keeps
 * content clear of a transparent header on native iOS/Android, but it's a
 * no-op on react-native-web — without it, a screen under a
 * `headerTransparent` stack (five45/prayer/work/more) renders its content
 * flush at y=0, underneath both the header and, in an installed PWA, the
 * system status bar. Read the actual rendered header height (0 when there
 * isn't one, e.g. the Home tab, which has no nested header) and pad web only;
 * native already handles it via contentInsetAdjustmentBehavior.
 *
 * A header already includes the status-bar inset in its measured height, so
 * the two paddings are alternatives, never additive: with no header — Home,
 * the one screen that opens straight onto a full-bleed hero — the safe-area
 * inset has to be applied directly or the card sits under the notch in an
 * installed PWA.
 */
export function Screen({ children, contentStyle }: ScreenProps) {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  // The tab bar floats over the scene as glass, so its height has to be paid
  // for in content padding or the last row sits permanently underneath it.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();
  const reduceMotion = useReducedMotion();
  const topPad =
    headerHeight > 0
      ? Platform.OS === 'web'
        ? headerHeight + Spacing.three
        : 0
      : insets.top + Spacing.two;

  return (
    <ScrollView
      // Transparent so the ambient wash mounted in the tabs layout shows
      // through; the ambient layer paints the base colour itself.
      style={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.outer,
        isWide && styles.outerWide,
        topPad > 0 && { paddingTop: topPad },
        { paddingBottom: tabBarHeight + Spacing.six },
      ]}>
      {/* Capped and centred so an iPad doesn't stretch a phone layout across
          1000pt of width — long measures and marooned controls are what make a
          tablet build feel like an enlarged phone. */}
      <View style={[styles.inner, isWide && styles.innerWide, contentStyle]}>
        {reduceMotion
          ? children
          : Children.map(children, (child, i) =>
              // `{cond && <X/>}` yields `false`, which renders nothing on its
              // own — but wrapped it becomes a zero-height view that still
              // claims a `gap`, opening a hole in the layout.
              child == null || typeof child === 'boolean' ? null : (
                // Capped stagger: past ~6 blocks the tail would still be
                // arriving after the eye had already reached it, which reads
                // as lag rather than composition.
                <Animated.View
                  entering={FadeInDown.springify()
                    .damping(18)
                    .delay(Math.min(i, 6) * 55)}>
                  {child}
                </Animated.View>
              )
            )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: 'transparent',
  },
  outer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    alignItems: 'center',
  },
  outerWide: {
    paddingHorizontal: Spacing.five,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  innerWide: {
    gap: Spacing.five,
  },
});
