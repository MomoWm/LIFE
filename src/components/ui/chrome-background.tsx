import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * The material behind navigation chrome — the top tab bar and every stack
 * header.
 *
 * Chrome in this app is glass rather than a painted strip: content passes
 * beneath it and is blurred out, which keeps the surface continuous instead of
 * cutting the screen off at a hard line.
 *
 * This has to be a real element rather than an option flag. `headerBlurEffect`
 * only reaches the iOS native header; on web, `@react-navigation/native-stack`
 * falls back to the JS header, which drops that option and honours only
 * `headerTransparent` — leaving the header literally see-through, with page
 * content scrolling visibly through the title. `headerBackground` is the one
 * hook that JS header does render, so the blur has to arrive through it.
 *
 * Both chrome surfaces share it so they cannot drift apart: a header blurred
 * differently from the tab bar four inches above it reads as a rendering bug.
 *
 * The scrim over the blur is what makes it read as chrome rather than as a
 * smudge. `backdrop-filter` on web is a much thinner material than the iOS
 * `systemChromeMaterial` it is standing in for — blur alone left a legible
 * ghost of whatever had scrolled under the title. Blur carries the movement,
 * the scrim carries the opacity, and a title stays readable over any content.
 */
export function ChromeBackground({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: Colors.dark.background,
    opacity: 0.72,
  },
});
