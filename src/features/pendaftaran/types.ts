export type { DokumenCategory, PresignUploadResult as PresignResult } from '@/features/storage/types';

export interface WilayahProvinsi {
  id: number;
  kode: string;
  nama: string;
}

export interface WilayahKabupaten {
  id: number;
  provinsi_id: number;
  kode: string;
  nama: string;
}

export interface WilayahKecamatan {
  kode: string;
  nama: string;
}

export interface WilayahDesa {
  kode: string;
  nama: string;
}

export interface WilayahKodepos {
  kode_pos: string;
}

export interface OtpRequestResult {
  expires_in: number;
  resend_in: number;
  debug_code?: string;
}

export interface OtpVerifyResult {
  verified_token: string;
  expires_in: number;
}

export interface PendaftaranSubmit {
  // Backend menerima field ini untuk kompatibilitas; pendaftaran kini selalu
  // Kader (jalur Pengurus diangkat via SK), jadi nilainya konstan.
  tipe_pendaftaran: 'KADER';
  nama_lengkap: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string; // RFC3339
  jenis_kelamin: 'L' | 'P';
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  alamat: string;
  provinsi_id: number;
  kabupaten_id: number;
  kecamatan: string;
  desa: string;
  kode_pos: string;
  email: string;
  whatsapp: string;
  wa_otp_token: string;
  motivation: string;
  persyaratan: string[];
  foto_key: string;
  ktp_key: string;
  cv_key: string;
  surat_pernyataan_key: string;
  surat_sehat_key: string;
}

export interface PendaftaranCreated {
  id: number;
  nomor_pendaftaran: string;
  status: string;
}
