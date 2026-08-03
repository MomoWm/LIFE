import DateTimePicker from '@react-native-community/datetimepicker';

export type TimeFieldProps = {
  value: Date;
  onChange: (date: Date) => void;
};

/** Native time picker; web gets an HTML <input type="time"> via time-field.web.tsx. */
export function TimeField({ value, onChange }: TimeFieldProps) {
  return (
    <DateTimePicker
      value={value}
      mode="time"
      display="compact"
      onChange={(_event, date) => date && onChange(date)}
    />
  );
}
