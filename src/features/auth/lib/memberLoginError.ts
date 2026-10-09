import { MfaRequiredError, MfaSetupRequiredError } from '../types.ts';

// Pesan generik login gagal — SAMA PERSIS dengan backend
// (domain.ErrInvalidCredentials) agar tak ada pembeda.
export const LOGIN_GAGAL_GENERIK = 'Email atau kata sandi tidak sesuai.';

// mapMemberLoginError menyamarkan error MFA di pintu anggota (anti-enumeration).
// Pintu /login publik: akun ber-MFA / wajib-MFA tidak boleh dibedakan dari
// akun yang salah — backend sudah generik (401 + timing equalization C-9),
// frontend wajib ikut. Pintu admin (AdminLoginShortcut) TIDAK memakai ini.
export function mapMemberLoginError(err: unknown): Error {
  if (err instanceof MfaRequiredError || err instanceof MfaSetupRequiredError) {
    return new Error(LOGIN_GAGAL_GENERIK);
  }
  return err instanceof Error ? err : new Error('Login gagal');
}
