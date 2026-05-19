import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/src/constants/colors';
import { useNotifications } from '@/src/context/notification-context';
import { navigateFromNotification } from '@/src/navigation/navigation-ref';
import type { NotificationItem } from '@/src/types/notification';
import { formatRelativeTime } from '@/src/utils/format-time';

function formatNotificationTime(createdAt: string | null) {
  if (!createdAt) return '';
  const ts = new Date(createdAt).getTime();
  if (!Number.isFinite(ts)) return '';
  return formatRelativeTime(ts);
}

function NotificationRow({
  item,
  onPress,
  onDelete,
}: {
  item: NotificationItem;
  onPress: () => void;
  onDelete: () => void;
}) {
  const iconName = item.templateType === 'CHAT' ? 'chatbubble-ellipses-outline' : 'notifications-outline';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, !item.isRead && styles.rowUnread]}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={22} color={COLORS.primary} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.templateTitle || '알림'}
          </Text>
          {formatNotificationTime(item.createdAt) ? (
            <Text style={styles.time}>{formatNotificationTime(item.createdAt)}</Text>
          ) : null}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.rowPressed]}>
        <Ionicons name="close" size={18} color={COLORS.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

export function NotificationsScreen() {
  const { notifications, loading, error, refreshNotifications, markAsRead, removeNotification } =
    useNotifications();

  useFocusEffect(
    useCallback(() => {
      void refreshNotifications();
    }, [refreshNotifications]),
  );

  const handlePress = (item: NotificationItem) => {
    void markAsRead(item.id);

    if (item.templateType === 'CHAT' && item.identifier > 0) {
      navigateFromNotification(item);
      return;
    }

    Alert.alert(item.templateTitle || '알림', item.message);
  };

  const confirmDelete = (item: NotificationItem) => {
    Alert.alert('알림 삭제', '이 알림을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => void removeNotification(item.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>알림이 없어요</Text>
          <Text style={styles.emptySub}>새 채팅이나 메시지가 오면 여기에 표시돼요.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void refreshNotifications()}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => handlePress(item)}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            error ? (
              <Pressable onPress={() => void refreshNotifications()} style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error} · 탭하여 다시 시도</Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  rowUnread: {
    backgroundColor: '#FFF9F5',
  },
  rowPressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
