import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { INITIAL_CHATS } from '@/src/data/mock-chats';
import type { ChatRoom, Message } from '@/src/types/chat';
import type { Product } from '@/src/types/product';

type ChatContextValue = {
  chats: ChatRoom[];
  totalUnreadCount: number;
  getChat: (chatId: string) => ChatRoom | undefined;
  ensureChatForProduct: (product: Product) => string;
  sendMessage: (chatId: string, text: string) => void;
  markAsRead: (chatId: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

let messageIdCounter = 1000;
const generateMessageId = () => `m${++messageIdCounter}`;

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatRoom[]>(INITIAL_CHATS);

  const getChat = useCallback(
    (chatId: string) => chats.find((c) => c.id === chatId),
    [chats],
  );

  const ensureChatForProduct = useCallback((product: Product): string => {
    let createdChatId: string | null = null;

    setChats((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        createdChatId = existing.id;
        return prev;
      }

      const newChat: ChatRoom = {
        id: `chat-${product.id}-${Date.now()}`,
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        productImageUrl: product.imageUrl,
        otherUserName: product.seller.name,
        otherUserProfileImage: product.seller.profileImageUrl,
        otherUserLocation: product.location,
        messages: [],
        unreadCount: 0,
        updatedAt: Date.now(),
      };

      createdChatId = newChat.id;
      return [newChat, ...prev];
    });

    return createdChatId!;
  }, []);

  const sendMessage = useCallback((chatId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        const message: Message = {
          id: generateMessageId(),
          text: trimmed,
          sender: 'me',
          createdAt: Date.now(),
        };
        return {
          ...chat,
          messages: [...chat.messages, message],
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const markAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)),
    );
  }, []);

  const totalUnreadCount = useMemo(
    () => chats.reduce((sum, c) => sum + c.unreadCount, 0),
    [chats],
  );

  const value = useMemo(
    () => ({
      chats,
      totalUnreadCount,
      getChat,
      ensureChatForProduct,
      sendMessage,
      markAsRead,
    }),
    [chats, totalUnreadCount, getChat, ensureChatForProduct, sendMessage, markAsRead],
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
