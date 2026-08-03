import AppTabs from '@/components/app-tabs';
import { useNotificationSync } from '@/hooks/use-notifications';

export default function TabsLayout() {
  useNotificationSync();
  return <AppTabs />;
}
