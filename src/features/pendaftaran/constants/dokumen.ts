import type { DokumenCategory } from '../types';

export interface DokumenConfig {
  category: DokumenCategory;
  label: string;
  hint: string;
  accept: string;
  maxBytes: number;
}

const MB = 1024 * 1024;

// Selaras categoryPolicies backend (storage_service.go).
export const DOKUMEN_LIST: DokumenConfig[] = [
  { category: 'foto', label: 'Pas Foto (Latar Biru)', hint: 'JPG/PNG, maks 2 MB', accept: 'image/jpeg,image/png', maxBytes: 2 * MB },
  { category: 'ktp', label: 'KTP', hint: 'JPG/PNG/PDF tanpa password, maks 2 MB', accept: 'image/jpeg,image/png,application/pdf', maxBytes: 2 * MB },
  { category: 'cv', label: 'CV / Resume', hint: 'PDF tanpa password, maks 2 MB', accept: 'application/pdf', maxBytes: 2 * MB },
  { category: 'surat_pernyataan', label: 'Surat Pernyataan', hint: 'PDF tanpa password, maks 5 MB', accept: 'application/pdf', maxBytes: 5 * MB },
  { category: 'surat_sehat', label: 'Surat Sehat', hint: 'PDF tanpa password, maks 5 MB', accept: 'application/pdf', maxBytes: 5 * MB },
];

export function isDokumenWajib(category: DokumenCategory): boolean {
  return DOKUMEN_LIST.some((d) => d.category === category);
}
