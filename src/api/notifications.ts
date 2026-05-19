import { apiRequest } from '@/src/api/http';
import { unwrapData } from '@/src/api/unwrap';
import { NOTIFICATIONS_PATH, NOTIFICATIONS_SSE_PATH } from '@/src/constants/api';
import type { ApiResponse } from '@/src/types/member';
import type { NotificationItem } from '@/src/types/notification';
import { normalizeNotificationPayload } from '@/src/utils/normalize-notification';

function unwrapList<T>(payload: unknown): T[] {
  const data = unwrapData<unknown>(payload);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['contents', 'items', 'list', 'data']) {
      const nested = record[key];
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

function normalizeNotification(raw: unknown): NotificationItem {
  return (
    normalizeNotificationPayload(raw) ?? {
      id: 0,
      receiverId: 0,
      templateType: '',
      templateTitle: '',
      identifier: 0,
      message: '',
      isRead: false,
      createdAt: null,
    }
  );
}

/** GET /api/v1/notification?memberId={memberId} */
export async function fetchNotifications(memberId: number): Promise<NotificationItem[]> {
  const raw = await apiRequest<ApiResponse<unknown> | unknown>(
    `${NOTIFICATIONS_PATH}?memberId=${memberId}`,
    { method: 'GET' },
  );

  return unwrapList<unknown>(raw).map(normalizeNotification).filter((n) => n.id > 0);
}

/** PATCH /api/v1/notification/{id} */
export async function markNotificationAsRead(notificationId: number): Promise<string> {
  const raw = await apiRequest<ApiResponse<string> | string>(
    `${NOTIFICATIONS_PATH}/${notificationId}`,
    { method: 'PATCH' },
  );

  return unwrapData<string>(raw);
}

/** DELETE /api/v1/notification/{id} */
export async function deleteNotification(notificationId: number): Promise<string> {
  const raw = await apiRequest<ApiResponse<string> | string>(
    `${NOTIFICATIONS_PATH}/${notificationId}`,
    { method: 'DELETE' },
  );

  return unwrapData<string>(raw);
}

export function buildNotificationSseUrl(memberId: number, accessToken?: string | null) {
  const params = new URLSearchParams({ memberId: String(memberId) });
  if (accessToken) {
    params.set('access_token', accessToken);
  }
  return `${NOTIFICATIONS_SSE_PATH}?${params.toString()}`;
}
