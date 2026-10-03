export interface QueueItem {
  id: number;
  nomor_pendaftaran: string;
  nama_lengkap: string;
  status: string;
  provinsi_id: number;
  kabupaten_id: number;
  created_at: string;
  updated_at: string;
}

export interface PendaftaranDetail {
  id: number;
  nomor_pendaftaran: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  status_pribadi?: string;
  alamat: string;
  provinsi_id: number;
  kabupaten_id: number;
  provinsi_nama?: string;
  kabupaten_nama?: string;
  kecamatan: string;
  desa: string;
  kode_pos: string;
  email: string;
  whatsapp: string;
  motivasi: string;
  persyaratan_checklist?: string;
  foto_key: string;
  ktp_key: string;
  cv_key: string;
  sk_key: string;
  surat_pernyataan_key: string;
  surat_sehat_key: string;
  status: string;
  tipe_pendaftaran: string;
  catatan_perbaikan?: string;
  anggota_id?: number;
  created_at: string;
  updated_at: string;
}

export type ApprovalAction = 'verifikasi' | 'perbaikan' | 'tolak' | 'setujui';

export interface ApprovalResult {
  nia?: string;
  one_time_password?: string;
}

export interface MeScope {
  user_id: string;
  email: string;
  role: string;
  provinsi_id_claim: number | null;
  kabupaten_id_claim: number | null;
  filter_provinsi_id: number | null;
  filter_kabupaten_id: number | null;
  is_nasional_scope: boolean;
}

export interface QueueQuery {
  page?: number;
  limit?: number;
  status?: string;
}
