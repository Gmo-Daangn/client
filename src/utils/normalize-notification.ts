import type { NotificationItem } from '@/src/types/notification';

export function normalizeNotificationPayload(raw: unknown): NotificationItem | null {
  if (!raw || typeof raw !== 'object') return null;

  let data = raw as Record<string, unknown>;
  if (data.data && typeof data.data === 'object') {
    data = data.data as Record<string, unknown>;
  }

  const id = Number(data.id ?? data.notificationId ?? 0);
  if (!id) return null;

  return {
    id,
    receiverId: Number(data.receiverId ?? 0),
    templateType: String(data.templateType ?? data.type ?? ''),
    templateTitle: String(data.templateTitle ?? data.title ?? ''),
    identifier: Number(data.identifier ?? data.roomId ?? 0),
    message: String(data.message ?? data.content ?? data.body ?? ''),
    isRead: Boolean(data.isRead ?? data.read),
    createdAt: data.createdAt != null ? String(data.createdAt) : null,
  };
}
