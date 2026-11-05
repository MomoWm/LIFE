import { Baloo2_400Regular, Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Colors } from '@/constants/theme';
import { ensureSchemaCurrent } from '@/lib/db/local-table';
import { asyncStoragePersister, queryClient } from '@/lib/query/queryClient';

// Navigation chrome (stack backgrounds, headers, tab bar defaults) follows the
// LIFE warm-paper palette instead of React Navigation's stock light theme.
const LifeTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.separator,
  },
} as const;

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  // Every type token names one of these families, so rendering before they
  // land would show a frame of fallback text at the wrong metrics and then
  // reflow. `error` is checked too: a font that fails to load must not hold
  // the splash screen forever — unstyled text beats a permanently blank app.
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_400Regular,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
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
          <StatusBar style="dark" />
        </PersistQueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
