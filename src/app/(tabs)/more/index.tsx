import { Link, Stack, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Motion, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MoreLink = {
  href: Href;
  title: string;
  subtitle: string;
  symbol: IconName;
};

export default function MoreScreen() {
  const theme = useTheme();

  const destinations: MoreLink[] = [
    {
      href: '/more/workout',
      title: 'Workout',
      subtitle: '8-day split, sessions, progression',
      symbol: 'dumbbell.fill',
    },
    {
      href: '/more/retention',
      title: 'Discipline',
      subtitle: 'Current streak and history',
      symbol: 'bolt.shield.fill',
    },
    {
      href: '/more/sleep',
      title: 'Sleep',
      subtitle: 'Bed time, wake time, duration',
      symbol: 'moon.zzz.fill',
    },
    {
      href: '/more/insights',
      title: 'Insights',
      subtitle: 'Score trend over the last 30 days',
      symbol: 'chart.xyaxis.line',
    },
    {
      href: '/more/settings',
      title: 'Settings',
      subtitle: 'Account, prayer setup, notifications',
      symbol: 'gearshape.fill',
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'More' }} />
      <Screen>
        {destinations.map((destination, index) => (
          <Animated.View
            key={destination.title}
            entering={FadeInDown.duration(Motion.entry).delay(index * 40)}>
            <Link href={destination.href} asChild>
              <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <Card style={styles.row}>
                  <View style={[styles.iconBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <Icon name={destination.symbol} size={20} tintColor={theme.text} />
                  </View>
                  <View style={styles.textColumn}>
                    <ThemedText type="smallBold">{destination.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {destination.subtitle}
                    </ThemedText>
                  </View>
                  <Icon
                    name="chevron.right"
                    size={14}
                    weight="semibold"
                    tintColor={theme.textTertiary}
                  />
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
