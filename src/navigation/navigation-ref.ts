import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from '@/src/navigation/root-navigator';
import type { NotificationItem } from '@/src/types/notification';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function getCurrentRouteName(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  return navigationRef.getCurrentRoute()?.name;
}

export function shouldSuppressNotificationToast(item: NotificationItem): boolean {
  if (!navigationRef.isReady()) return false;

  const route = navigationRef.getCurrentRoute();
  if (route?.name !== 'ChatRoom' || item.templateType !== 'CHAT' || item.identifier <= 0) {
    return false;
  }

  const params = route.params as { chatId?: string } | undefined;
  return params?.chatId === String(item.identifier);
}

export function navigateFromNotification(item: NotificationItem) {
  if (!navigationRef.isReady()) return;

  if (item.templateType === 'CHAT' && item.identifier > 0) {
    navigationRef.navigate('ChatRoom', { chatId: String(item.identifier) });
    return;
  }

  navigationRef.navigate('Notifications');
}
