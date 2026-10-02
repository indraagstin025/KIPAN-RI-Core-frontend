import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { ApprovalAction, ApprovalResult, MeScope, PendaftaranDetail, QueueItem, QueueQuery } from '../types';

export function listQueue(q: QueueQuery): Promise<Paginated<QueueItem[]>> {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.status) p.set('status', q.status);
  return apiFetchPaginated<QueueItem[]>(`/admin/pendaftaran?${p.toString()}`);
}

export function getDetail(id: number): Promise<PendaftaranDetail> {
  return apiFetch<PendaftaranDetail>(`/admin/pendaftaran/${id}`);
}

export function revealNik(id: number): Promise<{ nik: string }> {
  return apiFetch<{ nik: string }>(`/admin/pendaftaran/${id}/nik`);
}

export function processApproval(id: number, action: ApprovalAction, catatan = ''): Promise<ApprovalResult> {
  return apiFetch<ApprovalResult>(`/admin/pendaftaran/${id}/${action}`, {
    method: 'POST',
    data: { catatan },
  });
}

export function getMeScope(): Promise<MeScope> {
  return apiFetch<MeScope>('/admin/me-scope');
}

export function checkSuperOnly(): Promise<null> {
  return apiFetch<null>('/admin/super-only');
}

export function checkNasionalOrSuper(): Promise<null> {
  return apiFetch<null>('/admin/nasional-or-super');
}
