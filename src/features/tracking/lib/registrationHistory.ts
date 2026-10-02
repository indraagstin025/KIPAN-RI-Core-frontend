// Riwayat pendaftaran di perangkat ini (localStorage).
//
// Backend sengaja TIDAK menyediakan pencarian nomor berdasar email/NIK untuk
// publik (oracle PII). Karena itu nomor pendaftaran yang sudah diterima
// disimpan lokal agar pendaftar dapat melacak/merevisi tanpa kehilangan nomor.

export interface RegistrationRecord {
  nomor: string;
  nama: string;
  tipe: string;
  email: string;
  whatsapp: string;
  savedAt: string;
}

const KEY = 'kipan_registrations';
const MAX = 10;

export function getRegistrations(): RegistrationRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RegistrationRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveRegistration(rec: Omit<RegistrationRecord, 'savedAt'>): void {
  try {
    const list = getRegistrations().filter((r) => r.nomor !== rec.nomor);
    list.unshift({ ...rec, savedAt: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage penuh/diblokir: abaikan
  }
}

export function removeRegistration(nomor: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(getRegistrations().filter((r) => r.nomor !== nomor)));
  } catch {
    // abaikan
  }
}

export function latestRegistration(): RegistrationRecord | null {
  return getRegistrations()[0] ?? null;
}
