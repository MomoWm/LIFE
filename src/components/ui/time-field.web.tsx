import { unstable_createElement } from 'react-native-web';

import { useTheme } from '@/hooks/use-theme';

import type { TimeFieldProps } from './time-field';

export function TimeField({ value, onChange }: TimeFieldProps) {
  const theme = useTheme();
  const hhmm = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;

  return unstable_createElement('input', {
    type: 'time',
    value: hhmm,
    onChange: (event: { target: { value: string } }) => {
      const [hours, minutes] = event.target.value.split(':').map((part) => parseInt(part, 10));
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const next = new Date(value);
        next.setHours(hours, minutes, 0, 0);
        onChange(next);
      }
    },
    style: {
      fontSize: 16,
      padding: 8,
      borderRadius: 8,
      borderWidth: 0,
      backgroundColor: theme.backgroundSelected,
      color: theme.text,
      fontFamily: 'inherit',
    },
  });
}
