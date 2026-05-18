export type EnterChatRoomRequest = {
  memberId: number;
  targetMemberId: number;
  productId?: number;
};

export type EnterChatRoomResponse = {
  roomId: number;
  created: boolean;
  message: string;
};

export type ChatRoomListItem = {
  roomId: number;
  productId: number;
  otherMemberId: number;
  otherMemberNickname: string;
  lastMessage: string;
  lastMessageCreatedAt: string;
  unreadMessageCount: number;
};

export type ReadChatRoomRequest = {
  memberId: number;
};

export type ReadChatRoomResponse = {
  roomId: number;
  memberId: number;
  readMessageCount: number;
};

export type ChatMessageDto = {
  messageId: number;
  roomId: number;
  senderId: number;
  message: string;
  edited: boolean;
  deleted: boolean;
  unreadCount: number;
  createdAt: string;
};

export type UpdateChatMessageRequest = {
  memberId: number;
  message: string;
};

export type DeleteChatMessageRequest = {
  memberId: number;
};

export type PublishChatMessagePayload = {
  memberId: number;
  message: string;
};
