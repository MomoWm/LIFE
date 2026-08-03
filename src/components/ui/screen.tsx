import { HeaderHeightContext } from '@react-navigation/elements';
import type { PropsWithChildren } from 'react';
import { useContext } from 'react';
import { Platform, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
}>;

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
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        Platform.OS === 'web' && headerHeight > 0 && { paddingTop: headerHeight + Spacing.three },
        contentStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
