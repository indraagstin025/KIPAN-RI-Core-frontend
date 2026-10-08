// Validasi login sisi-klien: cegah request yang pasti-422 (hemat kuota
// rate-limit + umpan balik instan). Server tetap sumber kebenaran.
export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const mail = email.trim();
  if (!mail) {
    errors.email = 'Email wajib diisi.';
  } else if (mail.length > 255) {
    errors.email = 'Email terlalu panjang.';
  } else if (!EMAIL_RE.test(mail)) {
    errors.email = 'Format email tidak valid.';
  }
  if (!password) {
    errors.password = 'Kata sandi wajib diisi.';
  }
  return errors;
}

export function hasLoginErrors(errors: LoginFieldErrors): boolean {
  return errors.email !== undefined || errors.password !== undefined;
}
