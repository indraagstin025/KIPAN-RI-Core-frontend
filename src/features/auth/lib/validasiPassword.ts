// Validasi email & kekuatan kata sandi sisi-klien (cermin aturan backend
// password_strength). Server tetap sumber kebenaran.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailField(email: string): string | undefined {
  const mail = email.trim();
  if (!mail) return 'Email wajib diisi.';
  if (mail.length > 255) return 'Email terlalu panjang.';
  if (!EMAIL_RE.test(mail)) return 'Format email tidak valid.';
  return undefined;
}

export interface StrengthRule {
  key: string;
  label: string;
  ok: (v: string) => boolean;
}

// Cermin backend password_strength: min 8 (maks 128), besar, kecil, angka, simbol.
export const STRENGTH_RULES: StrengthRule[] = [
  { key: 'len', label: 'Minimal 8 karakter', ok: (v) => v.length >= 8 && v.length <= 128 },
  { key: 'upper', label: 'Ada huruf besar (A-Z)', ok: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Ada huruf kecil (a-z)', ok: (v) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Ada angka (0-9)', ok: (v) => /[0-9]/.test(v) },
  { key: 'symbol', label: 'Ada simbol (mis. !@#)', ok: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function unmetStrengthRules(password: string): StrengthRule[] {
  return STRENGTH_RULES.filter((r) => !r.ok(password));
}
