import { useEffect, useState } from 'react';
import { ApiError } from '@/services/apiClient';
import { listKabupaten, listProvinsi } from '../api/wilayahService';
import type { WilayahKabupaten, WilayahProvinsi } from '../types';

export function useWilayah() {
  const [provinsi, setProvinsi] = useState<WilayahProvinsi[]>([]);
  const [kabupaten, setKabupaten] = useState<WilayahKabupaten[]>([]);
  const [loadingKab, setLoadingKab] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProvinsi().then(setProvinsi).catch((e: unknown) => {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat provinsi');
    });
  }, []);

  async function pilihProvinsi(id: number): Promise<void> {
    setKabupaten([]);
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

  return { provinsi, kabupaten, loadingKab, error, pilihProvinsi };
}
