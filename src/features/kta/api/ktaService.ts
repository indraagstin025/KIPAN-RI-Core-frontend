import { apiFetch } from '@/services/apiClient';
import type { KtaDownload, KtaVerification } from '../types';

// verifyKta: endpoint publik, verdict kriptografis (tanpa oracle).
export function verifyKta(nia: string, sig: string): Promise<KtaVerification> {
  const q = sig.trim() ? `?sig=${encodeURIComponent(sig.trim())}` : '';
  return apiFetch<KtaVerification>(`/pendaftaran/kta/${encodeURIComponent(nia.trim())}${q}`);
}

// getMyKta: tiket unduh KTA milik akun USER sendiri.
export function getMyKta(): Promise<KtaDownload> {
  return apiFetch<KtaDownload>('/user/kta');
}
