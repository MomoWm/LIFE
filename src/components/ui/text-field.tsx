import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { CornerRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Standard single-line input on the LIFE tonal surface. */
export function TextField({ style, ...rest }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textTertiary}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.backgroundSelected,
          borderColor: theme.separator,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: CornerRadius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
  },
});
