import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { sendSignInCode, verifySignInCode } from '@/lib/supabase/auth';
import { useTheme } from '@/hooks/use-theme';

type Step = 'email' | 'code';

export default function SignInScreen() {
  const theme = useTheme();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSendCode = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await sendSignInCode(email.trim());
      setStep('code');
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
      // Session listener in useAuth() picks this up and the root layout redirects.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          LIFE
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {step === 'email'
            ? 'Sign in with your email to sync your 545, prayers, workouts, and work tracking.'
            : `Enter the code we sent to ${email.trim()}.`}
        </ThemedText>

        <Card style={styles.card}>
          {step === 'email' ? (
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              style={[styles.input, { color: theme.text, borderColor: theme.separator }]}
            />
          ) : (
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
              style={[styles.input, { color: theme.text, borderColor: theme.separator }]}
            />
          )}

          {error ? (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          ) : null}

          <Button
            title={step === 'email' ? 'Send code' : 'Verify'}
            onPress={step === 'email' ? handleSendCode : handleVerifyCode}
            disabled={
              isSubmitting || (step === 'email' ? email.trim().length < 5 : code.trim().length < 6)
            }
          />

          {step === 'code' ? (
            <Button
              title="Use a different email"
              variant="plain"
              onPress={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
            />
          ) : null}
        </Card>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  setupText: {
    marginTop: Spacing.two,
  },
  card: {
    gap: Spacing.three,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
});
