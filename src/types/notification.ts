export type NotificationTemplateType = 'CHAT' | string;

export type NotificationItem = {
  id: number;
  receiverId: number;
  templateType: NotificationTemplateType;
  templateTitle: string;
  identifier: number;
  message: string;
  isRead: boolean;
  createdAt: string | null;
};
