import type { DokumenCategory } from '../types';

// Draf pendaftaran disimpan di localStorage agar progres TIDAK hilang saat
// refresh maupun saat tab ditutup lalu dibuka lagi. Token OTP sengaja TIDAK
// disimpan (sekali pakai & berumur pendek) — bila halaman dipulihkan setelah
// langkah dokumen, pengguna dikembalikan ke langkah terakhir dan diminta
// memverifikasi OTP ulang saat mengirim. Draf dihapus otomatis setelah submit
// sukses ATAU setelah 1 hari (DRAFT_TTL_MS).
//
// Kebijakan privasi FE-01 (OPEN-07, 06 Okt 2026): draf TIDAK BOLEH memuat NIK,
// kontak langsung (email/WA), alamat detail, tempat/tanggal lahir, atau kode
// pos. Kolom itu diketik ulang setiap sesi; yang dipulihkan hanya progres
// non-sensitif (langkah, pilihan wilayah/pendidikan/pekerjaan, motivasi,
// persyaratan, dan kunci objek dokumen = UUID acak yang tak berguna tanpa
// kredensial storage). Nama lengkap ikut dipulihkan (bukan daftar sensitif
// browser §27.1 v2) agar sapaan progres tidak hilang.

const DRAFT_KEY = 'kipan_reg_draft_v3';
const LEGACY_DRAFT_KEY = 'kipan_reg_draft_v2'; // berisi NIK — dibuang saat load
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export interface DraftDoc {
  key: string;
  name: string;
}

export interface RegDraft {
  savedAt?: number;
  step: number;
  nama: string;
  jk: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  prov: string;
  kab: string;
  kec: string;
  desa: string;
  motivasi: string;
  persyaratan: string[];
  docs: Record<DokumenCategory, DraftDoc>;
}

export function loadDraft(): RegDraft | null {
  try {
    // Purge draf lama (v2 memuat NIK) — sekali jalan, best-effort.
    try { localStorage.removeItem(LEGACY_DRAFT_KEY); } catch { /* abaikan */ }
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

// Daftar kunci yang BOLEH persist (allowlist). saveDraft memetik hanya ini
// sehingga field sensitif — bahkan bila lolos type-check via cast — tidak
// pernah tertulis ke localStorage (pertahanan lapis 2 setelah tipe).
const PERSIST_KEYS = [
  'step', 'nama', 'jk', 'agama', 'pendidikan', 'pekerjaan',
  'prov', 'kab', 'kec', 'desa', 'motivasi', 'persyaratan', 'docs',
] as const;

export function saveDraft(d: RegDraft): void {
  try {
    const clean: Record<string, unknown> = { savedAt: Date.now() };
    for (const k of PERSIST_KEYS) clean[k] = (d as unknown as Record<string, unknown>)[k];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(clean));
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
