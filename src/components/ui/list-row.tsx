import { Icon } from '@/components/ui/icon';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  showChevron,
  onPress,
  destructive,
}: ListRowProps) {
  const theme = useTheme();
  const content = (
    <View style={styles.row}>
      {leading}
      <View style={styles.textColumn}>
        <ThemedText themeColor={destructive ? 'danger' : 'text'}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing}
      {showChevron ? (
        <Icon name="chevron.right" size={14} weight="semibold" tintColor={theme.textSecondary} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
