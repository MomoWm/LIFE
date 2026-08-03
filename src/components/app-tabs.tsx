import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function TabIcon({ name, color }: { name: SymbolViewProps['name']; color: string }) {
  return <SymbolView name={name} size={26} tintColor={color} resizeMode="scaleAspectFit" />;
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabIcon name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="five45"
        options={{
          title: '545',
          tabBarIcon: ({ color }) => <TabIcon name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trackers"
        options={{
          title: 'Trackers',
          tabBarIcon: ({ color }) => <TabIcon name="heart.text.square" color={color} />,
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
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
