import { apiFetch } from '@/services/apiClient';
import type { AuthUser, LoginResult } from '../types';

export function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/auth/login', { method: 'POST', data: { email, password } });
}

export function logout(): Promise<null> {
  return apiFetch<null>('/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
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
