import { View, StyleSheet } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { Grain } from '@/components/ui/grain';
import { Particles } from '@/components/ui/particles';
import { useNotificationSync } from '@/hooks/use-notifications';

export default function TabsLayout() {
  useNotificationSync();
  return (
    <View style={styles.root}>
      {/* Mounted once beneath the whole tab stack so the wash is continuous —
          it must not restart or jump when the user changes tabs. */}
      <AmbientBackground />
      {/* Above the wash so it dithers the gradient's banding, below content so
          it textures the ground rather than the type. */}
      <Grain />
      {/* Above the texture so motes read as floating in front of the ground
          rather than embedded in it, still below every screen. */}
      <Particles />
      <AppTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
