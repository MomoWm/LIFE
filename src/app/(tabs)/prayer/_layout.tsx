import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/constants/navigation';
import { useTheme } from '@/hooks/use-theme';

export default function PrayerLayout() {
  const theme = useTheme();
  return <Stack screenOptions={stackScreenOptions(theme)} />;
}
