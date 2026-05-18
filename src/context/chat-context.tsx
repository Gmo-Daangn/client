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
  deleteChatMessage,
  enterChatRoom,
  fetchChatMessages,
  fetchChatRooms,
  markChatRoomAsRead,
  updateChatMessage,
} from '@/src/api/chat';
import { fetchPostDetail } from '@/src/api/posts';
import { getAccessToken } from '@/src/api/token-storage';
import { useAuth } from '@/src/context/auth-context';
import { parseMemberIdFromJwt } from '@/src/utils/parse-member-id';
import { chatStompClient } from '@/src/services/chat-stomp-client';
import type { ChatMessageDto } from '@/src/types/chat-api';
import type { ChatRoom, Message } from '@/src/types/chat';
import type { Product } from '@/src/types/product';
import {
  apiMessageToMessage,
  apiMessagesToMessages,
  apiRoomListItemToChatRoom,
  createChatRoomFromProduct,
  mergeChatRoom,
  upsertMessage,
} from '@/src/utils/chat-mappers';

type ChatContextValue = {
  chats: ChatRoom[];
  totalUnreadCount: number;
  roomsLoading: boolean;
  roomsError: string | null;
  refreshRooms: () => Promise<void>;
  getChat: (chatId: string) => ChatRoom | undefined;
  enterChatForProduct: (input: { product: Product; targetMemberId: number }) => Promise<string>;
  loadRoomMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  editMessage: (chatId: string, messageId: number, text: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: number) => Promise<void>;
  setActiveRoomId: (chatId: string | null) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function requireMemberId(memberId: number | undefined): number {
  if (!memberId) {
    throw new Error('회원 ID를 확인할 수 없어요. 다시 로그인해 주세요.');
  }
  return memberId;
}

async function enrichRoomWithPost(room: ChatRoom): Promise<ChatRoom> {
  if (room.productTitle) return room;

  const productId = Number(room.productId);
  if (!Number.isFinite(productId)) return room;

  try {
    const post = await fetchPostDetail(productId);
    return mergeChatRoom(room, {
      productTitle: post.title,
      productPrice: post.price,
      otherUserLocation: post.location,
    });
  } catch {
    return room;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, member, accessToken } = useAuth();
  const memberId = member?.memberId ?? parseMemberIdFromJwt(accessToken ?? getAccessToken());

  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const memberIdRef = useRef(memberId);
  memberIdRef.current = memberId;

  const activeRoomIdRef = useRef(activeRoomId);
  activeRoomIdRef.current = activeRoomId;

  const applyIncomingMessage = useCallback((dto: ChatMessageDto) => {
    const myId = memberIdRef.current;
    if (!myId) return;

    const roomId = String(dto.roomId);
    const mapped = apiMessageToMessage(dto, myId);

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== roomId) return chat;

        const isMine = mapped.sender === 'me';
        const unreadCount =
          isMine || activeRoomIdRef.current === roomId ? chat.unreadCount : chat.unreadCount + 1;

        const baseMessages =
          isMine && mapped.messageId > 0
            ? chat.messages.filter((m) => m.messageId > 0)
            : chat.messages;

        return mergeChatRoom(chat, {
          messages: upsertMessage(baseMessages, mapped),
          lastMessagePreview: mapped.deleted ? '삭제된 메시지입니다.' : mapped.text,
          updatedAt: mapped.createdAt,
          unreadCount,
        });
      }),
    );
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) {
      chatStompClient.disconnect();
      setChats([]);
      return;
    }

    chatStompClient.connect(accessToken);
  }, [isLoggedIn, accessToken]);

  useEffect(() => {
    if (!activeRoomId) return;

    const roomId = Number(activeRoomId);
    if (!Number.isFinite(roomId)) return;

    chatStompClient.registerRoom(roomId, {
      onMessage: applyIncomingMessage,
      onReadStatus: () => {
        setChats((prev) => {
          let changed = false;
          const next = prev.map((chat) => {
            if (chat.id !== activeRoomId || chat.unreadCount === 0) return chat;
            changed = true;
            return { ...chat, unreadCount: 0 };
          });
          return changed ? next : prev;
        });
      },
    });

    return () => {
      chatStompClient.unregisterRoom(roomId);
    };
  }, [activeRoomId, applyIncomingMessage]);

  const refreshRooms = useCallback(async () => {
    const myId = requireMemberId(memberId);

    setRoomsLoading(true);
    setRoomsError(null);

    try {
      const items = await fetchChatRooms(myId);
      const mapped = items.map(apiRoomListItemToChatRoom);

      setChats((prev) => {
        const prevById = new Map(prev.map((c) => [c.id, c]));
        return mapped.map((room) => {
          const existing = prevById.get(room.id);
          return mergeChatRoom(room, {
            messages: existing?.messages ?? [],
            productTitle: existing?.productTitle || room.productTitle,
            productPrice: existing?.productPrice || room.productPrice,
            otherUserLocation: existing?.otherUserLocation || room.otherUserLocation,
          });
        });
      });

      void Promise.all(mapped.map((room) => enrichRoomWithPost(room))).then((enriched) => {
        setChats((prev) => {
          const byId = new Map(enriched.map((r) => [r.id, r]));
          return prev.map((room) => byId.get(room.id) ?? room);
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '채팅 목록을 불러오지 못했어요.';
      setRoomsError(message);
    } finally {
      setRoomsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (!isLoggedIn || !memberId) {
      setChats([]);
      return;
    }
    void refreshRooms();
  }, [isLoggedIn, memberId, refreshRooms]);

  const getChat = useCallback((chatId: string) => chats.find((c) => c.id === chatId), [chats]);

  const upsertChat = useCallback((room: ChatRoom) => {
    setChats((prev) => {
      const index = prev.findIndex((c) => c.id === room.id);
      if (index === -1) return [room, ...prev];
      const copy = [...prev];
      copy[index] = mergeChatRoom(copy[index], room);
      return copy;
    });
  }, []);

  const enterChatForProduct = useCallback(
    async (input: { product: Product; targetMemberId: number }) => {
      const myId = requireMemberId(memberId);
      const productId = Number(input.product.id);

      if (input.targetMemberId === myId) {
        throw new Error('본인과는 채팅할 수 없어요.');
      }

      const response = await enterChatRoom({
        memberId: myId,
        targetMemberId: input.targetMemberId,
        productId: Number.isFinite(productId) ? productId : undefined,
      });

      const room = createChatRoomFromProduct({
        roomId: response.roomId,
        product: input.product,
        otherMemberId: input.targetMemberId,
      });

      upsertChat(room);
      return String(response.roomId);
    },
    [memberId, upsertChat],
  );

  const loadRoomMessages = useCallback(
    async (chatId: string) => {
      const myId = requireMemberId(memberId);
      const roomId = Number(chatId);
      if (!Number.isFinite(roomId)) return;

      const dtos = await fetchChatMessages(roomId, myId);
      const messages = apiMessagesToMessages(dtos, myId);
      const last = messages[messages.length - 1];

      setChats((prev) => {
        const next = prev.map((chat) =>
          chat.id === chatId
            ? mergeChatRoom(chat, {
                messages,
                lastMessagePreview: last?.text,
                updatedAt: last?.createdAt ?? chat.updatedAt,
              })
            : chat,
        );

        const current = next.find((c) => c.id === chatId);
        if (current && !current.productTitle) {
          void enrichRoomWithPost(current).then((enriched) => {
            setChats((inner) =>
              inner.map((room) => (room.id === chatId ? mergeChatRoom(room, enriched) : room)),
            );
          });
        }

        return next;
      });
    },
    [memberId],
  );

  const sendMessage = useCallback(
    async (chatId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const myId = requireMemberId(memberId);
      const roomId = Number(chatId);
      if (!Number.isFinite(roomId)) return;

      const optimistic: Message = {
        id: `pending-${Date.now()}`,
        messageId: -Date.now(),
        text: trimmed,
        sender: 'me',
        createdAt: Date.now(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? mergeChatRoom(chat, {
                messages: upsertMessage(chat.messages, optimistic),
                lastMessagePreview: trimmed,
                updatedAt: optimistic.createdAt,
              })
            : chat,
        ),
      );

      try {
        await chatStompClient.publishMessage(roomId, myId, trimmed);
      } catch (error) {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? mergeChatRoom(chat, {
                  messages: chat.messages.filter((m) => m.id !== optimistic.id),
                })
              : chat,
          ),
        );
        throw error;
      }
    },
    [memberId],
  );

  const markAsRead = useCallback(
    async (chatId: string) => {
      const myId = requireMemberId(memberId);
      const roomId = Number(chatId);
      if (!Number.isFinite(roomId)) return;

      setChats((prev) => {
        let changed = false;
        const next = prev.map((chat) => {
          if (chat.id !== chatId || chat.unreadCount === 0) return chat;
          changed = true;
          return { ...chat, unreadCount: 0 };
        });
        return changed ? next : prev;
      });

      try {
        await markChatRoomAsRead(roomId, { memberId: myId });
      } catch (error) {
        console.warn('[chat] 읽음 처리 실패:', error);
      }
    },
    [memberId],
  );

  const editMessage = useCallback(
    async (chatId: string, messageId: number, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const myId = requireMemberId(memberId);
      const dto = await updateChatMessage(messageId, { memberId: myId, message: trimmed });
      const mapped = apiMessageToMessage(dto, myId);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? mergeChatRoom(chat, {
                messages: upsertMessage(chat.messages, mapped),
                lastMessagePreview: mapped.deleted ? '삭제된 메시지입니다.' : mapped.text,
                updatedAt: mapped.createdAt,
              })
            : chat,
        ),
      );
    },
    [memberId],
  );

  const deleteMessage = useCallback(
    async (chatId: string, messageId: number) => {
      const myId = requireMemberId(memberId);
      const dto = await deleteChatMessage(messageId, { memberId: myId });
      const mapped = apiMessageToMessage(dto, myId);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? mergeChatRoom(chat, {
                messages: upsertMessage(chat.messages, mapped),
                lastMessagePreview: '삭제된 메시지입니다.',
                updatedAt: mapped.createdAt,
              })
            : chat,
        ),
      );
    },
    [memberId],
  );

  const totalUnreadCount = useMemo(
    () => chats.reduce((sum, c) => sum + c.unreadCount, 0),
    [chats],
  );

  const value = useMemo(
    () => ({
      chats,
      totalUnreadCount,
      roomsLoading,
      roomsError,
      refreshRooms,
      getChat,
      enterChatForProduct,
      loadRoomMessages,
      sendMessage,
      markAsRead,
      editMessage,
      deleteMessage,
      setActiveRoomId,
    }),
    [
      chats,
      totalUnreadCount,
      roomsLoading,
      roomsError,
      refreshRooms,
      getChat,
      enterChatForProduct,
      loadRoomMessages,
      sendMessage,
      markAsRead,
      editMessage,
      deleteMessage,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat은 ChatProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
