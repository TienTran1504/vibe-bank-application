export type NotificationCategory = 'TRANSACTION' | 'KYC' | 'FRAUD' | 'WALLET' | 'SYSTEM';
export type NotificationChannel  = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';
export type NotificationStatus   = 'SENT' | 'FAILED' | 'PENDING';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationCategory;
  channel: NotificationChannel;
  title: string;
  body: string;
  status: NotificationStatus;
  read: boolean;
  sentAt: string | null;
  createdAt: string | null;
  metadata?: Record<string, unknown>;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
