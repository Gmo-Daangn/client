import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/src/constants/colors';
import { useChat } from '@/src/context/chat-context';
import { useRootNavigation } from '@/src/navigation/use-root-navigation';
import type { ChatRoom } from '@/src/types/chat';
import { formatRelativeTime } from '@/src/utils/format-time';

function ChatRow({ chat, onPress }: { chat: ChatRoom; onPress: () => void }) {
  const lastMessage = chat.messages[chat.messages.length - 1];

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
          <Text style={styles.location}>{chat.otherUserLocation}</Text>
          <Text style={styles.time}>· {formatRelativeTime(chat.updatedAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage?.text ?? '대화를 시작해보세요'}
        </Text>
      </View>

      <View style={styles.rightSide}>
        <Image source={{ uri: chat.productImageUrl }} style={styles.productThumb} />
        {chat.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chat.unreadCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function ChatListScreen() {
  const rootNavigation = useRootNavigation();
  const { chats } = useChat();

  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      {sortedChats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>아직 채팅이 없어요</Text>
          <Text style={styles.emptySub}>상품에서 채팅하기를 눌러 대화를 시작해보세요.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatRow
              chat={item}
              onPress={() => rootNavigation.navigate('ChatRoom', { chatId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
});
