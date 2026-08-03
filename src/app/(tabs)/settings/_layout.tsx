import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function SettingsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: 'systemChromeMaterial',
        headerLargeTitleShadowVisible: false,
        headerTintColor: theme.tint,
        headerLargeTitleStyle: { color: theme.text },
        headerTitleStyle: { color: theme.text },
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
