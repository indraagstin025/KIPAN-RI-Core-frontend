import { useEffect, useState } from 'react';
import { ApiError } from '@/services/apiClient';
import { listDesa, listKabupaten, listKecamatan, listKodepos, listProvinsi } from '../api/wilayahService';
import type { WilayahDesa, WilayahKabupaten, WilayahKecamatan, WilayahKodepos, WilayahProvinsi } from '../types';

export function useWilayah() {
  const [provinsi, setProvinsi] = useState<WilayahProvinsi[]>([]);
  const [kabupaten, setKabupaten] = useState<WilayahKabupaten[]>([]);
  const [kecamatan, setKecamatan] = useState<WilayahKecamatan[]>([]);
  const [desaList, setDesaList] = useState<WilayahDesa[]>([]);
  const [kodeposList, setKodeposList] = useState<WilayahKodepos[]>([]);
  const [loadingKab, setLoadingKab] = useState(false);
  const [loadingKec, setLoadingKec] = useState(false);
  const [loadingDesa, setLoadingDesa] = useState(false);
  const [loadingKodepos, setLoadingKodepos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProvinsi().then(setProvinsi).catch((e: unknown) => {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat provinsi');
    });
  }, []);

  async function pilihProvinsi(id: number): Promise<void> {
    setKabupaten([]);
    setKecamatan([]);
    setDesaList([]);
    setKodeposList([]);
    if (!id) return;
    setLoadingKab(true);
    try {
      setKabupaten(await listKabupaten(id));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat kabupaten/kota');
    } finally {
      setLoadingKab(false);
    }
  }

  // loadKecamatan menerima kode BPS 4-digit (cth. "3273"). Kosong = reset.
  // Gagal = daftar kosong (form fallback ke ketik manual).
  async function loadKecamatan(kode: string): Promise<void> {
    setKecamatan([]);
    if (!kode) return;
    setLoadingKec(true);
    try {
      setKecamatan(await listKecamatan(kode));
    } catch {
      setKecamatan([]);
    } finally {
      setLoadingKec(false);
    }
  }

  // loadDesa menerima kode BPS 6-digit (cth. "327308"). Kosong = reset.
  // Gagal = daftar kosong (form fallback ke ketik manual).
  async function loadDesa(kode: string): Promise<void> {
    setDesaList([]);
    if (!kode) return;
    setLoadingDesa(true);
    try {
      setDesaList(await listDesa(kode));
    } catch {
      setDesaList([]);
    } finally {
      setLoadingDesa(false);
    }
  }

  // loadKodepos menerima nama desa/kecamatan/kabupaten (minimal salah satu
  // dari desa/kecamatan). Kosong = reset. Gagal = daftar kosong (fallback teks).
  async function loadKodepos(desa: string, kecamatan: string, kabupaten: string): Promise<void> {
    setKodeposList([]);
    if (!desa && !kecamatan) return;
    setLoadingKodepos(true);
    try {
      setKodeposList(await listKodepos(desa, kecamatan, kabupaten));
    } catch {
      setKodeposList([]);
    } finally {
      setLoadingKodepos(false);
    }
  }

  return { provinsi, kabupaten, kecamatan, desaList, kodeposList, loadingKab, loadingKec, loadingDesa, loadingKodepos, error, pilihProvinsi, loadKecamatan, loadDesa, loadKodepos };
}
