export interface LaporanCount {
  label: string;
  jumlah: number;
}

export interface LaporanSummary {
  total_anggota: number;
  anggota_aktif: number;
  total_pengurus: number;
  total_sk_aktif: number;
  menunggu_verifikasi: number;
}

export interface LaporanTrendPoint {
  bulan: string;
  jumlah: number;
}

export interface LaporanAnomali {
  nia: string;
  nama: string;
  kode_nik: string;
  kode_domisili: string;
}

export interface LaporanData {
  summary: LaporanSummary;
  anggota_by_status: LaporanCount[];
  pendaftaran_by_status: LaporanCount[];
  pengurus_by_level: LaporanCount[];
  demografi_usia: LaporanCount[];
  demografi_pendidikan: LaporanCount[];
  demografi_pekerjaan: LaporanCount[];
  wilayah_label: string;
  wilayah: LaporanCount[];
  tren: LaporanTrendPoint[];
  anomali_nia: LaporanAnomali[];
  anomali_count: number;
}
