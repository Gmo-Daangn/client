import type { ChatMessageDto, ChatRoomListItem } from '@/src/types/chat-api';
import type { ChatRoom, Message } from '@/src/types/chat';
import type { Product } from '@/src/types/product';

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/danggn-post/800';

export function postImageUrl(productId: number | string) {
  return `https://picsum.photos/seed/post-${productId}/800`;
}

export function profileImageUrl(nickname: string) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(nickname)}`;
}

export function apiMessageToMessage(dto: ChatMessageDto, myMemberId: number): Message {
  return {
    id: String(dto.messageId),
    messageId: dto.messageId,
    text: dto.deleted ? '삭제된 메시지입니다.' : dto.message,
    sender: dto.senderId === myMemberId ? 'me' : 'other',
    createdAt: new Date(dto.createdAt).getTime(),
    edited: dto.edited,
    deleted: dto.deleted,
  };
}

export function apiMessagesToMessages(dtos: ChatMessageDto[], myMemberId: number): Message[] {
  return dtos.map((dto) => apiMessageToMessage(dto, myMemberId));
}

export function apiRoomListItemToChatRoom(item: ChatRoomListItem): ChatRoom {
  const updatedAt = new Date(item.lastMessageCreatedAt).getTime();

  return {
    id: String(item.roomId),
    roomId: item.roomId,
    productId: String(item.productId),
    productTitle: '',
    productPrice: 0,
    productImageUrl: postImageUrl(item.productId),
    otherMemberId: item.otherMemberId,
    otherUserName: item.otherMemberNickname,
    otherUserProfileImage: profileImageUrl(item.otherMemberNickname),
    otherUserLocation: '',
    messages: [],
    lastMessagePreview: item.lastMessage,
    unreadCount: item.unreadMessageCount,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
  };
}

export function createChatRoomFromProduct(input: {
  roomId: number;
  product: Product;
  otherMemberId: number;
}): ChatRoom {
  const { roomId, product, otherMemberId } = input;

  return {
    id: String(roomId),
    roomId,
    productId: product.id,
    productTitle: product.title,
    productPrice: product.price,
    productImageUrl: product.imageUrl || postImageUrl(product.id),
    otherMemberId,
    otherUserName: product.seller.name,
    otherUserProfileImage: product.seller.profileImageUrl || profileImageUrl(product.seller.name),
    otherUserLocation: product.location,
    messages: [],
    lastMessagePreview: undefined,
    unreadCount: 0,
    updatedAt: Date.now(),
  };
}

export function mergeChatRoom(base: ChatRoom, patch: Partial<ChatRoom>): ChatRoom {
  return { ...base, ...patch };
}

export function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.createdAt - b.createdAt);
}

export function upsertMessage(messages: Message[], next: Message): Message[] {
  const index = messages.findIndex((m) => m.messageId === next.messageId);
  if (index === -1) return sortMessages([...messages, next]);
  const copy = [...messages];
  copy[index] = next;
  return sortMessages(copy);
}

export { PLACEHOLDER_IMAGE };
