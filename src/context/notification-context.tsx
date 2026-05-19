import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  deleteNotification as deleteNotificationApi,
  fetchNotifications,
  markNotificationAsRead,
} from '@/src/api/notifications';
import { NotificationToast } from '@/src/components/notification-toast';
import { getAccessToken } from '@/src/api/token-storage';
import { useAuth } from '@/src/context/auth-context';
import {
  navigateFromNotification,
  shouldSuppressNotificationToast,
} from '@/src/navigation/navigation-ref';
import { notificationSseClient } from '@/src/services/notification-sse';
import {
  isLocalNotification,
  setNotificationToastListener,
} from '@/src/services/notification-toast-bridge';
import type { NotificationItem } from '@/src/types/notification';
import { parseMemberIdFromJwt } from '@/src/utils/parse-member-id';

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  removeNotification: (id: number) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function sortNotifications(items: NotificationItem[]) {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

function getNotificationReadKey(item: NotificationItem) {
  if (item.templateType === 'CHAT' && item.identifier > 0) {
    return `chat:${item.identifier}:${item.message}`;
  }

  return `id:${item.id}`;
}

function upsertNotification(
  list: NotificationItem[],
  item: NotificationItem,
  readKeys: Set<string>,
) {
  const nextItem = readKeys.has(getNotificationReadKey(item)) ? { ...item, isRead: true } : item;
  const index = list.findIndex(
    (n) =>
      n.id === nextItem.id ||
      ((n.id < 0) !== (nextItem.id < 0) &&
        n.templateType === 'CHAT' &&
        nextItem.templateType === 'CHAT' &&
        n.identifier === nextItem.identifier &&
        n.message === nextItem.message),
  );

  if (index === -1) return sortNotifications([nextItem, ...list]);
  const copy = [...list];
  copy[index] = { ...copy[index], ...nextItem };
  return sortNotifications(copy);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, member, accessToken } = useAuth();
  const memberId = member?.memberId ?? parseMemberIdFromJwt(accessToken ?? getAccessToken());

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastItem, setToastItem] = useState<NotificationItem | null>(null);
  const recentToastKeysRef = useRef(new Set<string>());
  const readNotificationKeysRef = useRef(new Set<string>());

  const showToast = useCallback((item: NotificationItem) => {
    if (shouldSuppressNotificationToast(item)) return;

    const dedupeKey =
      item.templateType === 'CHAT' && item.identifier > 0
        ? `chat:${item.identifier}:${item.message}`
        : `id:${item.id}`;

    if (recentToastKeysRef.current.has(dedupeKey)) return;
    recentToastKeysRef.current.add(dedupeKey);
    setTimeout(() => recentToastKeysRef.current.delete(dedupeKey), 3000);

    setToastItem({ ...item, isRead: false });
  }, []);

  const handleIncoming = useCallback(
    (item: NotificationItem) => {
      setNotifications((prev) =>
        upsertNotification(prev, { ...item, isRead: false }, readNotificationKeysRef.current),
      );
      showToast(item);
    },
    [showToast],
  );

  const dismissToast = useCallback(() => {
    setToastItem(null);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!memberId) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchNotifications(memberId);
      setNotifications(sortNotifications(list));
    } catch (err) {
      const message = err instanceof Error ? err.message : '알림 목록을 불러오지 못했어요.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target) {
        readNotificationKeysRef.current.add(getNotificationReadKey(target));
      }

      return prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    });

    if (id < 0) return;

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.warn('[notification] 읽음 처리 실패:', err);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const handleToastPress = useCallback(
    (item: NotificationItem) => {
      setToastItem(null);
      if (!isLocalNotification(item)) {
        void markAsRead(item.id);
      }
      navigateFromNotification(item);
    },
    [markAsRead],
  );

  useEffect(() => {
    setNotificationToastListener(handleIncoming);
    return () => setNotificationToastListener(null);
  }, [handleIncoming]);

  useEffect(() => {
    if (!isLoggedIn || !memberId || !accessToken) {
      notificationSseClient.disconnect();
      setNotifications([]);
      setToastItem(null);
      return;
    }

    void refreshNotifications();

    notificationSseClient.connect(memberId, accessToken, handleIncoming);

    return () => {
      notificationSseClient.disconnect();
    };
  }, [isLoggedIn, memberId, accessToken, refreshNotifications, handleIncoming]);

  const removeNotification = useCallback(async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (id < 0) return;

    try {
      await deleteNotificationApi(id);
    } catch (err) {
      console.warn('[notification] 삭제 실패:', err);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refreshNotifications,
      markAsRead,
      removeNotification,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      refreshNotifications,
      markAsRead,
      removeNotification,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast item={toastItem} onPress={handleToastPress} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications는 NotificationProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
