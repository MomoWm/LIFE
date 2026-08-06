import { HeaderHeightContext } from '@react-navigation/elements';
import type { PropsWithChildren, ReactNode } from 'react';
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

import { MaxContentWidth, Spacing, WideBreakpoint, WideColumnWidth } from '@/constants/theme';

const TAB_BAR_HEIGHT = 48;

type ScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * `columns` lets a wide screen use its width instead of leaving the bottom
   * half empty: the first block stays full width as the header, and the rest
   * split into two columns.
   *
   * Opt-in per screen rather than automatic, because it is only correct where
   * blocks are independent. On a screen read in order — morning tasks, then
   * goals, then evening tasks — two columns break the sequence, and a checklist
   * that reads down-then-across is worse than one that just leaves space.
   */
  wideLayout?: 'single' | 'columns';
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
export function Screen({ children, contentStyle, wideLayout = 'single' }: ScreenProps) {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();
  const reduceMotion = useReducedMotion();
  // The tab bar sits at the top of the screen and takes real layout space, so
  // content must always clear it. On web, the stack's own transparent header
  // also needs padding.
  const topPad = TAB_BAR_HEIGHT + (headerHeight > 0 && Platform.OS === 'web' ? headerHeight + Spacing.three : 0);

  // `{cond && <X/>}` yields `false`, which renders nothing on its own — but
  // wrapped for animation it becomes a zero-height view that still claims a
  // `gap`, opening a hole in the layout. Drop those before doing anything else
  // so column-splitting counts real blocks, not placeholders.
  const blocks = Children.toArray(children).filter(
    (child) => child != null && typeof child !== 'boolean'
  );

  const animate = (child: ReactNode, i: number) =>
    reduceMotion ? (
      child
    ) : (
      // Capped stagger: past ~6 blocks the tail would still be arriving after
      // the eye had already reached it, which reads as lag rather than
      // composition.
      <Animated.View
        entering={FadeInDown.springify()
          .damping(18)
          .delay(Math.min(i, 6) * 55)}>
        {child}
      </Animated.View>
    );

  const twoColumn = isWide && wideLayout === 'columns' && blocks.length > 2;
  // The first block is the hero and spans both columns. The rest split
  // sequentially rather than alternating: columns read down and then across,
  // like newspaper columns, instead of zig-zagging between them. Alternating
  // also balanced worse in practice — it puts every other block in the same
  // column regardless of size, so one tall block among short ones lands on a
  // side that was already the longer of the two.
  const [lead, ...rest] = blocks;
  const split = Math.ceil(rest.length / 2);
  const left = rest.slice(0, split);
  const right = rest.slice(split);

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
        // Nothing floats over the bottom any more; the home indicator still
        // needs clearing on a gesture-nav phone.
        { paddingBottom: insets.bottom + Spacing.six },
      ]}>
      {/* Capped and centred so an iPad doesn't stretch a phone layout across
          1000pt of width — long measures and marooned controls are what make a
          tablet build feel like an enlarged phone. */}
      <View
        style={[
          styles.inner,
          isWide && styles.innerWide,
          twoColumn && styles.innerColumns,
          contentStyle,
        ]}>
        {twoColumn ? (
          <>
            {animate(lead, 0)}
            <View style={styles.columns}>
              <View style={styles.column}>{left.map((c, i) => animate(c, i + 1))}</View>
              <View style={styles.column}>{right.map((c, i) => animate(c, split + i + 1))}</View>
            </View>
          </>
        ) : (
          blocks.map((child, i) => animate(child, i))
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
  innerColumns: {
    // Two columns need roughly twice the single-column measure; capping at the
    // reading width would just squeeze both halves.
    maxWidth: WideColumnWidth,
  },
  columns: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  column: {
    flex: 1,
    gap: Spacing.five,
  },
});
