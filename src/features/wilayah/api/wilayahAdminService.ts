import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { WilayahAdminItem, WilayahCards, WilayahDetail, WilayahType } from '../types';

interface ListQuery {
  type: WilayahType;
  search?: string;
  status?: string;
  provinsi_id?: number;
  page?: number;
  limit?: number;
}

export function wilayahCards(): Promise<WilayahCards> {
  return apiFetch<WilayahCards>('/admin/wilayah/cards');
}

export function wilayahList(q: ListQuery): Promise<Paginated<WilayahAdminItem[]>> {
  const p = new URLSearchParams();
  p.set('type', q.type);
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 25));
  if (q.search) p.set('search', q.search);
  if (q.status) p.set('status', q.status);
  if (q.provinsi_id) p.set('provinsi_id', String(q.provinsi_id));
  return apiFetchPaginated<WilayahAdminItem[]>(`/admin/wilayah?${p.toString()}`);
}

export function wilayahDetail(type: WilayahType, id: number): Promise<WilayahDetail> {
  return apiFetch<WilayahDetail>(`/admin/wilayah/${type}/${id}/detail`);
}

export function wilayahSetStatus(type: WilayahType, id: number, isActive: boolean): Promise<void> {
  return apiFetch<void>(`/admin/wilayah/${type}/${id}`, { method: 'PATCH', data: { is_active: isActive } });
}

export function wilayahAdd(type: WilayahType, provinsiId: number, kabupatenId = 0): Promise<void> {
  return apiFetch<void>('/admin/wilayah', {
    method: 'POST',
    data: { type, provinsi_id: provinsiId, kabupaten_id: kabupatenId },
  });
}
