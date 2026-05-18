export type Message = {
  id: string;
  messageId: number;
  text: string;
  sender: 'me' | 'other';
  createdAt: number;
  edited?: boolean;
  deleted?: boolean;
};

export type ChatRoom = {
  id: string;
  roomId: number;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  otherMemberId: number;
  otherUserName: string;
  otherUserProfileImage: string;
  otherUserLocation: string;
  messages: Message[];
  lastMessagePreview?: string;
  unreadCount: number;
  updatedAt: number;
};
