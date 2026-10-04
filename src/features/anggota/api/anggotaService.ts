import { api, apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { AnggotaCreateInput, AnggotaDetail, AnggotaListItem, AnggotaPublicInfo, AnggotaQuery, AnggotaUpdateInput } from '../types';

export function checkPublic(nia: string): Promise<AnggotaPublicInfo> {
  return apiFetch<AnggotaPublicInfo>(`/anggota/cek?q=${encodeURIComponent(nia)}`);
}

export function adminListAnggota(q: AnggotaQuery): Promise<Paginated<AnggotaListItem[]>> {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.status) p.set('status', q.status);
  if (q.search) p.set('search', q.search);
  return apiFetchPaginated<AnggotaListItem[]>(`/admin/anggota?${p.toString()}`);
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
export async function adminListAnggotaCursor(q: AnggotaCursorQuery): Promise<CursorResult<AnggotaListItem[]>> {
  const p = new URLSearchParams();
  p.set('paginate', 'cursor');
  p.set('limit', String(q.limit ?? 25));
  if (q.status) p.set('status', q.status);
  if (q.search) p.set('search', q.search);
  if (q.cursor) p.set('cursor', q.cursor);
  const res = await apiFetchPaginated<AnggotaListItem[]>(`/admin/anggota?${p.toString()}`);
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

// adminCreateAnggota: tambah anggota langsung (di luar alur pendaftaran).
export function adminCreateAnggota(input: AnggotaCreateInput): Promise<AnggotaDetail> {
  return apiFetch<AnggotaDetail>('/admin/anggota', { method: 'POST', data: input });
}

// adminUpdateAnggota: sunting data anggota.
export function adminUpdateAnggota(id: number, input: AnggotaUpdateInput): Promise<AnggotaDetail> {
  return apiFetch<AnggotaDetail>(`/admin/anggota/${id}`, { method: 'PUT', data: input });
}

// adminSetAnggotaStatus: ubah status keanggotaan (soft delete = NONAKTIF).
export function adminSetAnggotaStatus(id: number, status: string): Promise<AnggotaDetail> {
  return apiFetch<AnggotaDetail>(`/admin/anggota/${id}/status`, { method: 'PATCH', data: { status } });
}

// adminDeactivateAnggota: soft delete via DELETE.
export function adminDeactivateAnggota(id: number): Promise<void> {
  return apiFetch<void>(`/admin/anggota/${id}`, { method: 'DELETE' });
}

// adminExportAnggota: unduh CSV ter-scope (blob via axios agar ber-otorisasi).
export async function adminExportAnggota(status?: string, search?: string): Promise<void> {
  const p = new URLSearchParams();
  if (status) p.set('status', status);
  if (search) p.set('search', search);
  const qs = p.toString();
  const res = await api.get(`/admin/anggota/export.csv${qs ? `?${qs}` : ''}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'data-anggota.csv';
  link.click();
  URL.revokeObjectURL(url);
}
