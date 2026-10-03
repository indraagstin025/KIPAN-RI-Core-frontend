import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { Backup } from '../types';

// listBackups: riwayat backup database (Super).
export function listBackups(page = 1, limit = 25): Promise<Paginated<Backup[]>> {
  return apiFetchPaginated<Backup[]>(`/admin/backups?page=${page}&limit=${limit}`);
}

// createBackup: jalankan pg_dump server-side & simpan arsip.
export function createBackup(): Promise<Backup> {
  return apiFetch<Backup>('/admin/backups', { method: 'POST' });
}

// downloadBackup: tiket unduh arsip backup.
export function downloadBackup(id: number): Promise<{ download_url: string }> {
  return apiFetch<{ download_url: string }>(`/admin/backups/${id}/download`);
}

// deleteBackup: hapus arsip + riwayat.
export function deleteBackup(id: number): Promise<void> {
  return apiFetch<void>(`/admin/backups/${id}`, { method: 'DELETE' });
}
