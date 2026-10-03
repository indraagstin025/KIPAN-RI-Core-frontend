import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { AnggotaDetail, AnggotaPublicInfo, AnggotaQuery } from '../types';

export function checkPublic(nia: string): Promise<AnggotaPublicInfo> {
  return apiFetch<AnggotaPublicInfo>(`/anggota/cek?q=${encodeURIComponent(nia)}`);
}

export function adminListAnggota(q: AnggotaQuery): Promise<Paginated<AnggotaDetail[]>> {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.status) p.set('status', q.status);
  if (q.search) p.set('search', q.search);
  return apiFetchPaginated<AnggotaDetail[]>(`/admin/anggota?${p.toString()}`);
}

export interface AnggotaCursorQuery {
  limit?: number;
  status?: string;
  search?: string;
  cursor?: string;
}

export interface CursorResult<T> {
  data: T;
  nextCursor: string;
}

// adminListAnggotaCursor: keyset pagination (tanpa COUNT/OFFSET besar).
export async function adminListAnggotaCursor(q: AnggotaCursorQuery): Promise<CursorResult<AnggotaDetail[]>> {
  const p = new URLSearchParams();
  p.set('paginate', 'cursor');
  p.set('limit', String(q.limit ?? 25));
  if (q.status) p.set('status', q.status);
  if (q.search) p.set('search', q.search);
  if (q.cursor) p.set('cursor', q.cursor);
  const res = await apiFetchPaginated<AnggotaDetail[]>(`/admin/anggota?${p.toString()}`);
  return { data: res.data, nextCursor: res.meta.next_cursor ?? '' };
}

export function adminGetAnggota(id: number): Promise<AnggotaDetail> {
  return apiFetch<AnggotaDetail>(`/admin/anggota/${id}`);
}

// adminKtaUrl: tiket unduh PDF KTA anggota (admin, tercatat audit).
export function adminKtaUrl(id: number): Promise<{ download_url: string }> {
  return apiFetch<{ download_url: string }>(`/admin/anggota/${id}/kta`);
}

// resetMemberPassword (T1): menerbitkan tautan set-password (dikirim ke email
// anggota via antrian). Tidak ada password di respons admin.
export function resetMemberPassword(id: number): Promise<void> {
  return apiFetch<void>(`/admin/anggota/${id}/reset-password`, { method: 'POST' });
}
