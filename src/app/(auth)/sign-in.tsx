import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Motion, Spacing } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { continueAnonymously, sendSignInCode, verifySignInCode } from '@/lib/supabase/auth';

export default function SignInScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailStep, setEmailStep] = useState<'closed' | 'email' | 'code'>('closed');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <Card>
            <ThemedText type="subtitle">Connect Supabase</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.setupText}>
              LIFE needs a Supabase project to sync your data. Create one at supabase.com, then
              add its URL and anon key to `.env.local` (see `.env.example`) and restart the app.
            </ThemedText>
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const handleContinue = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await continueAnonymously();
      // Session listener in useAuth() picks this up and the root layout redirects.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start a session. Check your connection and try again.'
      );
      setIsSubmitting(false);
    }
  };

  const handleSendCode = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await sendSignInCode(email.trim());
      setEmailStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await verifySignInCode(email.trim(), code.trim());
      // Session listener redirects on success.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work. Check it and retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <Animated.View entering={FadeIn.duration(Motion.entry * 2)}>
          <ThemedText type="title" style={styles.wordmark}>
            LIFE
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(Motion.entry).delay(200)}
          style={styles.actions}>
          {error ? (
            <ThemedText themeColor="danger" type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          {emailStep === 'closed' ? (
            <>
              <Button
                title="Get started"
                onPress={handleContinue}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
              <Button
                title="Sign in with email"
                variant="plain"
                onPress={() => setEmailStep('email')}
                disabled={isSubmitting}
              />
            </>
          ) : null}

          {emailStep === 'email' ? (
            <>
              <TextField
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                autoFocus
              />
              <Button
                title="Send code"
                onPress={handleSendCode}
                loading={isSubmitting}
                disabled={isSubmitting || !email.includes('@')}
              />
              <Button
                title="Back"
                variant="plain"
                onPress={() => {
                  setEmailStep('closed');
                  setError(null);
                }}
                disabled={isSubmitting}
              />
            </>
          ) : null}

          {emailStep === 'code' ? (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.error}>
                Enter the 6-digit code sent to {email.trim()}.
              </ThemedText>
              <TextField
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <Button
                title="Sign in"
                onPress={handleVerifyCode}
                loading={isSubmitting}
                disabled={isSubmitting || code.trim().length < 6}
              />
              <Button
                title="Back"
                variant="plain"
                onPress={() => {
                  setEmailStep('email');
                  setError(null);
                }}
                disabled={isSubmitting}
              />
            </>
          ) : null}
        </Animated.View>
      </ThemedView>
      <View style={styles.footerSpace} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.six,
  },
  wordmark: {
    textAlign: 'center',
    fontSize: 76,
    lineHeight: 84,
    fontWeight: '800',
    letterSpacing: 18,
    // Optical centering: letter-spacing trails the final glyph, nudging the
    // wordmark left — pad it back.
    paddingLeft: 18,
  },
  actions: {
    gap: Spacing.three,
  },
  error: {
    textAlign: 'center',
  },
  setupText: {
    marginTop: Spacing.two,
  },
  footerSpace: {
    height: Spacing.six,
  },
});
