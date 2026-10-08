export type Role = 'SUPER_ADMIN' | 'ADMIN_NASIONAL' | 'ADMIN_PROVINSI' | 'ADMIN_KABUPATEN' | 'USER';
export type UserTipe = 'KADER' | 'PENGURUS' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tipe_user?: UserTipe;
  status: string;
  mfa_enabled?: boolean;
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

// LoginMFAChallenge: login tahap-1 akun ber-MFA (HTTP 202, tanpa sesi).
export interface LoginMFAChallenge {
  mfa_required: true;
  challenge_token: string;
  expires_in: number;
}

// MfaRequiredError dilempar login() bila akun butuh kode TOTP tahap-2.
export class MfaRequiredError extends Error {
  challenge: LoginMFAChallenge;
  constructor(challenge: LoginMFAChallenge) {
    super('Verifikasi dua langkah diperlukan.');
    this.name = 'MfaRequiredError';
    this.challenge = challenge;
  }
}

// LoginMFASetup: login tahap-1 akun wajib-MFA yang belum enroll (HTTP 202).
export interface LoginMFASetup {
  mfa_setup_required: true;
  enroll_token: string;
  expires_in: number;
}

// MfaSetupRequiredError dilempar login() bila akun wajib enroll MFA dulu.
export class MfaSetupRequiredError extends Error {
  enrollToken: string;
  constructor(enrollToken: string) {
    super('Akun ini wajib mengaktifkan verifikasi dua langkah.');
    this.name = 'MfaSetupRequiredError';
    this.enrollToken = enrollToken;
  }
}

export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN_NASIONAL', 'ADMIN_PROVINSI', 'ADMIN_KABUPATEN'];

export function isAdminRole(role?: Role | null): boolean {
  return role ? ADMIN_ROLES.includes(role) : false;
}
