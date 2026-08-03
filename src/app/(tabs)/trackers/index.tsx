import { Link, Stack, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TrackerLink = {
  href: Href;
  title: string;
  subtitle: string;
  symbol: IconName;
  color: string;
};

export default function TrackersScreen() {
  const theme = useTheme();

  const trackers: TrackerLink[] = [
    {
      href: '/trackers/prayer',
      title: 'Prayer',
      subtitle: 'Five daily prayers, streak, and Qada',
      symbol: 'moon.stars.fill',
      color: '#7B68EE',
    },
    {
      href: '/trackers/retention',
      title: 'Retention',
      subtitle: 'Current streak and history',
      symbol: 'bolt.shield.fill',
      color: theme.warning,
    },
    {
      href: '/trackers/sleep',
      title: 'Sleep',
      subtitle: 'Bed time, wake time, duration',
      symbol: 'bed.double.fill',
      color: theme.tint,
    },
    {
      href: '/trackers/workout',
      title: 'Workout',
      subtitle: '8-day split, sessions, progression',
      symbol: 'dumbbell.fill',
      color: theme.success,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Trackers' }} />
      <Screen>
        {trackers.map((tracker, index) => (
          <Animated.View key={tracker.title} entering={FadeInDown.duration(300).delay(index * 60)}>
            <Link href={tracker.href} asChild>
              <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <Card style={styles.row}>
                  <View style={[styles.iconBadge, { backgroundColor: tracker.color }]}>
                    <Icon name={tracker.symbol} size={20} tintColor="#fff" />
                  </View>
                  <View style={styles.textColumn}>
                    <ThemedText type="smallBold">{tracker.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {tracker.subtitle}
                    </ThemedText>
                  </View>
                  <Icon name="chevron.right" size={14} weight="semibold" tintColor={theme.textSecondary} />
                </Card>
              </Pressable>
            </Link>
          </Animated.View>
        ))}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
