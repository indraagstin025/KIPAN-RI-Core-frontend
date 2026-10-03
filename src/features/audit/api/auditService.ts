import { api, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { ActivityLog, AuditQuery } from '../types';

function toParams(q: AuditQuery): string {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.aksi) p.set('aksi', q.aksi);
  if (q.entitas) p.set('entitas', q.entitas);
  if (q.aktor) p.set('aktor', q.aktor);
  if (q.dari) p.set('dari', q.dari);
  if (q.ke) p.set('ke', q.ke);
  return p.toString();
}

// listAudit: penelusuran jejak audit terfilter.
export function listAudit(q: AuditQuery): Promise<Paginated<ActivityLog[]>> {
  return apiFetchPaginated<ActivityLog[]>(`/admin/audit?${toParams(q)}`);
}

// exportAudit: unduh CSV jejak audit (blob via axios agar ber-otorisasi).
export async function exportAudit(q: AuditQuery): Promise<void> {
  const res = await api.get(`/admin/audit/export.csv?${toParams(q)}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jejak-audit.csv';
  link.click();
  URL.revokeObjectURL(url);
}
