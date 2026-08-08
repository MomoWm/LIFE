import { router } from 'expo-router';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CornerRadius, Colors, Family, Spacing } from '@/constants/theme';

type Props = { children: ReactNode; onReset?: () => void };
type State = { error: Error | null };

/**
 * The backstop for every screen in the app.
 *
 * This is the actual fix for "the app goes black on save": that symptom was
 * never one bug in one screen, it was the absence of anything standing
 * between a thrown error and a blank tree. React unmounts the entire
 * subtree under whichever component throws, and with no boundary above it,
 * "entire subtree" meant everything — the whole app collapses to nothing,
 * which renders as the root charcoal background with zero content on it.
 * Indistinguishable from a crash, because it was one, just with no visible
 * trace of what happened. This class component is the trace: it catches
 * whatever local screens still manage to throw despite the local-table
 * layer's own defenses (malformed data recovering rather than throwing,
 * every mutation running through try/catch), and turns that into a real,
 * legible screen instead of silence.
 *
 * A class component because `componentDidCatch` has no hook equivalent —
 * this is the one place in the app that has to be one.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No crash reporter wired up — this is a local-first app with no
    // server to report to. Console is the only trace, and it's enough for
    // a device connected to a debugger; for everyone else the recovery
    // screen itself is the signal.
    console.error('[LIFE] Caught render error:', error, info.componentStack);
  }

  handleReload = () => {
    // A full reload is the reliable recovery — it discards whatever state
    // got the app into a throwing condition in the first place, native
    // module included. `setState` alone re-renders the same tree with the
    // same corrupted ancestor state above this boundary, which is a real
    // failure mode worth naming: this component only catches what's below
    // it, so if the throw came from something a parent holds, clearing
    // *this* component's state doesn't touch the actual cause.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    this.setState({ error: null });
    this.props.onReset?.();
  };

  handleReturnHome = () => {
    this.setState({ error: null });
    this.props.onReset?.();
    router.replace('/');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.wordmark}>LIFE</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          A screen hit an error it couldn’t recover from. Your saved data is untouched — this is
          a rendering problem, not a storage one.
        </Text>
        <Pressable style={styles.buttonPrimary} onPress={this.handleReload}>
          <Text style={styles.buttonPrimaryText}>Reload LIFE</Text>
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={this.handleReturnHome}>
          <Text style={styles.buttonSecondaryText}>Return Home</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  wordmark: {
    fontFamily: Family.heavy,
    fontSize: 15,
    letterSpacing: 3,
    color: Colors.dark.textTertiary,
    marginBottom: Spacing.four,
  },
  title: {
    fontFamily: Family.bold,
    fontSize: 22,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: Family.regular,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.four,
  },
  buttonPrimary: {
    minHeight: 48,
    paddingHorizontal: Spacing.five,
    borderRadius: CornerRadius.medium,
    backgroundColor: Colors.dark.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    fontFamily: Family.bold,
    fontSize: 16,
    color: Colors.dark.background,
  },
  buttonSecondary: {
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    fontFamily: Family.medium,
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
});
