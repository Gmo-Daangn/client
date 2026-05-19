import type { NotificationItem } from '@/src/types/notification';

export function createLocalChatNotification(input: {
  roomId: number;
  messageId: number;
  receiverId: number;
  title: string;
  message: string;
}): NotificationItem {
  const stableId = input.messageId > 0 ? -input.messageId : -Date.now();

  return {
    id: stableId,
    receiverId: input.receiverId,
    templateType: 'CHAT',
    templateTitle: input.title,
    identifier: input.roomId,
    message: input.message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
}
