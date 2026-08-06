import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CornerRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Destructive actions get the red label + haptic warning treatment. */
  destructive?: boolean;
};

/**
 * A confirm/cancel prompt, cross-platform.
 *
 * `Alert.alert` looks like it works everywhere because the API exists on
 * every platform, but react-native-web's implementation is a stub —
 * `static alert() {}` — that does nothing at all. On web, every call site
 * using it was either a dead button (nothing happens on tap) or, worse, a
 * destructive action that would have skipped confirmation entirely had it
 * been wired the other way around. This renders the same prompt with an
 * actual `Modal`, which react-native-web does implement.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow the tap so it doesn't bubble to the backdrop and dismiss
            the dialog the same instant it opens. */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {message}
            </ThemedText>
            <View style={styles.actions}>
              <View style={styles.actionFlex}>
                <Button title="Cancel" variant="tinted" onPress={onCancel} />
              </View>
              <View style={styles.actionFlex}>
                <Button
                  title={confirmLabel}
                  variant={destructive ? 'destructive' : 'filled'}
                  onPress={onConfirm}
                />
              </View>
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: 340,
    maxWidth: '100%',
    gap: Spacing.three,
    borderRadius: CornerRadius.large,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionFlex: {
    flex: 1,
  },
});
