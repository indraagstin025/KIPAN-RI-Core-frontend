import { api, apiFetch } from '@/services/apiClient';
import type { LaporanData } from '../types';

// getLaporan: agregat laporan & statistik ter-scope.
export function getLaporan(): Promise<LaporanData> {
  return apiFetch<LaporanData>('/admin/laporan');
}

// exportLaporan: unduh CSV laporan (blob via axios agar ber-otorisasi).
export async function exportLaporan(): Promise<void> {
  const res = await api.get('/admin/laporan/export.csv', { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'laporan.csv';
  link.click();
  URL.revokeObjectURL(url);
}
