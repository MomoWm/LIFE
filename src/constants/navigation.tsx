import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { ChromeBackground } from '@/components/ui/chrome-background';
import { Colors, Family } from '@/constants/theme';

type Theme = typeof Colors.dark;

/**
 * The one set of stack options every route group uses.
 *
 * Home, Routine, Prayer, Work and More each nest a stack, and all four were
 * carrying a verbatim copy of this object — so a change to the app's header
 * treatment meant four identical edits, and any one of them being missed
 * showed up as a screen whose header did not match the rest of the app.
 *
 * Headers are transparent over blur so content scrolls beneath them, matching
 * the tab bar at the other end of the screen; both title styles name the
 * app's own families, since navigation chrome does not inherit the app's
 * typography the way ThemedText does.
 *
 * The blur is specified twice because the two platforms take it by different
 * routes, and neither route covers both. `headerBlurEffect` reaches only the
 * iOS native header; on web, native-stack falls back to the JS header from
 * `@react-navigation/elements`, which ignores that option entirely and applies
 * `headerTransparent` literally — so the header rendered as clear glass with
 * no glass in it, and every screen's content scrolled visibly through its own
 * title. `headerBackground` is the hook that JS header does honour, and the
 * iOS native header ignores it, so the two never both apply.
 */
export function stackScreenOptions(theme: Theme): NativeStackNavigationOptions {
  return {
    headerLargeTitle: true,
    headerTransparent: true,
    headerBlurEffect: 'systemChromeMaterial',
    headerBackground: () => <ChromeBackground />,
    headerLargeTitleShadowVisible: false,
    headerTintColor: theme.tint,
    headerLargeTitleStyle: { color: theme.text, fontFamily: Family.heavy },
    headerTitleStyle: { color: theme.text, fontFamily: Family.bold },
    contentStyle: { backgroundColor: 'transparent' },
  };
}
