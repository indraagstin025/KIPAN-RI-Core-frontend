import type { DokumenCategory, TipePendaftaran } from '../types';

// Draf pendaftaran disimpan di localStorage agar progres TIDAK hilang saat
// refresh maupun saat tab ditutup lalu dibuka lagi. Token OTP sengaja TIDAK
// disimpan (sekali pakai & berumur pendek) — bila halaman dipulihkan setelah
// langkah dokumen, pengguna dikembalikan ke langkah Kontak & OTP untuk
// verifikasi ulang. Draf dihapus otomatis setelah submit sukses.
//
// Catatan privasi: draf memuat PII (NIK, alamat) dan tersimpan di perangkat
// pengguna sendiri sampai submit berhasil. Ini disengaja atas permintaan agar
// pengisian panjang tidak hilang.

const DRAFT_KEY = 'kipan_reg_draft_v1';

export interface DraftDoc {
  key: string;
  name: string;
}

export interface RegDraft {
  step: number;
  tipe: TipePendaftaran;
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
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: RegDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
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
