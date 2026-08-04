import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Icon, type IconName } from '@/components/ui/icon';
import { Family } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} size={26} tintColor={color} />;
}

/**
 * The tab bar as glass rather than as a painted strip.
 *
 * An opaque bar cuts the screen off at a hard line and makes the app feel
 * like a stack of separate pages. Letting content pass under a blurred bar
 * keeps the surface continuous and signals that there is more below — the
 * single clearest cue that a list is scrollable.
 */
function TabBarBackground() {
  return <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />;
}

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // The tab navigator paints an opaque scene by default, which covers
        // the ambient wash mounted beneath it in the tabs layout.
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarBackground: TabBarBackground,
        // Navigation chrome doesn't inherit ThemedText's typography.
        tabBarLabelStyle: { fontFamily: Family.medium, letterSpacing: 0.1 },
        tabBarStyle: {
          // Absolute so the scene extends beneath the glass; Screen adds the
          // matching bottom padding so nothing ends up trapped under it.
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: theme.separator,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="five45"
        options={{
          title: 'Routine',
          tabBarIcon: ({ color }) => <TabIcon name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color }) => <TabIcon name="moon.stars.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: 'Work',
          tabBarIcon: ({ color }) => <TabIcon name="briefcase.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <TabIcon name="ellipsis" color={color} />,
        }}
      />
    </Tabs>
  );
}
