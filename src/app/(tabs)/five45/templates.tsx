import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
import { DAY_TYPES, DAY_TYPE_LABELS, type DayType } from '@/lib/dayType/dayType';
import { useDayTemplate, useSaveTemplateTask } from '@/hooks/use-five45';
import { useTheme } from '@/hooks/use-theme';

const CHIP_LABELS: Record<DayType, string> = {
  standard: 'Mon·Wed·Thu',
  meeting: 'Tue·Fri',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export default function TemplatesScreen() {
  const theme = useTheme();
  const [dayType, setDayType] = useState<DayType>('standard');
  const { data } = useDayTemplate(dayType);
  const saveTask = useSaveTemplateTask();

  const taskTitle = (kind: 'wake' | 'eod', position: number) =>
    data?.tasks.find((t) => t.kind === kind && t.position === position)?.title ?? '';

  return (
    <>
      <Stack.Screen options={{ title: 'Templates', headerLargeTitle: false }} />
      <Screen>
        <View style={styles.chips}>
          {DAY_TYPES.map((type) => {
            const selected = type === dayType;
            return (
              <Pressable
                key={type}
                onPress={() => setDayType(type)}
                style={[
                  styles.chip,
                  { backgroundColor: selected ? theme.tint : theme.backgroundElement },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: selected ? '#fff' : theme.textSecondary }}>
                  {CHIP_LABELS[type]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {DAY_TYPE_LABELS[dayType]} — changes save automatically.
        </ThemedText>

        <Animated.View key={dayType} entering={FadeIn.duration(200)} style={styles.sections}>
          <TemplateSection
            heading="Morning 5 — the second you wake up"
            kind="wake"
            dayType={dayType}
            taskTitle={taskTitle}
            onSave={(kind, position, title) => saveTask.mutate({ dayType, kind, position, title })}
          />
          <TemplateSection
            heading="5 Non-negotiables — before sleep"
            kind="eod"
            dayType={dayType}
            taskTitle={taskTitle}
            onSave={(kind, position, title) => saveTask.mutate({ dayType, kind, position, title })}
          />
        </Animated.View>
      </Screen>
    </>
  );
}

function TemplateSection({
  heading,
  kind,
  dayType,
  taskTitle,
  onSave,
}: {
  heading: string;
  kind: 'wake' | 'eod';
  dayType: DayType;
  taskTitle: (kind: 'wake' | 'eod', position: number) => string;
  onSave: (kind: 'wake' | 'eod', position: number, title: string) => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <ThemedText type="smallBold">{heading}</ThemedText>
      {[1, 2, 3, 4, 5].map((position) => (
        <TaskInput
          // Remount when switching day types so drafts don't leak across templates.
          key={`${dayType}-${kind}-${position}`}
          position={position}
          initial={taskTitle(kind, position)}
          onSave={(title) => onSave(kind, position, title)}
        />
      ))}
    </Card>
  );
}

function TaskInput({
  position,
  initial,
  onSave,
}: {
  position: number;
  initial: string;
  onSave: (title: string) => void;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(initial);

  return (
    <View style={styles.inputRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.position}>
        {position}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={setValue}
        onEndEditing={() => {
          if (value.trim() !== initial.trim()) onSave(value);
        }}
        placeholder="Add a task…"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.separator },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: CornerRadius.xlarge,
  },
  sections: {
    gap: Spacing.three,
  },
  sectionCard: {
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  position: {
    width: 16,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: CornerRadius.small + 2,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
});
