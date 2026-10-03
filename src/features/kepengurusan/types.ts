export type SKApprovalStatus =
  | 'DRAFT'
  | 'MENUNGGU_PROVINSI'
  | 'MENUNGGU_NASIONAL'
  | 'DISETUJUI'
  | 'DITOLAK';

export type SKStatus = 'Aktif' | 'TidakAktif' | 'Digantikan';

export type SKApprovalAction = 'AJUKAN' | 'TERUSKAN' | 'SAHKAN' | 'TOLAK';

export type PengurusStatus =
  | 'Aktif'
  | 'Demisioner'
  | 'Diberhentikan'
  | 'Mengundurkan Diri'
  | 'Meninggal';

export interface Jabatan {
  id: number;
  nama: string;
  level: string;
  is_inti: boolean;
  is_active: boolean;
  urutan: number;
  created_at: string;
  updated_at: string;
}

export interface JabatanInput {
  nama: string;
  level: string;
  is_inti: boolean;
  is_active: boolean;
  urutan: number;
}

export interface SKListItem {
  id: number;
  nomor_sk: string;
  judul: string;
  level: string;
  provinsi_id?: number;
  kabupaten_id?: number;
  provinsi_nama?: string;
  kabupaten_nama?: string;
  tanggal_terbit: string;
  tanggal_berakhir?: string;
  status: SKStatus;
  approval_status: SKApprovalStatus;
  jumlah_pengurus: number;
  created_at: string;
}

export interface SuratKeputusan {
  id: number;
  nomor_sk: string;
  judul: string;
  level: string;
  provinsi_id?: number;
  kabupaten_id?: number;
  tanggal_terbit: string;
  tanggal_berakhir?: string;
  file_sk_key: string;
  status: SKStatus;
  approval_status: SKApprovalStatus;
  catatan_penolakan?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PengurusDetail {
  id: number;
  anggota_id: number;
  nia: string;
  nama_lengkap: string;
  surat_keputusan_id: number;
  nomor_sk: string;
  jabatan_id: number;
  jabatan: string;
  is_inti: boolean;
  level: string;
  provinsi_id?: number;
  kabupaten_id?: number;
  provinsi_nama?: string;
  kabupaten_nama?: string;
  status: PengurusStatus;
  keterangan_status?: string;
  sk_tanggal_berakhir?: string;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  created_at: string;
}

export interface PengurusStats {
  total: number;
  nasional: number;
  provinsi: number;
  kabupaten: number;
  akan_berakhir: number;
}

export interface SKDetail {
  sk: SuratKeputusan;
  pengurus: PengurusDetail[];
}

export interface SKQuery {
  page?: number;
  limit?: number;
  level?: string;
  status?: string;    // status SK: Aktif | TidakAktif | Digantikan
  approval?: string;  // tahap persetujuan: DRAFT | MENUNGGU_PROVINSI | ...
  search?: string;
}

export interface PengurusQuery {
  page?: number;
  limit?: number;
  level?: string;
  status?: string;
  masa_jabatan?: string;
  provinsi_id?: number;
  kabupaten_id?: number;
  search?: string;
}

export interface SKCreateInput {
  nomor_sk: string;
  judul: string;
  level?: string;
  provinsi_id?: number;
  kabupaten_id?: number;
  tanggal_terbit: string;
  tanggal_berakhir: string;
  file_sk_key: string;
}
