export type Channel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';

export type NotifType =
  | 'ALERT_BROADCAST'
  | 'TASK_ASSIGNED'
  | 'APPLICATION_UPDATE'
  | 'ACHIEVEMENT_EARNED'
  | 'SYSTEM'
  | 'CHAT';

export interface NotificationPreference {
  prefId: number;
  userId: number;
  userEmail: string;
  type: NotifType;
  channels: Channel[];
  enabled: boolean;
  quietHoursFrom: string | null;
  quietHoursTo: string | null;
}

export interface NotificationPreferenceRequest {
  userId: number;
  type: NotifType;
  channels: Channel[];
  enabled: boolean;
  quietHoursFrom: string | null;
  quietHoursTo: string | null;
}