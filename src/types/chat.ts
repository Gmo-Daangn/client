export type Message = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  createdAt: number;
};

export type ChatRoom = {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  otherUserName: string;
  otherUserProfileImage: string;
  otherUserLocation: string;
  messages: Message[];
  unreadCount: number;
  updatedAt: number;
};
