import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

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
 */
export function stackScreenOptions(theme: Theme): NativeStackNavigationOptions {
  return {
    headerLargeTitle: true,
    headerTransparent: true,
    headerBlurEffect: 'systemChromeMaterial',
    headerLargeTitleShadowVisible: false,
    headerTintColor: theme.tint,
    headerLargeTitleStyle: { color: theme.text, fontFamily: Family.heavy },
    headerTitleStyle: { color: theme.text, fontFamily: Family.bold },
    contentStyle: { backgroundColor: 'transparent' },
  };
}
