export interface KtaVerification {
  nia: string;
  valid: boolean;
  nama_lengkap?: string;
  status?: string;
  tanggal_angkat?: string;
}

export interface KtaDownload {
  download_url: string;
}
