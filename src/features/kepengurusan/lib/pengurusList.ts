import type { PengurusDetail, PengurusPAWAksi, PengurusStats, PengurusStatus } from '../types';

export const STATUS_OPTIONS: PengurusStatus[] = ['Aktif', 'Demisioner', 'Diberhentikan', 'Mengundurkan Diri', 'Meninggal'];

export const MASA_OPTIONS = [
  { value: '', label: 'Semua masa jabatan' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'AkanBerakhir', label: 'Akan berakhir (≤90 hari)' },
  { value: 'Berakhir', label: 'Berakhir' },
];

export const PAW_OPTIONS: { value: PengurusPAWAksi; label: string }[] = [
  { value: 'DEMISIONER', label: 'Demisioner (purna tugas awal)' },
  { value: 'DIBERHENTIKAN', label: 'Diberhentikan (sanksi)' },
  { value: 'MENGUNDURKAN_DIRI', label: 'Mengundurkan diri' },
  { value: 'MENINGGAL', label: 'Meninggal dunia' },
];

export const EMPTY_STATS: PengurusStats = { total: 0, nasional: 0, provinsi: 0, kabupaten: 0, akan_berakhir: 0 };

export function wilayahNama(p: PengurusDetail): string {
  if (p.level === 'NASIONAL') return 'Nasional';
  if (p.level === 'PROVINSI') return p.provinsi_nama ?? '-';
  return p.kabupaten_nama ?? '-';
}

export function masaJabatan(s?: string): { text: string; cls: string } {
  if (!s) return { text: 'Tanpa batas', cls: 'text-kipan-text-muted' };
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return { text: '-', cls: 'text-kipan-text-muted' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { text: 'Berakhir', cls: 'text-kipan-red' };
  if (days <= 90) return { text: `Akan berakhir (${days} hari)`, cls: 'text-amber-600' };
  return { text: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }), cls: 'text-kipan-text-muted' };
}
