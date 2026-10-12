import { api, apiFetch } from '@/services/apiClient';
import type { KtaDownload, KtaVerification } from '../types';

// verifyKta: endpoint publik, verdict kriptografis (tanpa oracle).
export function verifyKta(nia: string, sig: string): Promise<KtaVerification> {
  const q = sig.trim() ? `?sig=${encodeURIComponent(sig.trim())}` : '';
  return apiFetch<KtaVerification>(`/pendaftaran/kta/${encodeURIComponent(nia.trim())}${q}`);
}

// parseKtaQr: uraikan hasil pindaian QR kartu menjadi {nia, sig}.
// Menerima URL penuh (/validasi-kta/{nia}?sig=… atau /v/{nia}?sig=… lama)
// maupun NIA mentah (sig kosong → lanjut mode manual).
export function parseKtaQr(text: string): { nia: string; sig: string } | null {
  const t = text.trim();
  if (!t) return null;
  try {
    // URL relatif tanpa host tetap bisa diurai dengan basis dummy.
    const u = new URL(t, 'https://qr.kipan.id');
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    if (/^KIPAN-IND-/i.test(last)) {
      return { nia: last.toUpperCase(), sig: u.searchParams.get('sig') ?? '' };
    }
  } catch {
    // bukan URL → coba sebagai NIA mentah di bawah
  }
  if (/^KIPAN-IND-/i.test(t) && !/\s/.test(t)) {
    return { nia: t.toUpperCase(), sig: '' };
  }
  return null;
}

// getMyKta: tiket unduh KTA milik akun USER sendiri (format pdf|png).
export function getMyKta(format: 'pdf' | 'png' = 'pdf'): Promise<KtaDownload> {
  return apiFetch<KtaDownload>(`/user/kta?format=${format}`);
}

export interface TemplateRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateField {
  id: string;
  type: 'text' | 'image' | 'qr';
  source?: string;
  value?: string;
  rect: TemplateRect;
  style?: {
    fontSize?: number;
    fontWeight?: string;
    textAlign?: string;
    verticalAlign?: string;
    objectFit?: string;
    errorCorrectionLevel?: string;
  };
}

export interface TemplateSide {
  canvas: { width: number; height: number };
  fields: TemplateField[];
}

export interface TemplateLayout {
  template: { id: string; name: string; version: string; unit: string; fonts?: { normal?: string; bold?: string } };
  front: TemplateSide;
  back: TemplateSide;
}

// getKtaTemplateLayout: layout template aktif (tool kalibrasi, Super/Nasional).
export function getKtaTemplateLayout(): Promise<TemplateLayout> {
  return apiFetch<TemplateLayout>('/admin/kta-template/layout');
}

// getKtaTemplateBackground: PNG latar sisi depan|belakang sebagai object URL
// (tool kalibrasi). v = versi template untuk invalidasi cache immutable.
// Pemanggil wajib revoke setelah dipakai.
export async function getKtaTemplateBackground(side: 'front' | 'back', v?: string): Promise<string> {
  const res = await api.get('/admin/kta-template/background', {
    params: v ? { side, v } : { side },
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data as Blob);
}

// getKtaTemplateFont: berkas fonta template sebagai object URL (tool
// kalibrasi). v = versi template. Pemanggil wajib revoke setelah dipakai.
export async function getKtaTemplateFont(name: string, v?: string): Promise<string> {
  const res = await api.get('/admin/kta-template/font', {
    params: v ? { name, v } : { name },
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data as Blob);
}

// regenerateAllKta: render ulang semua kartu ber-tanda-tangan dengan template
// aktif (Super/Nasional). Mengembalikan jumlah kartu yang diregenerasi.
export function regenerateAllKta(): Promise<{ regenerated: number }> {
  return apiFetch<{ regenerated: number }>('/admin/kta-template/regenerate', { method: 'POST' });
}

export interface TandaTanganStatus {
  exists: boolean;
  view_url?: string;
}

// getMyTandaTangan: status + tiket baca tanda tangan milik akun USER.
export function getMyTandaTangan(): Promise<TandaTanganStatus> {
  return apiFetch<TandaTanganStatus>('/user/kta/tanda-tangan');
}

// saveMyTandaTangan: simpan citra tanda tangan (PNG) milik akun USER.
export async function saveMyTandaTangan(blob: Blob): Promise<void> {
  const fd = new FormData();
  fd.append('file', blob, 'tanda-tangan.png');
  await api.post('/user/kta/tanda-tangan', fd);
}
