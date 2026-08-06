import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { ChromeBackground } from '@/components/ui/chrome-background';
import { Icon, type IconName } from '@/components/ui/icon';
import { Family } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} size={26} tintColor={color} />;
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
        // Not decoration — this is what hides the tabs you aren't looking at.
        //
        // Inactive scenes are normally detached by react-native-screens, but
        // that library disables itself off-native, so on web every tab that has
        // ever been visited stays mounted as an absolutely-filled view. The
        // only thing separating them is z-order, and since the scenes are
        // transparent (above) so the wash can show through, z-order hides
        // nothing: Home and Routine paint over each other, word on word, and it
        // gets worse with every tab visited. Setting an animation runs the
        // scene interpolator, which drives unfocused scenes to opacity 0 — the
        // one lever that hides them without giving the scenes an opaque
        // background, which would blank the starfield behind them.
        animation: 'fade',
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarBackground: () => <ChromeBackground />,
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
