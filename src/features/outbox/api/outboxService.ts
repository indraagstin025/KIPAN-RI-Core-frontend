import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { OutboxItem, OutboxQuery } from '../types';

export function listOutbox(q: OutboxQuery): Promise<Paginated<OutboxItem[]>> {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.jenis) p.set('jenis', q.jenis);
  if (q.status) p.set('status', q.status);
  return apiFetchPaginated<OutboxItem[]>(`/admin/email-outbox?${p.toString()}`);
}

export function retryOutbox(id: number): Promise<void> {
  return apiFetch<void>(`/admin/email-outbox/${id}/retry`, { method: 'POST' });
}

// sendOutboxNow: kirim satu email SEKARANG (sinkron), tanpa menunggu worker.
export function sendOutboxNow(id: number): Promise<void> {
  return apiFetch<void>(`/admin/email-outbox/${id}/send`, { method: 'POST' });
}

export function retryPendingOutbox(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/admin/email-outbox/retry-pending', { method: 'POST' });
}

export function retryManyOutbox(ids: number[]): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/admin/email-outbox/retry', { method: 'POST', data: { ids } });
}
