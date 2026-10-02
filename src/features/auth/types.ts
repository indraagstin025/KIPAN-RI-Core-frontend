export type Role = 'SUPER_ADMIN' | 'ADMIN_NASIONAL' | 'ADMIN_PROVINSI' | 'ADMIN_KABUPATEN' | 'USER';
export type UserTipe = 'KADER' | 'PENGURUS';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tipe_user?: UserTipe;
  status: string;
  provinsi_id?: number;
  provinsi_nama?: string;
  kabupaten_id?: number;
  kabupaten_nama?: string;
  wilayah: string;
  avatar_url?: string;
}

export interface LoginResult {
  access_token: string;
  expires_in: number;
  user: AuthUser;
}

export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN_NASIONAL', 'ADMIN_PROVINSI', 'ADMIN_KABUPATEN'];

export function isAdminRole(role?: Role | null): boolean {
  return role ? ADMIN_ROLES.includes(role) : false;
}
