import { useCallback, useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { listKabupaten, listProvinsi } from '@/features/pendaftaran/api/wilayahService';
import type { WilayahKabupaten, WilayahProvinsi } from '@/features/pendaftaran/types';
import { wilayahAdd, wilayahCards, wilayahList, wilayahSetStatus } from '../api/wilayahAdminService';
import type { WilayahAdminItem, WilayahCards, WilayahType } from '../types';

const EMPTY_CARDS: WilayahCards = { total_provinsi: 0, total_kabupaten: 0, total_pengurus: 0 };

// WilayahAdminApi menampung SELURUH state daftar + tambah wilayah.
export interface WilayahAdminApi {
  cards: WilayahCards;
  type: WilayahType;
  status: string; setStatus: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  provFilter: string; setProvFilter: (v: string) => void;
  items: WilayahAdminItem[];
  page: number; setPage: (v: number) => void;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  aksiError: string | null;
  setAksiError: (v: string | null) => void;
  togglingId: number | null;
  submitting: boolean;
  provinsiMaster: WilayahProvinsi[];
  showTambah: boolean; setShowTambah: (v: boolean) => void;
  tambahProv: string;
  tambahKab: string; setTambahKab: (v: string) => void;
  tambahKabList: WilayahKabupaten[];
  gantiType: (t: WilayahType) => void;
  toggleStatus: (it: WilayahAdminItem) => Promise<void>;
  bukaTambah: () => void;
  pilihTambahProv: (v: string) => Promise<void>;
  submitTambah: () => Promise<void>;
  load: () => Promise<void>;
}

export function useWilayahAdmin(): WilayahAdminApi {
  const [cards, setCards] = useState<WilayahCards>(EMPTY_CARDS);
  const [type, setType] = useState<WilayahType>('provinsi');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [provFilter, setProvFilter] = useState('');

  const [items, setItems] = useState<WilayahAdminItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [provinsiMaster, setProvinsiMaster] = useState<WilayahProvinsi[]>([]);

  const [showTambah, setShowTambah] = useState(false);
  const [tambahProv, setTambahProv] = useState('');
  const [tambahKab, setTambahKab] = useState('');
  const [tambahKabList, setTambahKabList] = useState<WilayahKabupaten[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [c, p] = await Promise.all([wilayahCards(), listProvinsi()]);
        setCards(c);
        setProvinsiMaster(p);
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : 'Gagal memuat ringkasan wilayah');
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wilayahList({
        type,
        page,
        limit: 25,
        search: debouncedSearch || undefined,
        status: status || undefined,
        provinsi_id: type === 'kabupaten' && provFilter ? Number(provFilter) : undefined,
      });
      setItems(res.data);
      setTotal(res.meta.total);
      setTotalPages(Math.max(1, res.meta.total_pages));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar wilayah');
    } finally {
      setLoading(false);
    }
  }, [type, page, debouncedSearch, status, provFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function gantiType(t: WilayahType): void {
    setType(t);
    setProvFilter('');
    setPage(1);
  }

  async function toggleStatus(it: WilayahAdminItem): Promise<void> {
    setAksiError(null);
    setTogglingId(it.id);
    try {
      await wilayahSetStatus(type, it.id, !it.is_active);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal mengubah status wilayah');
    } finally {
      setTogglingId(null);
    }
  }

  function bukaTambah(): void {
    setAksiError(null);
    setTambahProv('');
    setTambahKab('');
    setTambahKabList([]);
    setShowTambah(true);
  }

  async function pilihTambahProv(v: string): Promise<void> {
    setTambahProv(v);
    setTambahKab('');
    setTambahKabList([]);
    if (v) {
      try {
        setTambahKabList(await listKabupaten(Number(v)));
      } catch {
        setTambahKabList([]);
      }
    }
  }

  async function submitTambah(): Promise<void> {
    setAksiError(null);
    if (!tambahProv) {
      setAksiError('Pilih provinsi terlebih dahulu.');
      return;
    }
    if (type === 'kabupaten' && !tambahKab) {
      setAksiError('Pilih kabupaten/kota terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      await wilayahAdd(type, Number(tambahProv), type === 'kabupaten' ? Number(tambahKab) : 0);
      setShowTambah(false);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal menambah wilayah');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    cards, type, status, setStatus, search, setSearch, provFilter, setProvFilter,
    items, page, setPage, total, totalPages, loading, error,
    aksiError, setAksiError, togglingId, submitting, provinsiMaster,
    showTambah, setShowTambah, tambahProv, tambahKab, setTambahKab, tambahKabList,
    gantiType, toggleStatus, bukaTambah, pilihTambahProv, submitTambah, load,
  };
}
