export interface KtaVerification {
  nia: string;
  valid: boolean;
  nama_lengkap?: string;
  status?: string;
  tanggal_angkat?: string;
  wilayah_provinsi?: string;
  wilayah_kabupaten?: string;
  riwayat?: string;
  foto_url?: string;
  tanda_tangan_url?: string;
}

export interface KtaDownload {
  download_url: string;
}
