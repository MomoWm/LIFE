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
 * An opaque bar cuts the screen off at a hard line and makes the app feel like
 * a stack of separate pages. A blurred bar keeps the surface continuous, and
 * at the top of the screen it reads as chrome the content passes beneath
 * rather than as a lid sitting on top of it.
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
        // Tabs across the top rather than the bottom. The bar takes real
        // layout space here instead of floating: at the top it also has to own
        // the status-bar inset, and an absolutely-positioned bar would leave
        // the notch painted by whatever happened to be behind it.
        tabBarPosition: 'top',
        // Navigation chrome doesn't inherit ThemedText's typography.
        tabBarLabelStyle: { fontFamily: Family.medium, letterSpacing: 0.1 },
        tabBarStyle: {
          backgroundColor: 'transparent',
          // The rule belongs on the edge facing the content, which swapped
          // ends along with the bar.
          borderTopWidth: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
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
