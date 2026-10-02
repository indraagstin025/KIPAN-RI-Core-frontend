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

export function adminGetAnggota(id: number): Promise<AnggotaDetail> {
  return apiFetch<AnggotaDetail>(`/admin/anggota/${id}`);
}

// adminKtaUrl: tiket unduh PDF KTA anggota (admin, tercatat audit).
export function adminKtaUrl(id: number): Promise<{ download_url: string }> {
  return apiFetch<{ download_url: string }>(`/admin/anggota/${id}/kta`);
}

// resetMemberPassword (T1): password baru tampil SEKALI; sesi anggota dicabut.
export function resetMemberPassword(id: number): Promise<{ one_time_password: string }> {
  return apiFetch<{ one_time_password: string }>(`/admin/anggota/${id}/reset-password`, { method: 'POST' });
}
