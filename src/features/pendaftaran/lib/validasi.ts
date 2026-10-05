import { DOKUMEN_LIST, isDokumenWajib } from '../constants/dokumen';
import { PERSYARATAN } from '../constants/persyaratan';
import { ageOf, hasAngleBracket, isPlausibleNIKDate, validators } from '../hooks/useValidation';
import type { DokumenCategory } from '../types';

// Validator murni per langkah: menerima nilai, mengembalikan peta error.
// Tanpa setState di dalam — pemanggil yang menyimpan hasilnya.

export interface DataDiriValues {
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
}

export function validDataDiri(v: DataDiriValues): Record<string, string> {
  const e: Record<string, string> = {};
  if (v.nama.trim().length < 3 || v.nama.trim().length > 150) e.nama = 'Nama lengkap wajib 3-150 karakter';
  else if (hasAngleBracket(v.nama)) e.nama = 'Nama tidak boleh mengandung < atau >';
  const n = v.nik.trim();
  if (!validators.NIK_RE.test(n)) e.nik = 'NIK harus 16 digit angka';
  else if (!isPlausibleNIKDate(n)) e.nik = 'Segmen tanggal lahir pada NIK tidak valid';
  if (!v.tempat.trim() || v.tempat.trim().length > 100) e.tempat = 'Tempat lahir wajib diisi (maks 100)';
  const age = v.tanggal ? ageOf(`${v.tanggal}T00:00:00`) : null;
  if (age === null) e.tanggal = 'Tanggal lahir wajib diisi';
  else if (age < 16 || age > 30) e.tanggal = 'Usia pendaftar harus 16-30 tahun';
  if (v.jk !== 'L' && v.jk !== 'P') e.jk = 'Pilih jenis kelamin';
  if (!v.agama.trim()) e.agama = 'Pilih agama';
  else if (v.agama.trim().length > 100) e.agama = 'Agama melebihi batas karakter';
  else if (hasAngleBracket(v.agama)) e.agama = 'Agama tidak boleh mengandung < atau >';
  if (!v.pendidikan.trim()) e.pendidikan = 'Pilih pendidikan';
  else if (v.pendidikan.trim().length > 100) e.pendidikan = 'Pendidikan melebihi batas karakter';
  else if (hasAngleBracket(v.pendidikan)) e.pendidikan = 'Pendidikan tidak boleh mengandung < atau >';
  if (!v.pekerjaan.trim()) e.pekerjaan = 'Pekerjaan wajib diisi';
  else if (v.pekerjaan.trim().length > 100) e.pekerjaan = 'Pekerjaan melebihi batas karakter';
  else if (hasAngleBracket(v.pekerjaan)) e.pekerjaan = 'Pekerjaan tidak boleh mengandung < atau >';
  const al = v.alamat.trim();
  if (al.length < 10 || al.length > 2000) e.alamat = 'Alamat wajib 10-2000 karakter';
  if (!v.prov) e.prov = 'Pilih provinsi';
  if (!v.kab) e.kab = 'Pilih kabupaten/kota';
  if (!v.kec.trim() || v.kec.trim().length > 100) e.kec = 'Kecamatan wajib diisi (maks 100)';
  if (!v.desa.trim() || v.desa.trim().length > 100) e.desa = 'Desa wajib diisi (maks 100)';
  if (!validators.KODE_POS_RE.test(v.kodepos.trim())) e.kodepos = 'Kode pos wajib 5 digit angka';
  return e;
}

export interface KontakValues {
  email: string;
  wa: string;
  motivasi: string;
  otpToken: string | null;
}

export function validKontak(v: KontakValues): Record<string, string> {
  const e: Record<string, string> = {};
  const em = v.email.trim();
  if (em.length < 5 || em.length > 255 || !validators.EMAIL_RE.test(em)) e.email = 'Format email tidak valid';
  if (!validators.WA_RE.test(v.wa.trim())) e.wa = 'Nomor WhatsApp tidak valid (contoh: 081234567890)';
  else if (!v.otpToken || v.otpToken === null) e.otp = 'Verifikasi OTP WhatsApp wajib diselesaikan';
  const m = v.motivasi.trim();
  if (m.length < 20 || m.length > 1000) e.motivasi = 'Motivasi wajib 20-1000 karakter';
  else if (hasAngleBracket(m)) e.motivasi = 'Motivasi tidak boleh mengandung < atau >';
  return e;
}

export interface DokumenSlot {
  key: string;
  uploading: boolean;
}

export function validDokumen(docs: Record<DokumenCategory, DokumenSlot>): Record<string, string> {
  const e: Record<string, string> = {};
  for (const d of DOKUMEN_LIST) {
    if (!isDokumenWajib(d.category)) continue;
    const st = docs[d.category];
    // Slot yang masih mengunggah ikut diblokir agar Lanjut tak lolos prematur.
    if (st.uploading) {
      e[d.category] = `${d.label} masih mengunggah, tunggu hingga selesai`;
    } else if (!st.key) {
      e[d.category] = `${d.label} wajib diunggah`;
    }
  }
  return e;
}

export function validPersyaratan(persyaratan: string[]): Record<string, string> {
  const e: Record<string, string> = {};
  if (persyaratan.length < PERSYARATAN.length) {
    e.persyaratan = 'Centang seluruh persyaratan untuk melanjutkan';
  }
  return e;
}
