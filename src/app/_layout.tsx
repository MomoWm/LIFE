import NetInfo from '@react-native-community/netinfo';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, Family } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { asyncStoragePersister, queryClient } from '@/lib/query/queryClient';

// Navigation chrome (stack backgrounds, headers, tab bar defaults) follows the
// LIFE charcoal palette instead of React Navigation's stock dark theme.
const LifeTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.separator,
  },
} as const;

SplashScreen.preventAutoHideAsync();

// Let TanStack Query pause/resume fetches with real connectivity, and replay
// any mutations that queued while offline (task completions, prayer logs,
// workout sets, work-event taps — see queryClient.ts) the moment the
// connection returns, not just on the next foreground.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    const online = !!state.isConnected;
    setOnline(online);
    if (online) queryClient.resumePausedMutations();
  })
);

function RootNavigator() {
  const { session, isLoading } = useAuth();
  // Every type token names one of these families, so rendering before they
  // land would show a frame of fallback text at the wrong metrics and then
  // reflow. `error` is checked too: a font that fails to load must not hold
  // the splash screen forever — unstyled text beats a permanently blank app.
  const [fontsLoaded, fontError] = useFonts({
    [Family.regular]: require('@/assets/fonts/Archivo-400.ttf'),
    [Family.medium]: require('@/assets/fonts/Archivo-600.ttf'),
    [Family.bold]: require('@/assets/fonts/Archivo-700.ttf'),
    [Family.heavy]: require('@/assets/fonts/Archivo-800.ttf'),
  });
  const ready = !isLoading && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={LifeTheme}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
        onSuccess={() => {
          // Cold-start restore: any mutation that was paused when the app was
          // last closed is now back in the cache — replay it immediately
          // rather than waiting for its query to be refetched.
          queryClient.resumePausedMutations();
        }}>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </AuthProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}
