import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type {
  Jabatan,
  JabatanInput,
  PengurusDetail,
  PengurusQuery,
  PengurusStats,
  PengurusStatus,
  PromosiCandidate,
  SKApprovalAction,
  SKCreateInput,
  SKDetail,
  SKListItem,
  SKQuery,
  SKStatus,
  SuratKeputusan,
} from '../types';

// ============================================================
// JABATAN (MASTER)
// ============================================================

export function adminListJabatan(includeInactive = false): Promise<Jabatan[]> {
  const p = new URLSearchParams();
  p.set('include_inactive', String(includeInactive));
  return apiFetch<Jabatan[]>(`/admin/jabatan?${p.toString()}`);
}

export function adminCreateJabatan(input: JabatanInput): Promise<Jabatan> {
  return apiFetch<Jabatan>('/admin/jabatan', { method: 'POST', data: input });
}

export function adminUpdateJabatan(id: number, input: JabatanInput): Promise<Jabatan> {
  return apiFetch<Jabatan>(`/admin/jabatan/${id}`, { method: 'PUT', data: input });
}

// ============================================================
// SURAT KEPUTUSAN
// ============================================================

export function adminListSK(q: SKQuery): Promise<Paginated<SKListItem[]>> {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.level) p.set('level', q.level);
  if (q.status) p.set('status', q.status);
  if (q.approval) p.set('approval', q.approval);
  if (q.search) p.set('search', q.search);
  return apiFetchPaginated<SKListItem[]>(`/admin/sk?${p.toString()}`);
}

export function adminCreateSK(input: SKCreateInput): Promise<SuratKeputusan> {
  return apiFetch<SuratKeputusan>('/admin/sk', { method: 'POST', data: input });
}

export function adminGetSK(id: number): Promise<SKDetail> {
  return apiFetch<SKDetail>(`/admin/sk/${id}`);
}

export function adminApproveSK(id: number, action: SKApprovalAction, catatan = ''): Promise<void> {
  return apiFetch<void>(`/admin/sk/${id}/approve`, { method: 'POST', data: { action, catatan } });
}

export function adminSetSKStatus(id: number, status: SKStatus, statusPengurus?: string, keterangan?: string): Promise<void> {
  return apiFetch<void>(`/admin/sk/${id}/status`, {
    method: 'POST',
    data: { status, status_pengurus: statusPengurus, keterangan },
  });
}

// ============================================================
// PENGURUS
// ============================================================

export function adminAddPengurus(skId: number, anggotaId: number, jabatanId: number, konfirmasi: boolean, tanggalMulai?: string): Promise<PengurusDetail> {
  return apiFetch<PengurusDetail>(`/admin/sk/${skId}/pengurus`, {
    method: 'POST',
    data: { anggota_id: anggotaId, jabatan_id: jabatanId, konfirmasi, tanggal_mulai: tanggalMulai },
  });
}

export function adminRemovePengurus(skId: number, pengurusId: number): Promise<void> {
  return apiFetch<void>(`/admin/sk/${skId}/pengurus/${pengurusId}`, { method: 'DELETE' });
}

export function adminListPengurus(q: PengurusQuery): Promise<Paginated<PengurusDetail[]>> {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.level) p.set('level', q.level);
  if (q.status) p.set('status', q.status);
  if (q.masa_jabatan) p.set('masa_jabatan', q.masa_jabatan);
  if (q.provinsi_id) p.set('provinsi_id', String(q.provinsi_id));
  if (q.kabupaten_id) p.set('kabupaten_id', String(q.kabupaten_id));
  if (q.search) p.set('search', q.search);
  return apiFetchPaginated<PengurusDetail[]>(`/admin/pengurus?${p.toString()}`);
}

export function adminPengurusStats(): Promise<PengurusStats> {
  return apiFetch<PengurusStats>('/admin/pengurus/stats');
}

export function adminListPromosi(search: string, limit = 20): Promise<PromosiCandidate[]> {
  const p = new URLSearchParams();
  p.set('limit', String(limit));
  if (search) p.set('search', search);
  return apiFetch<PromosiCandidate[]>(`/admin/pengurus/promosi?${p.toString()}`);
}

export function adminUpdatePengurusStatus(id: number, status: PengurusStatus, keterangan = ''): Promise<void> {
  return apiFetch<void>(`/admin/pengurus/${id}`, { method: 'PATCH', data: { status, keterangan } });
}

export function adminUpdatePengurusJabatan(id: number, jabatanId: number): Promise<PengurusDetail> {
  return apiFetch<PengurusDetail>(`/admin/pengurus/${id}/jabatan`, { method: 'PATCH', data: { jabatan_id: jabatanId } });
}
