import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Colors, Family } from '@/constants/theme';
import { ensureSchemaCurrent } from '@/lib/db/local-table';
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

function RootNavigator() {
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
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    ensureSchemaCurrent();
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  // No auth split — LIFE is local-first with a single on-device install, so
  // the tab stack is the only screen there is.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider value={LifeTheme}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
          <RootNavigator />
          <StatusBar style="light" />
        </PersistQueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
