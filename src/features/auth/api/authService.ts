import { apiFetch } from '@/services/apiClient';
import { MfaRequiredError, MfaSetupRequiredError, type AuthUser, type LoginMFAChallenge, type LoginMFASetup, type LoginResult } from '../types';

export function login(email: string, password: string, turnstileToken?: string): Promise<LoginResult> {
  return apiFetch<LoginResult | LoginMFAChallenge | LoginMFASetup>('/auth/login', { method: 'POST', data: { email, password, ...(turnstileToken ? { turnstile_token: turnstileToken } : {}) } }).then((res) => {
    if ((res as LoginMFAChallenge).mfa_required) {
      throw new MfaRequiredError(res as LoginMFAChallenge);
    }
    if ((res as LoginMFASetup).mfa_setup_required) {
      throw new MfaSetupRequiredError((res as LoginMFASetup).enroll_token);
    }
    return res as LoginResult;
  });
}

// verifyMfa: tukar challenge + kode TOTP dengan sesi penuh (login tahap-2).
export function verifyMfa(challengeToken: string, code: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/auth/mfa/verify', { method: 'POST', data: { challenge_token: challengeToken, code } });
}

export interface MfaSetupResult {
  setup_token: string;
  otpauth_url: string;
  secret: string;
  expires_in: number;
}

// setupMfa: mulai pendaftaran MFA (butuh sesi penuh + password ulang).
export function setupMfa(password: string): Promise<MfaSetupResult> {
  return apiFetch<MfaSetupResult>('/auth/mfa/setup', { method: 'POST', data: { password } });
}

// confirmMfa: aktifkan MFA setelah kode pertama valid. Mengembalikan kode
// darurat (sekali tampil).
export function confirmMfa(setupToken: string, code: string): Promise<{ recovery_codes: string[] }> {
  return apiFetch<{ recovery_codes: string[] }>('/auth/mfa/confirm', { method: 'POST', data: { setup_token: setupToken, code } });
}

// resetMfa: nonaktifkan MFA akun lain (Super Admin, alasan wajib).
export function resetMfa(userId: string, reason: string): Promise<null> {
  return apiFetch<null>(`/admin/users/${encodeURIComponent(userId)}/mfa/reset`, { method: 'POST', data: { reason } });
}

// enrollSetup: mulai enroll MFA via tiket enroll (tanpa sesi).
export function enrollSetup(enrollToken: string): Promise<MfaSetupResult> {
  return apiFetch<MfaSetupResult>('/auth/mfa/enroll-setup', { method: 'POST', data: { enroll_token: enrollToken } });
}

// enrollConfirm: selesaikan enroll via tiket setup (tanpa sesi).
// Mengembalikan kode darurat (sekali tampil).
export function enrollConfirm(setupToken: string, code: string): Promise<{ recovery_codes: string[] }> {
  return apiFetch<{ recovery_codes: string[] }>('/auth/mfa/enroll-confirm', { method: 'POST', data: { setup_token: setupToken, code } });
}

// requestStepUp: verifikasi ulang untuk operasi sensitif (AUTH-20).
// Mengembalikan token sekali pakai (5 menit) via header X-StepUp-Token +
// grace Buka NIK K8 (nik_grace_expires_in, detik, untuk banner).
export function requestStepUp(password: string, code?: string): Promise<{ token: string; expires_in: number; nik_grace_expires_in?: number }> {
  return apiFetch<{ token: string; expires_in: number; nik_grace_expires_in?: number }>('/auth/step-up', {
    method: 'POST',
    data: { password, ...(code ? { code } : {}) },
  });
}

// nikGraceStatus: grace Buka NIK aktif + sisa detik (K8, untuk banner).
export function nikGraceStatus(): Promise<{ active: boolean; expires_in: number }> {
  return apiFetch<{ active: boolean; expires_in: number }>('/auth/step-up/grace');
}

// lockNikGrace: kunci manual grace Buka NIK (K8).
export function lockNikGrace(): Promise<null> {
  return apiFetch<null>('/auth/step-up/grace', { method: 'DELETE' });
}

export function logout(): Promise<null> {
  return apiFetch<null>('/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
}

export interface UserSession {
  family_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
}

export interface SessionsResult {
  sessions: UserSession[];
  current: string | null;
}

// getMySessions: daftar sesi aktif milik sendiri + penanda sesi ini.
export function getMySessions(): Promise<SessionsResult> {
  return apiFetch<SessionsResult>('/auth/sessions');
}

// revokeSession: cabut satu sesi milik sendiri.
export function revokeSession(familyId: string): Promise<null> {
  return apiFetch<null>(`/auth/sessions/${encodeURIComponent(familyId)}`, { method: 'DELETE' });
}

export function changePassword(oldPassword: string, newPassword: string): Promise<null> {
  return apiFetch<null>('/auth/password', {
    method: 'PUT',
    data: { old_password: oldPassword, new_password: newPassword },
  });
}

export function forgotPassword(email: string): Promise<null> {
  return apiFetch<null>('/auth/forgot-password', { method: 'POST', data: { email } });
}

export function resetPassword(token: string, newPassword: string): Promise<null> {
  return apiFetch<null>('/auth/reset-password', {
    method: 'POST',
    data: { token, new_password: newPassword },
  });
}

export function setPassword(token: string, newPassword: string): Promise<null> {
  return apiFetch<null>('/auth/set-password', {
    method: 'POST',
    data: { token, new_password: newPassword },
  });
}
