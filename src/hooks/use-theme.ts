import { Colors } from '@/constants/theme';

/**
 * v1 ships dark-only by design decision (see DECISIONS.md): the LIFE identity
 * is a dark command center, and shipping one polished theme beats two
 * half-tuned ones. Swap back to `Colors[useColorScheme() ?? 'dark']` when a
 * light mode earns its place.
 */
export function useTheme() {
  return Colors.dark;
}
