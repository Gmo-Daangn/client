import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/src/constants/colors';
import { useChat } from '@/src/context/chat-context';
import { useRootNavigation } from '@/src/navigation/use-root-navigation';
import type { ChatRoom } from '@/src/types/chat';
import { formatRelativeTime } from '@/src/utils/format-time';

function ChatRow({ chat, onPress }: { chat: ChatRoom; onPress: () => void }) {
  const lastMessage =
    chat.lastMessagePreview ??
    chat.messages[chat.messages.length - 1]?.text ??
    '대화를 시작해보세요';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Image source={{ uri: chat.otherUserProfileImage }} style={styles.avatar} />

      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {chat.otherUserName}
          </Text>
          {chat.otherUserLocation ? (
            <Text style={styles.location}>{chat.otherUserLocation}</Text>
          ) : null}
          <Text style={styles.time}>· {formatRelativeTime(chat.updatedAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>

      <View style={styles.rightSide}>
        <Image source={{ uri: chat.productImageUrl }} style={styles.productThumb} />
        {chat.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function ChatListScreen() {
  const rootNavigation = useRootNavigation();
  const { chats, roomsLoading, roomsError, refreshRooms } = useChat();

  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  useFocusEffect(
    useCallback(() => {
      void refreshRooms();
    }, [refreshRooms]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      {roomsLoading && sortedChats.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : sortedChats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>아직 채팅이 없어요</Text>
          <Text style={styles.emptySub}>상품에서 채팅하기를 눌러 대화를 시작해보세요.</Text>
          {roomsError ? <Text style={styles.errorText}>{roomsError}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={sortedChats}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={roomsLoading}
              onRefresh={() => void refreshRooms()}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <ChatRow
              chat={item}
              onPress={() => rootNavigation.navigate('ChatRoom', { chatId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            roomsError ? (
              <Pressable onPress={() => void refreshRooms()} style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{roomsError} · 탭하여 다시 시도</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  rowPressed: {
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  location: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  time: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rightSide: {
    position: 'relative',
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 76,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
