import { apiFetch } from '@/services/apiClient';
import type { WilayahDesa, WilayahKabupaten, WilayahKecamatan, WilayahKodepos, WilayahProvinsi } from '../types';

export function listProvinsi(): Promise<WilayahProvinsi[]> {
  return apiFetch<WilayahProvinsi[]>('/wilayah/provinsi');
}

export function listKabupaten(provinsiId: number): Promise<WilayahKabupaten[]> {
  return apiFetch<WilayahKabupaten[]>(`/wilayah/kabupaten/${provinsiId}`);
}

// listKecamatan: saran dari proxy backend (fail-open: kosong bila gagal).
// Nilai yang dikirim tetap nama string (kontrak submit tidak berubah).
export function listKecamatan(kabupatenKode: string): Promise<WilayahKecamatan[]> {
  return apiFetch<WilayahKecamatan[]>(`/wilayah/kecamatan?kabupaten_kode=${encodeURIComponent(kabupatenKode)}`);
}

// listDesa: saran desa/kelurahan dari proxy backend (fail-open).
export function listDesa(kecamatanKode: string): Promise<WilayahDesa[]> {
  return apiFetch<WilayahDesa[]>(`/wilayah/desa?kecamatan_kode=${encodeURIComponent(kecamatanKode)}`);
}

// listKodepos: saran kode pos (kode saja) yang dicocokkan desa →
// kecamatan → kabupaten. Fail-open: kosong bila tak cocok/gagal.
export function listKodepos(desa: string, kecamatan: string, kabupaten: string): Promise<WilayahKodepos[]> {
  const p = new URLSearchParams();
  if (desa) p.set('desa', desa);
  if (kecamatan) p.set('kecamatan', kecamatan);
  if (kabupaten) p.set('kabupaten', kabupaten);
  return apiFetch<WilayahKodepos[]>(`/wilayah/kodepos?${p.toString()}`);
}
