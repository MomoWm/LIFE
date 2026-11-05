import { View, StyleSheet } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AmbientBlobs } from '@/components/ui/blob';
import { useNotificationSync } from '@/hooks/use-notifications';

export default function TabsLayout() {
  useNotificationSync();
  return (
    <View style={styles.root}>
      {/* Mounted once beneath the whole tab stack so the wash is continuous —
          it must not restart or jump when the user changes tabs. */}
      <AmbientBlobs />
      <AppTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
