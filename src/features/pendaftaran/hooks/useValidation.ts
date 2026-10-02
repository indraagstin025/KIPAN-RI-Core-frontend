const NIK_RE = /^\d{16}$/;
const WA_RE = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
const KODE_POS_RE = /^\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasAngleBracket(s: string): boolean {
  return s.includes('<') || s.includes('>');
}

export function isPlausibleNIKDate(nik: string): boolean {
  if (nik.length !== 16) return false;
  const dd = Number(nik.slice(6, 8));
  const mm = Number(nik.slice(8, 10));
  if (mm < 1 || mm > 12) return false;
  return (dd >= 1 && dd <= 31) || (dd >= 41 && dd <= 71);
}

export function ageOf(dateISO: string): number | null {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export const validators = { NIK_RE, WA_RE, KODE_POS_RE, EMAIL_RE };
