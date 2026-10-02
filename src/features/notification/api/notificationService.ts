import { apiFetch } from '@/services/apiClient';
import type { AppNotification } from '../types';

export function listMine(limit = 25): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>(`/notifications/me?limit=${limit}`);
}

export function markRead(id: number): Promise<null> {
  return apiFetch<null>(`/notifications/${id}/read`, { method: 'POST' });
}
