import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { DsarRequest } from '../types';

// fileDsar: ajukan permohonan hak data (anggota untuk dirinya sendiri).
export function fileDsar(jenis: string, detail?: string): Promise<DsarRequest> {
  return apiFetch<DsarRequest>('/akun/dsar', {
    method: 'POST',
    data: { jenis, ...(detail ? { detail } : {}) },
  });
}

// myDsar: riwayat permohonan milik sendiri.
export function myDsar(): Promise<DsarRequest[]> {
  return apiFetch<DsarRequest[]>('/akun/dsar');
}

// listDsar: antrean ter-scope (admin).
export function listDsar(page = 1, limit = 25, status = ''): Promise<Paginated<DsarRequest[]>> {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) p.set('status', status);
  return apiFetchPaginated<DsarRequest[]>(`/admin/dsar?${p.toString()}`);
}

// decideDsar: putusan admin (diproses/selesai/ditolak + catatan).
export function decideDsar(id: number, status: string, catatan = ''): Promise<DsarRequest> {
  return apiFetch<DsarRequest>(`/admin/dsar/${id}`, {
    method: 'PATCH',
    data: { status, catatan },
  });
}
