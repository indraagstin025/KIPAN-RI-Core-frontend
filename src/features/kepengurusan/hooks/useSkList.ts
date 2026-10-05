import { useCallback, useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { adminListSK } from '../api/kepengurusanService';
import type { SKListItem } from '../types';

// SkListApi adalah SELURUH state daftar + filter + paging SK.
export interface SkListApi {
  items: SKListItem[];
  level: string; setLevel: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  approval: string; setApproval: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  page: number; setPage: (v: number) => void;
  totalPages: number;
  total: number;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export function useSkList(): SkListApi {
  const [items, setItems] = useState<SKListItem[]>([]);
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [approval, setApproval] = useState('');
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
      const res = await adminListSK({
        page, limit: 10,
        level: level || undefined,
        status: status || undefined,
        approval: approval || undefined,
        search: debouncedSearch || undefined,
      });
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar SK');
    } finally {
      setLoading(false);
    }
  }, [page, level, status, approval, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items, level, setLevel, status, setStatus, approval, setApproval,
    search, setSearch, page, setPage, totalPages, total, loading, error, load,
  };
}
