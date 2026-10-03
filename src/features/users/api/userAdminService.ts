import { apiFetch, apiFetchPaginated, type Paginated } from '@/services/apiClient';
import type { AdminUser, AdminUserCounts, UserCreateInput, UserListQuery, UserMutationResult, UserUpdateInput } from '../types';

export function adminUserCounts(): Promise<AdminUserCounts> {
  return apiFetch<AdminUserCounts>('/admin/users/counts');
}

export function adminListUsers(q: UserListQuery): Promise<Paginated<AdminUser[]>> {
  const p = new URLSearchParams();
  p.set('page', String(q.page ?? 1));
  p.set('limit', String(q.limit ?? 10));
  if (q.role) p.set('role', q.role);
  if (q.status) p.set('status', q.status);
  if (q.search) p.set('search', q.search);
  return apiFetchPaginated<AdminUser[]>(`/admin/users?${p.toString()}`);
}

export function adminCreateUser(input: UserCreateInput): Promise<UserMutationResult> {
  return apiFetch<UserMutationResult>('/admin/users', { method: 'POST', data: input });
}

export function adminUpdateUser(id: string, input: UserUpdateInput): Promise<UserMutationResult> {
  return apiFetch<UserMutationResult>(`/admin/users/${id}`, { method: 'PUT', data: input });
}

export function adminDeleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' });
}
