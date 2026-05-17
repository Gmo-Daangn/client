import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/src/constants/colors';
import { useChat } from '@/src/context/chat-context';
import type { RootStackParamList } from '@/src/navigation/root-navigator';
import type { Message } from '@/src/types/chat';
import { formatClockTime } from '@/src/utils/format-time';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const GROUP_MS = 5 * 60 * 1000;

type ListItem =
  | { key: string; kind: 'day'; label: string }
  | {
      key: string;
      kind: 'message';
      message: Message;
      showAvatar: boolean;
      showTime: boolean;
    };

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`;
}

function formatDayLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${y}년 ${m}월 ${day}일 ${weekdays[d.getDay()]}요일`;
}

function buildListItems(messages: Message[]): ListItem[] {
  if (messages.length === 0) return [];

  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);
  const items: ListItem[] = [];

  let lastDayKey = '';
  for (let i = 0; i < sorted.length; i++) {
    const msg = sorted[i];
    const dayKey = new Date(msg.createdAt).toDateString();
    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      items.push({
        key: `day-${dayKey}`,
        kind: 'day',
        label: formatDayLabel(msg.createdAt),
      });
    }

    const prev = sorted[i - 1];
    const next = sorted[i + 1];
    const showAvatar =
      msg.sender === 'other' &&
      (!prev || prev.sender !== 'other' || msg.createdAt - prev.createdAt > GROUP_MS);

    const showTime =
      !next ||
      next.sender !== msg.sender ||
      next.createdAt - msg.createdAt > GROUP_MS;

    items.push({
      key: msg.id,
      kind: 'message',
      message: msg,
      showAvatar,
      showTime,
    });
  }

  return items;
}

function MessageBubble({
  message,
  showAvatar,
  showTime,
  otherAvatarUrl,
}: {
  message: Message;
  showAvatar: boolean;
  showTime: boolean;
  otherAvatarUrl: string;
}) {
  const isMine = message.sender === 'me';

  if (isMine) {
    return (
      <View style={styles.mineRow}>
        {showTime && <Text style={styles.timeMine}>{formatClockTime(message.createdAt)}</Text>}
        <View style={[styles.bubble, styles.bubbleMine]}>
          <Text style={[styles.bubbleText, styles.bubbleTextMine]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.otherRow}>
      <View style={styles.avatarCol}>
        {showAvatar ? (
          <Image source={{ uri: otherAvatarUrl }} style={styles.messageAvatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>
      <View style={styles.otherContent}>
        <View style={styles.otherBubbleRow}>
          <View style={[styles.bubble, styles.bubbleOther]}>
            <Text style={styles.bubbleText}>{message.text}</Text>
          </View>
          {showTime && (
            <Text style={styles.timeOther}>{formatClockTime(message.createdAt)}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export function ChatRoomScreen({ route }: Props) {
  const navigation = useNavigation<Navigation>();
  const { chatId } = route.params;
  const { getChat, sendMessage, markAsRead } = useChat();
  const chat = getChat(chatId);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ListItem>>(null);

  const openHeaderMenu = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '신고하기', '알림 끄기', '채팅방 나가기'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) Alert.alert('신고', '신고 기능은 데모에서 연결되지 않았어요.');
          if (buttonIndex === 2) Alert.alert('알림', '이 채팅방 알림을 끌게요. (데모)');
          if (buttonIndex === 3) Alert.alert('나가기', '채팅방을 나가시겠어요? (데모)');
        },
      );
    } else {
      Alert.alert('메뉴', undefined, [
        { text: '신고하기', onPress: () => Alert.alert('신고', '데모에서는 연결되지 않았어요.') },
        { text: '알림 끄기', onPress: () => {} },
        { text: '채팅방 나가기', style: 'destructive', onPress: () => {} },
        { text: '닫기', style: 'cancel' },
      ]);
    }
  }, []);

  useLayoutEffect(() => {
    if (!chat) return;
    navigation.setOptions({
      title: chat.otherUserName,
      headerRight: () => (
        <Pressable onPress={openHeaderMenu} hitSlop={12} style={styles.headerIcon}>
          <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textPrimary} />
        </Pressable>
      ),
    });
  }, [navigation, chat, openHeaderMenu]);

  useEffect(() => {
    if (chat) markAsRead(chat.id);
  }, [chat, markAsRead]);

  const listData = useMemo(() => (chat ? buildListItems(chat.messages) : []), [chat]);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [listData.length]);

  const handleSend = () => {
    if (!chat || !text.trim()) return;
    sendMessage(chat.id, text);
    setText('');
  };

  const goProductDetail = () => {
    if (!chat) return;
    navigation.navigate('ProductDetail', { productId: chat.productId });
  };

  if (!chat) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>채팅방을 찾을 수 없어요.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'day') {
      return (
        <View style={styles.dayPillWrap}>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>{item.label}</Text>
          </View>
        </View>
      );
    }
    return (
      <MessageBubble
        message={item.message}
        showAvatar={item.showAvatar}
        showTime={item.showTime}
        otherAvatarUrl={chat.otherUserProfileImage}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <View style={styles.productBar}>
        <Pressable
          onPress={goProductDetail}
          style={({ pressed }) => [styles.productMain, pressed && styles.pressed]}>
          <Image source={{ uri: chat.productImageUrl }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {chat.productTitle}
            </Text>
            <Text style={styles.productPrice}>{formatPrice(chat.productPrice)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert(
              '안전한 거래',
              '직거래 시 공공장소에서 만나고, 선입금·외부 링크는 피해주세요. (데모)',
            )
          }
          style={({ pressed }) => [styles.dealButton, pressed && styles.pressed]}>
          <Text style={styles.dealButtonText}>거래 진행</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <View style={styles.noticeBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.noticeText}>
              당근페이 없이 직거래만 진행해요. 계좌이체를 요구하면 의심해보세요.
            </Text>
          </View>
        }
      />

      <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
        <View style={styles.inputBar}>
          <Pressable
            hitSlop={8}
            style={styles.plusButton}
            onPress={() =>
              Alert.alert('첨부', '사진·장소 첨부는 데모에서 생략했어요.', [{ text: '확인' }])
            }>
            <Ionicons name="add" size={26} color={COLORS.textSecondary} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="메시지 보내기"
            placeholderTextColor={COLORS.textTertiary}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.sendButton,
              !text.trim() && styles.sendButtonDisabled,
              pressed && text.trim() && styles.pressed,
            ]}>
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerIcon: {
    marginRight: 4,
    padding: 4,
  },
  productBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  productMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dealButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dealButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  dayPillWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dayPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dayPillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  mineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 6,
    gap: 6,
  },
  timeMine: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    gap: 8,
  },
  avatarCol: {
    width: 36,
    alignItems: 'center',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  avatarPlaceholder: {
    width: 32,
    height: 8,
  },
  otherContent: {
    flex: 1,
    maxWidth: '82%',
  },
  otherBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  bubble: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  timeOther: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  inputSafe: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  plusButton: {
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
