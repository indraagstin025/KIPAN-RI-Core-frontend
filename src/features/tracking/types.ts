export interface TrackingResult {
  nomor_pendaftaran: string;
  status: string;
  status_label: string;
  created_at: string;
  updated_at: string;
}

export interface RevisionTokenRequest {
  nomor: string;
  email: string;
  whatsapp: string;
}

export interface RevisionTokenResult {
  expires_at: string;
  // Token TIDAK lagi dikembalikan server (dikirim ke email terdaftar).
}

export interface RevisionSubmit {
  token: string;
  foto_key?: string;
  ktp_key?: string;
  cv_key?: string;
  sk_key?: string;
  surat_pernyataan_key?: string;
  surat_sehat_key?: string;
  catatan?: string;
}
