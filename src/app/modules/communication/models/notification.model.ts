export type Channel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';

export type NotifType =
  | 'ALERT_BROADCAST'
  | 'TASK_ASSIGNED'
  | 'APPLICATION_UPDATE'
  | 'ACHIEVEMENT_EARNED'
  | 'SYSTEM'
  | 'CHAT';

export interface Notification {
  notificationId: number;
  recipientId: number;
  recipientEmail: string;
  type: NotifType;
  title: string;
  body: string;
  data: string;
  channel: Channel;
  isRead: boolean;
  isCritical: boolean;
  sentAt: string;
  readAt: string | null;
}

export interface NotificationRequest {
  recipientId: number;
  type: NotifType;
  title: string;
  body: string;
  data: string;
  channel: Channel;
  isRead: boolean;
  isCritical: boolean;
  sentAt?: string | null;
  readAt?: string | null;
}