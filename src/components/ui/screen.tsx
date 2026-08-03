import { HeaderHeightContext } from '@react-navigation/elements';
import type { PropsWithChildren } from 'react';
import { useContext } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MaxContentWidth, Spacing, WideBreakpoint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
 */
export function Screen({ children, contentStyle }: ScreenProps) {
  const theme = useTheme();
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const isWide = useIsWide();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.outer,
        isWide && styles.outerWide,
        Platform.OS === 'web' && headerHeight > 0 && { paddingTop: headerHeight + Spacing.three },
      ]}>
      {/* Capped and centred so an iPad doesn't stretch a phone layout across
          1000pt of width — long measures and marooned controls are what make a
          tablet build feel like an enlarged phone. */}
      <View style={[styles.inner, isWide && styles.innerWide, contentStyle]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
