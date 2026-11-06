/**
 * LIFE design tokens — "playful & tactile."
 *
 * A full rewrite of the visual identity: a warm cream "paper" ground instead
 * of a dark charcoal one, bright candy-saturated domain colors instead of
 * muted jewel tones, big rounded shapes, soft tactile shadows instead of
 * lit-gradient cards (shadows need a light ground to read against — that's
 * the whole reason this flips from dark to light), and a rounded display
 * typeface instead of a sharp grotesque. Extend here rather than inlining
 * hex values or one-off fontFamily strings in components.
 *
 * Ships light-only by design, same as the previous dark-only decision: one
 * polished theme beats two half-tuned ones. The dark palette is kept in sync
 * so a future dark/night mode is a one-line change in `use-theme.ts`, not a
 * redesign.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2B2420',
    textSecondary: '#8A7F72',
    textTertiary: '#B3A99B',
    background: '#FFF9F0',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFEFD9',
    groupedBackground: '#FFF9F0',
    separator: '#F0E6D8',
    // The unfilled part of any progress indicator/ring.
    track: '#F2E9DA',
    tint: '#1FAE78',
    onTint: '#FFFFFF',
    success: '#1FAE78',
    warning: '#E8A617',
    danger: '#F0645C',
    info: '#3E9AE0',
  },
  dark: {
    text: '#F5F1E8',
    textSecondary: '#B3A99B',
    textTertiary: '#7A7064',
    background: '#211B14',
    backgroundElement: '#2C251C',
    backgroundSelected: '#3A3024',
    groupedBackground: '#211B14',
    separator: 'rgba(255, 246, 230, 0.1)',
    track: 'rgba(255, 246, 230, 0.1)',
    tint: '#34D399',
    onTint: '#0E1512',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#FB6F6F',
    info: '#38BDF8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Soft, warm, low-opacity shadows at a few depths — the "sticker/clay" lift
 * that reads as tactile instead of flat. Replaces the old gradient-lit-card
 * system (`Surface`), which existed only because shadows don't show up on a
 * dark ground; on this warm paper ground a real shadow does the job.
 */
// react-native-web renders shadowColor/Offset/Opacity/Radius fine but logs
// each as deprecated in favor of the CSS-native boxShadow; native (where
// boxShadow doesn't exist) needs the shadow*/elevation props instead. Each
// depth below picks one set per platform rather than shipping both, so
// neither platform sees a prop it would warn about or ignore.
const depth = (y: number, blur: number, opacity: number, elevation: number) =>
  Platform.OS === 'web'
    ? { boxShadow: `0px ${y}px ${blur}px rgba(107, 79, 42, ${opacity})` }
    : {
        shadowColor: '#6B4F2A',
        shadowOffset: { width: 0, height: y },
        shadowOpacity: opacity,
        shadowRadius: blur,
        elevation,
      };

export const Shadow = {
  resting: depth(4, 10, 0.1, 3),
  raised: depth(8, 18, 0.14, 6),
  pressed: depth(2, 5, 0.08, 1),
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: 'ui-serif, Georgia, serif',
    rounded: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Big and round, on purpose — the single biggest lever on "playful" vs
 * "instrument." `pill` is new: fully-rounded chips, tags and small buttons.
 */
export const CornerRadius = {
  small: 14,
  medium: 20,
  large: 28,
  xlarge: 36,
  pill: 999,
} as const;

/**
 * Domain hues, bumped to full candy saturation — a big jump up from the old
 * desaturated jewel tones. Each screen owns one, so a glance at a ring or
 * chart says which part of life it belongs to before any label is read.
 */
export const Domain = {
  routine: '#2BC98B', // mint — completion
  prayer: '#8186F3', // periwinkle
  work: '#FFA53D', // tangerine
  training: '#C073F5', // grape
  sleep: '#39B6F5', // sky
} as const;

/** Breakpoint above which layouts may use two columns (iPad and wider). */
export const WideBreakpoint = 700;

/**
 * The app's voice: two rounded Google families instead of one sharp
 * grotesque. Baloo 2 — a chunky, bubbly display face — carries headlines,
 * hero numbers and short UI chrome (tab labels, eyebrows, badges); Nunito —
 * a warm, easy-reading rounded text face — carries body copy, which Baloo 2
 * gets mushy at. Shipped as static weights (not variable) because the same
 * constraint as before applies: native needs TTF, and Google only serves
 * statics as TTF.
 */
export const Family = {
  regular: 'Baloo2_400Regular',
  medium: 'Baloo2_600SemiBold',
  bold: 'Baloo2_700Bold',
  heavy: 'Baloo2_800ExtraBold',
} as const;

/** Body-copy counterpart to `Family` — used only by the `Type.body`/`small`/`smallBold` roles. */
export const BodyFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
} as const;

/**
 * Type scale. Display sizes keep a little negative tracking so Baloo 2's
 * width doesn't sprawl at hero sizes; small caps keep positive tracking so
 * they don't feel cramped. Nothing here needs Archivo's aggressive negative
 * tracking — a rounded face is meant to feel open, not engineered.
 */
export const Type = {
  /** Screen-owning number: today's score, a streak count. */
  display: { fontSize: 60, lineHeight: 67, fontFamily: Family.heavy, letterSpacing: -1 },
  /** Secondary hero metric inside a card. */
  metric: { fontSize: 38, lineHeight: 44, fontFamily: Family.bold, letterSpacing: -0.6 },
  /** Compact metric for dense panels and inline stats. */
  metricSmall: { fontSize: 25, lineHeight: 31, fontFamily: Family.bold, letterSpacing: -0.3 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: Family.bold, letterSpacing: -0.3 },
  subtitle: { fontSize: 20, lineHeight: 26, fontFamily: Family.medium, letterSpacing: -0.1 },
  body: { fontSize: 16, lineHeight: 24, fontFamily: BodyFamily.regular, letterSpacing: 0 },
  small: { fontSize: 14, lineHeight: 20, fontFamily: BodyFamily.regular, letterSpacing: 0 },
  smallBold: { fontSize: 14, lineHeight: 20, fontFamily: BodyFamily.bold, letterSpacing: 0 },
  /** Uppercase section/eyebrow label. */
  label: { fontSize: 12, lineHeight: 15, fontFamily: Family.bold, letterSpacing: 1 },
} as const;

/**
 * Motion. Springy and a little overshot — "squish and pop" instead of a
 * linear ease. Every primitive's press/entry animation should pull its
 * config from here rather than hand-rolling spring numbers.
 */
export const Motion = {
  /** Press-in/out spring — snappy, slightly bouncy settle. */
  springPress: { damping: 14, stiffness: 260, mass: 0.6 },
  /** Entry/pop-in spring — more overshoot, feels like it bounced into place. */
  springEntry: { damping: 11, stiffness: 180, mass: 0.7 },
  /** Scale applied to pressables while pressed. */
  pressScale: 0.94,
  /** Non-spring fallback duration (ms), for things that must not bounce (progress fills). */
  fill: 650,
} as const;

/**
 * The widest the content column is ever allowed to get — a single-column
 * reading width so the page looks composed and deliberately narrow on a
 * tablet, not filled edge-to-edge.
 */
export const MaxContentWidth = 620;

/**
 * The cap when a wide screen goes two-column. Two columns of roughly the
 * single-column measure, plus the gutter between them.
 */
export const WideColumnWidth = 1000;
