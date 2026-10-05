import type { SKListItem } from '../types';

// KaderPick = kader terpilih pada form Buat SK (dari anggota / promosi).
export interface KaderPick {
  id: number;
  nama_lengkap: string;
  nia: string;
  info?: string;
}

export const LEVELS = ['', 'NASIONAL', 'PROVINSI', 'KABUPATEN'];
export const SK_STATUSES = ['', 'Aktif', 'TidakAktif', 'Digantikan'];
export const APPROVALS = ['', 'DRAFT', 'MENUNGGU_PROVINSI', 'MENUNGGU_NASIONAL', 'DISETUJUI', 'DITOLAK'];

export const FORM_LEVELS = [
  { value: 'NASIONAL', label: 'Nasional' },
  { value: 'PROVINSI', label: 'Provinsi' },
  { value: 'KABUPATEN', label: 'Kabupaten/Kota' },
];

export const APPROVAL_LABEL: Record<string, string> = {
  DRAFT: 'Draf',
  MENUNGGU_PROVINSI: 'Menunggu Provinsi',
  MENUNGGU_NASIONAL: 'Menunggu Nasional',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
};

export function tanggalPendek(s?: string): string {
  if (!s) return '-';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function wilayahNama(s: SKListItem): string {
  if (s.level === 'NASIONAL') return 'Nasional';
  if (s.level === 'PROVINSI') return s.provinsi_nama ?? '-';
  return s.kabupaten_nama ?? '-';
}
