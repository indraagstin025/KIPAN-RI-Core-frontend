export interface TrackingResult {
  nomor_pendaftaran: string;
  status: string;
  status_label: string;
  created_at: string;
  updated_at: string;
  kredensial_status?: 'menunggu' | 'terkirim' | 'gagal';
  kredensial_email?: string;
}

interface KredensialInfo {
  tone: string;
  text: string;
}

export function kredensialInfo(status: string, email?: string): KredensialInfo | null {
  switch (status) {
    case 'terkirim':
      return {
        tone: 'border-green-200 bg-green-50 text-green-700',
        text: `Email kredensial sudah dikirim ke ${email ?? 'email terdaftar'}. Silakan cek kotak masuk (dan folder spam).`,
      };
    case 'menunggu':
      return {
        tone: 'border-amber-200 bg-amber-50 text-amber-700',
        text: 'Pendaftaran disetujui. Email kredensial sedang diproses (biasanya dalam beberapa menit).',
      };
    case 'gagal':
      return {
        tone: 'border-red-200 bg-red-50 text-red-700',
        text: 'Email kredensial gagal terkirim. Silakan hubungi sekretariat untuk bantuan pengiriman ulang.',
      };
    default:
      return null;
  }
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
