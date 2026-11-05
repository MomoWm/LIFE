import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Icon, type IconName } from '@/components/ui/icon';
import { CornerRadius, Family, Motion, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  const theme = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.86);

  // The whole point of a floating pill tab bar is that picking a tab feels
  // like pressing a button, not just recoloring a glyph — the active icon
  // pops a little larger on a filled pill behind it.
  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.86, Motion.springEntry);
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[styles.iconWrap, focused && { backgroundColor: theme.tint }, style]}>
      <Icon name={name} size={22} tintColor={focused ? theme.onTint : color} />
    </Animated.View>
  );
}

export default function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textTertiary,
        // A real floating pill, not a painted strip across the bottom — it
        // sits inset from every edge with its own shadow, so it reads as a
        // tactile object resting on the page rather than chrome bolted to it.
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, styles.pill, { backgroundColor: theme.backgroundElement }]} />
        ),
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.bar,
          Shadow.raised,
          { bottom: insets.bottom + Spacing.two, backgroundColor: 'transparent', borderTopWidth: 0 },
        ],
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: { fontFamily: Family.medium, letterSpacing: 0.1 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="five45"
        options={{
          title: 'Routine',
          tabBarIcon: ({ color, focused }) => <TabIcon name="list" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color, focused }) => <TabIcon name="moon" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: 'Work',
          tabBarIcon: ({ color, focused }) => <TabIcon name="briefcase" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="ellipsis-horizontal" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    height: 64,
    borderRadius: CornerRadius.pill,
    paddingTop: 0,
    elevation: 8,
  },
  pill: {
    borderRadius: CornerRadius.pill,
  },
  item: {
    paddingTop: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: CornerRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
