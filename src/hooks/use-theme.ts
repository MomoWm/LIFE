import { Colors } from '@/constants/theme';

/**
 * Ships light-only by design: the LIFE identity is now a warm, playful paper
 * surface, and shipping one polished theme beats two half-tuned ones. Swap
 * back to `Colors[useColorScheme() ?? 'light']` when a dark mode earns its
 * place.
 */
export function useTheme() {
  return Colors.light;
}
