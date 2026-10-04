export interface AnggotaPublicInfo {
  nia: string;
  nama_lengkap: string;
  status: string;
  provinsi_nama: string;
  kabupaten_nama: string;
}

export interface AnggotaListItem {
  id: number;
  nia: string;
  nama_lengkap: string;
  status: string;
  pekerjaan: string;
  riwayat: string;
  provinsi_id: number;
  provinsi_nama: string;
  kabupaten_id: number;
  kabupaten_nama: string;
  tanggal_angkat: string;
  created_at: string;
}

// Proyeksi daftar (ringkas) — TIDAK memuat seluruh field detail.
export interface AnggotaListItem {
  id: number;
  nia: string;
  nama_lengkap: string;
  status: string;
  pekerjaan: string;
  riwayat: string;
  provinsi_id: number;
  provinsi_nama: string;
  kabupaten_id: number;
  kabupaten_nama: string;
  tanggal_angkat: string;
  created_at: string;
}

export interface AnggotaDetail {
  id: number;
  nia: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  alamat: string;
  provinsi_id: number;
  provinsi_nama?: string;
  kabupaten_id: number;
  kabupaten_nama?: string;
  kecamatan: string;
  desa: string;
  kode_pos: string;
  email: string;
  whatsapp: string;
  status: string;
  tipe: string;
  angkatan: string;
  foto_key: string;
  ktp_key: string;
  cv_key: string;
  sk_key: string;
  surat_pernyataan_key: string;
  surat_sehat_key: string;
  kta_pdf_key?: string;
  user_id?: string;
  tanggal_daftar: string;
  tanggal_angkat: string;
  riwayat?: string;
}

export interface AnggotaRiwayatItem {
  waktu: string;
  sumber: string; // PENDAFTARAN | KEPENGURUSAN
  aksi: string;
  label: string;
  oleh: string;
  keterangan?: string;
}

export interface AnggotaCreateInput {
  nama_lengkap: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
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
  angkatan: string;
  status?: string;
}

export type AnggotaUpdateInput = Partial<AnggotaCreateInput>;

export interface AnggotaQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}
