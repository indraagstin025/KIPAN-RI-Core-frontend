import { apiFetch } from '@/services/apiClient';
import type { RevisionSubmit, RevisionTokenRequest, RevisionTokenResult, TrackingResult } from '../types';

export function getTracking(nomor: string): Promise<TrackingResult> {
  return apiFetch<TrackingResult>(`/pendaftaran/track/${encodeURIComponent(nomor)}`);
}

export function requestRevisionToken(payload: RevisionTokenRequest): Promise<RevisionTokenResult> {
  return apiFetch<RevisionTokenResult>('/pendaftaran/revisi/request-token', { method: 'POST', data: payload });
}

export function submitRevision(nomor: string, payload: RevisionSubmit): Promise<null> {
  return apiFetch<null>(`/pendaftaran/revisi/${encodeURIComponent(nomor)}`, { method: 'PUT', data: payload });
}
