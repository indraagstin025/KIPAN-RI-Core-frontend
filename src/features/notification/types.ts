export type NotificationType = 'PENDAFTARAN' | 'VERIFIKASI' | 'SK' | 'SISTEM';

export interface AppNotification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  created_at: string;
}
