import { apiFetch } from '@/services/apiClient';
import type { PendaftaranCreated, PendaftaranSubmit } from '../types';

export function submitPendaftaran(payload: PendaftaranSubmit): Promise<PendaftaranCreated> {
  return apiFetch<PendaftaranCreated>('/pendaftaran', { method: 'POST', data: payload });
}
