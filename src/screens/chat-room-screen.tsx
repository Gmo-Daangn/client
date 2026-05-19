import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/src/constants/colors';
import { WS_STOMP_URL } from '@/src/constants/api';
import { useAuth } from '@/src/context/auth-context';
import { useChat } from '@/src/context/chat-context';
import {
  chatStompClient,
  type StompConnectionStatus,
} from '@/src/services/chat-stomp-client';
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
      !next || next.sender !== msg.sender || next.createdAt - msg.createdAt > GROUP_MS;

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
  onLongPress,
}: {
  message: Message;
  showAvatar: boolean;
  showTime: boolean;
  otherAvatarUrl: string;
  onLongPress?: () => void;
}) {
  const isMine = message.sender === 'me';
  const isDeleted = message.deleted;
  const unreadCount = isMine && !isDeleted ? message.unreadCount ?? 0 : 0;
  const hasUnread = unreadCount > 0;

  const bubbleContent = (
    <>
      <Text
        style={[
          styles.bubbleText,
          isMine && styles.bubbleTextMine,
          isDeleted && styles.deletedText,
        ]}>
        {message.text}
      </Text>
      {message.edited && !isDeleted ? (
        <Text style={[styles.editedLabel, isMine && styles.editedLabelMine]}>수정됨</Text>
      ) : null}
    </>
  );

  if (isMine) {
    return (
      <Pressable onLongPress={onLongPress} delayLongPress={400} disabled={isDeleted}>
        <View style={styles.mineRow}>
          {hasUnread || showTime ? (
            <View style={styles.mineMeta}>
              {hasUnread ? (
                <Text style={styles.readReceiptMine}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              ) : null}
              {showTime ? (
                <Text style={styles.timeMine}>{formatClockTime(message.createdAt)}</Text>
              ) : null}
            </View>
          ) : null}
          <View style={[styles.bubble, styles.bubbleMine, isDeleted && styles.bubbleDeleted]}>
            {bubbleContent}
          </View>
        </View>
      </Pressable>
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
          <View style={[styles.bubble, styles.bubbleOther, isDeleted && styles.bubbleDeleted]}>
            {bubbleContent}
          </View>
          {showTime && <Text style={styles.timeOther}>{formatClockTime(message.createdAt)}</Text>}
        </View>
      </View>
    </View>
  );
}

export function ChatRoomScreen({ route }: Props) {
  const navigation = useNavigation<Navigation>();
  const { chatId } = route.params;
  const { accessToken } = useAuth();
  const {
    getChat,
    sendMessage,
    markAsRead,
    loadRoomMessages,
    editMessage,
    deleteMessage,
    setActiveRoomId,
  } = useChat();
  const chat = getChat(chatId);
  const otherUserName = chat?.otherUserName;
  const [text, setText] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [stompStatus, setStompStatus] = useState<StompConnectionStatus>(
    chatStompClient.getStatus(),
  );
  const listRef = useRef<FlatList<ListItem>>(null);

  useEffect(() => chatStompClient.subscribeStatus(setStompStatus), []);

  const openHeaderMenu = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '신고하기', '알림 끄기'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) Alert.alert('신고', '신고 기능은 준비 중이에요.');
          if (buttonIndex === 2) Alert.alert('알림', '이 채팅방 알림을 끌게요.');
        },
      );
    } else {
      Alert.alert('메뉴', undefined, [
        { text: '신고하기', onPress: () => Alert.alert('신고', '신고 기능은 준비 중이에요.') },
        { text: '알림 끄기', onPress: () => {} },
        { text: '닫기', style: 'cancel' },
      ]);
    }
  }, []);

  useLayoutEffect(() => {
    if (!otherUserName) return;
    navigation.setOptions({
      title: otherUserName,
      headerRight: () => (
        <Pressable onPress={openHeaderMenu} hitSlop={12} style={styles.headerIcon}>
          <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textPrimary} />
        </Pressable>
      ),
    });
  }, [navigation, otherUserName, openHeaderMenu]);

  useEffect(() => {
    setActiveRoomId(chatId);
    return () => setActiveRoomId(null);
  }, [chatId, setActiveRoomId]);

  const markedRoomRef = useRef<string | null>(null);
  useEffect(() => {
    if (markedRoomRef.current === chatId) return;
    markedRoomRef.current = chatId;
    void markAsRead(chatId);
  }, [chatId, markAsRead]);

  useEffect(() => {
    setMessagesLoading(true);
    setMessagesError(null);
    void loadRoomMessages(chatId)
      .catch((err) => {
        const message = err instanceof Error ? err.message : '메시지를 불러오지 못했어요.';
        setMessagesError(message);
      })
      .finally(() => setMessagesLoading(false));
  }, [chatId, loadRoomMessages]);

  const listData = useMemo(() => (chat ? buildListItems(chat.messages) : []), [chat]);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [listData.length]);

  const stompReady = stompStatus === 'connected';
  const stompBlocking = stompStatus === 'connecting' || stompStatus === 'error';

  const handleSend = () => {
    if (!chat || !text.trim() || sending || !stompReady) return;

    setSending(true);
    void sendMessage(chat.id, text)
      .then(() => setText(''))
      .catch((err) => {
        const message = err instanceof Error ? err.message : '메시지 전송에 실패했어요.';
        Alert.alert('전송 실패', message);
      })
      .finally(() => setSending(false));
  };

  const openMessageActions = useCallback(
    (message: Message) => {
      if (message.sender !== 'me' || message.deleted || message.messageId < 0) return;

      const startEdit = () => {
        setEditingMessage(message);
        setEditText(message.text);
      };

      const confirmDelete = () => {
        Alert.alert('메시지 삭제', '이 메시지를 삭제할까요?', [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              void deleteMessage(chatId, message.messageId).catch((err) => {
                const msg = err instanceof Error ? err.message : '메시지 삭제에 실패했어요.';
                Alert.alert('삭제 실패', msg);
              });
            },
          },
        ]);
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['취소', '수정', '삭제'],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 2,
          },
          (index) => {
            if (index === 1) startEdit();
            if (index === 2) confirmDelete();
          },
        );
        return;
      }

      Alert.alert('메시지', undefined, [
        { text: '수정', onPress: startEdit },
        { text: '삭제', style: 'destructive', onPress: confirmDelete },
        { text: '취소', style: 'cancel' },
      ]);
    },
    [chatId, deleteMessage],
  );

  const submitEdit = () => {
    if (!editingMessage || !editText.trim() || editSubmitting) return;

    setEditSubmitting(true);
    void editMessage(chatId, editingMessage.messageId, editText)
      .then(() => {
        setEditingMessage(null);
        setEditText('');
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : '메시지 수정에 실패했어요.';
        Alert.alert('수정 실패', message);
      })
      .finally(() => setEditSubmitting(false));
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

  const productTitle = chat.productTitle || '상품 문의';

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
        onLongPress={() => openMessageActions(item.message)}
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
              {productTitle}
            </Text>
            {chat.productPrice > 0 ? (
              <Text style={styles.productPrice}>{formatPrice(chat.productPrice)}</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </Pressable>
      </View>

      {messagesLoading && chat.messages.length === 0 ? (
        <View style={styles.messagesLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
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
          ListEmptyComponent={
            messagesError ? (
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyMessagesText}>{messagesError}</Text>
                <Pressable
                  onPress={() => {
                    setMessagesLoading(true);
                    void loadRoomMessages(chatId)
                      .catch((err) => {
                        const message =
                          err instanceof Error ? err.message : '메시지를 불러오지 못했어요.';
                        setMessagesError(message);
                      })
                      .finally(() => setMessagesLoading(false));
                  }}
                  style={styles.retryButton}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyMessagesText}>첫 메시지를 내보세요.</Text>
              </View>
            )
          }
        />
      )}

      <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
        {stompStatus !== 'connected' ? (
          <Pressable
            style={styles.stompBanner}
            onPress={() => {
              if (stompStatus === 'connecting') return;
              if (accessToken) {
                chatStompClient.connect(accessToken);
                return;
              }
              Alert.alert(
                '채팅 서버 연결',
                `WebSocket: ${WS_STOMP_URL}\n\n로그인 후 다시 시도하거나, 실기기에서는 .env의 EXPO_PUBLIC_API_URL을 Mac IP로 설정한 뒤 Metro를 재시작해 주세요.`,
              );
            }}>
            <Text style={styles.stompBannerText}>
              {stompStatus === 'connecting'
                ? '채팅 서버 연결 중…'
                : '채팅 서버에 연결되지 않았어요. 탭하여 다시 연결'}
            </Text>
          </Pressable>
        ) : null}
        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={stompReady ? '메시지 보내기' : '서버 연결 대기 중…'}
            placeholderTextColor={COLORS.textTertiary}
            style={styles.input}
            multiline
            editable={!sending && stompReady}
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sending || stompBlocking}
            hitSlop={8}
            style={({ pressed }) => [
              styles.sendButton,
              (!text.trim() || sending) && styles.sendButtonDisabled,
              pressed && text.trim() && !sending && styles.pressed,
            ]}>
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal
        visible={editingMessage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingMessage(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingMessage(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>메시지 수정</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={styles.modalInput}
              multiline
              autoFocus
              placeholderTextColor={COLORS.textTertiary}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditingMessage(null)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                onPress={submitEdit}
                disabled={!editText.trim() || editSubmitting}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalSubmit,
                  pressed && styles.pressed,
                  (!editText.trim() || editSubmitting) && styles.sendButtonDisabled,
                ]}>
                {editSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>저장</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  pressed: {
    opacity: 0.75,
  },
  messagesLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
  mineMeta: {
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 4,
  },
  readReceiptMine: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timeMine: {
    fontSize: 11,
    color: COLORS.textTertiary,
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
  bubbleDeleted: {
    opacity: 0.75,
  },
  bubbleText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  deletedText: {
    fontStyle: 'italic',
    color: COLORS.textTertiary,
  },
  editedLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  editedLabelMine: {
    color: 'rgba(255,255,255,0.75)',
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
  stompBanner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFF4EC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  stompBannerText: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalInput: {
    minHeight: 80,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmit: {
    backgroundColor: COLORS.primary,
    minWidth: 72,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
