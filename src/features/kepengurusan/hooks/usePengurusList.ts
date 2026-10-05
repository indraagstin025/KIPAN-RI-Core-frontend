import { useCallback, useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { useWilayah } from '@/features/pendaftaran/hooks/useWilayah';
import { adminListPengurus, adminPengurusStats } from '../api/kepengurusanService';
import { EMPTY_STATS } from '../lib/pengurusList';
import type { PengurusDetail, PengurusStats } from '../types';

// PengurusListApi adalah SELURUH state daftar + filter + paging.
// Komponen filter/tabel menerima objek ini agar daftar props tetap ramping.
export interface PengurusListApi {
  items: PengurusDetail[];
  stats: PengurusStats;
  level: string; setLevel: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  masa: string; setMasa: (v: string) => void;
  provFilter: string;
  kabFilter: string; setKabFilter: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  page: number; setPage: (v: number) => void;
  totalPages: number;
  total: number;
  loading: boolean;
  error: string | null;
  wilayah: ReturnType<typeof useWilayah>;
  pilihProvinsi: (v: string) => void;
  load: () => Promise<void>;
}

export function usePengurusList(): PengurusListApi {
  const wilayah = useWilayah();

  const [items, setItems] = useState<PengurusDetail[]>([]);
  const [stats, setStats] = useState<PengurusStats>(EMPTY_STATS);
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [masa, setMasa] = useState('');
  const [provFilter, setProvFilter] = useState('');
  const [kabFilter, setKabFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, st] = await Promise.all([
        adminListPengurus({
          page, limit: 10,
          level: level || undefined,
          status: status || undefined,
          masa_jabatan: masa || undefined,
          provinsi_id: provFilter ? Number(provFilter) : undefined,
          kabupaten_id: kabFilter ? Number(kabFilter) : undefined,
          search: debouncedSearch || undefined,
        }),
        adminPengurusStats(),
      ]);
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
      setStats(st);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar pengurus');
    } finally {
      setLoading(false);
    }
  }, [page, level, status, masa, provFilter, kabFilter, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function pilihProvinsi(v: string): void {
    setProvFilter(v);
    setKabFilter('');
    setPage(1);
    if (v) void wilayah.pilihProvinsi(Number(v));
  }

  return {
    items, stats, level, setLevel, status, setStatus, masa, setMasa,
    provFilter, kabFilter, setKabFilter, search, setSearch,
    page, setPage, totalPages, total, loading, error,
    wilayah, pilihProvinsi, load,
  };
}
