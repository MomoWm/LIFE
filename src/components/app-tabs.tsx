import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
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
        tabBarShowLabel: false,
        // A pill-shaped bar, but a normal flex sibling of the scene — not
        // `position: 'absolute'`. An absolutely-positioned bar needs the
        // scene's bottom padding to guess its exact footprint, and that
        // guess is exactly the kind of thing that only breaks on a real
        // phone: mobile Safari's dynamic toolbar changes what `100vh`
        // actually resolves to, so a desktop-browser test can look perfect
        // while a real device shows the bar sitting over the last rows of
        // content. Keeping it in normal layout costs nothing (it still
        // reads as "floating" from the margin + shadow + rounded corners)
        // and removes the whole class of bug.
        tabBarStyle: [
          styles.bar,
          Shadow.raised,
          { backgroundColor: theme.backgroundElement, marginBottom: insets.bottom + Spacing.two },
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
    marginHorizontal: Spacing.four,
    height: 64,
    borderRadius: CornerRadius.pill,
    borderTopWidth: 0,
    paddingTop: 0,
    elevation: 8,
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
