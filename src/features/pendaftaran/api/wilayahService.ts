import { apiFetch } from '@/services/apiClient';
import type { WilayahKabupaten, WilayahProvinsi } from '../types';

export function listProvinsi(): Promise<WilayahProvinsi[]> {
  return apiFetch<WilayahProvinsi[]>('/wilayah/provinsi');
}

export function listKabupaten(provinsiId: number): Promise<WilayahKabupaten[]> {
  return apiFetch<WilayahKabupaten[]>(`/wilayah/kabupaten/${provinsiId}`);
}
