import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { Backup } from '../types';

// listBackups: riwayat backup database (Super).
export function listBackups(page = 1, limit = 25): Promise<Paginated<Backup[]>> {
  return apiFetchPaginated<Backup[]>(`/admin/backups?page=${page}&limit=${limit}`);
}

// createBackup: mulai pekerjaan backup async (202 + baris running).
// Klien poll getBackup sampai ready/failed.
export function createBackup(): Promise<Backup> {
  return apiFetch<Backup>('/admin/backups', { method: 'POST' });
}

// getBackup: satu entri (polling pekerjaan async).
export function getBackup(id: number): Promise<Backup> {
  return apiFetch<Backup>(`/admin/backups/${id}`);
}

// downloadBackup: tiket unduh arsip backup (wajib step-up via header).
export function downloadBackup(id: number, stepUpToken?: string): Promise<{ download_url: string }> {
  return apiFetch<{ download_url: string }>(`/admin/backups/${id}/download`, {
    headers: stepUpToken ? { 'X-StepUp-Token': stepUpToken } : undefined,
  });
}

// deleteBackup: hapus arsip + riwayat.
export function deleteBackup(id: number): Promise<void> {
  return apiFetch<void>(`/admin/backups/${id}`, { method: 'DELETE' });
}
