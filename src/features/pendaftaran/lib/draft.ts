import type { DokumenCategory } from '../types';

// Draf pendaftaran disimpan di localStorage agar progres TIDAK hilang saat
// refresh maupun saat tab ditutup lalu dibuka lagi. Token OTP sengaja TIDAK
// disimpan (sekali pakai & berumur pendek) — bila halaman dipulihkan setelah
// langkah dokumen, pengguna dikembalikan ke langkah terakhir dan diminta
// memverifikasi OTP ulang saat mengirim. Draf dihapus otomatis setelah submit
// sukses ATAU setelah 1 hari (DRAFT_TTL_MS).
//
// Catatan privasi: draf memuat PII (NIK, alamat) dan tersimpan di perangkat
// pengguna sendiri sampai submit berhasil atau kedaluwarsa (1 hari).

const DRAFT_KEY = 'kipan_reg_draft_v2';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export interface DraftDoc {
  key: string;
  name: string;
}

export interface RegDraft {
  savedAt?: number;
  step: number;
  nama: string;
  nik: string;
  tempat: string;
  tanggal: string;
  jk: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  alamat: string;
  prov: string;
  kab: string;
  kec: string;
  desa: string;
  kodepos: string;
  email: string;
  wa: string;
  motivasi: string;
  persyaratan: string[];
  docs: Record<DokumenCategory, DraftDoc>;
}

export function loadDraft(): RegDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    // Draf hanya berlaku 1 hari; lewat itu (atau tanpa stempel waktu) dibuang.
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      clearDraft();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(d: RegDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: Date.now() }));
  } catch {
    // storage penuh/diblokir: abaikan
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // abaikan
  }
}
