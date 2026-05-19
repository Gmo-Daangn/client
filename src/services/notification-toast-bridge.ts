import type { NotificationItem } from '@/src/types/notification';

type NotificationToastListener = (item: NotificationItem) => void;

let listener: NotificationToastListener | null = null;

export function setNotificationToastListener(next: NotificationToastListener | null) {
  listener = next;
}

export function publishNotificationToast(item: NotificationItem) {
  listener?.(item);
}

export function isLocalNotification(item: NotificationItem) {
  return item.id < 0;
}
