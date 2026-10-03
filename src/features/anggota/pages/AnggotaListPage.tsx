import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { CursorPager, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { adminListAnggotaCursor } from '../api/anggotaService';
import type { AnggotaDetail } from '../types';

const STATUS_OPTIONS = ['', 'AKTIF', 'NONAKTIF', 'DEMISIONER', 'DIBERHENTIKAN', 'MENINGGAL'];

export default function AnggotaListPage() {
  const [items, setItems] = useState<AnggotaDetail[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState('');
  const [cursor, setCursor] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListAnggotaCursor({
        limit: 10,
        status: status || undefined,
        search: debouncedSearch || undefined,
        cursor: cursor || undefined,
      });
      setItems(res.data);
      setNextCursor(res.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat data anggota');
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, cursor]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetPaging(): void {
    setCursor('');
    setHistory([]);
  }

  return (
    <div>
      <PageHeader
        title="Data Anggota"
        desc={`Menampilkan ${items.length} kader ber-NIA (keyset).`}
        action={<Button variant="outline-navy" onClick={() => window.print()}>Cetak / PDF</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPaging(); }}
          placeholder="Cari nama atau NIA"
          className="w-full max-w-xs rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); resetPaging(); }}
          className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === '' ? 'Semua status' : s}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Belum ada data anggota.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">NIA</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-kipan-navy">{a.nia}</td>
                  <td className="px-4 py-3 font-semibold text-kipan-text-dark">{a.nama_lengkap}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{a.kabupaten_nama || (a.kabupaten_id ? `Kab. #${a.kabupaten_id}` : '-')}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/anggota/${a.id}`} className="font-semibold text-kipan-blue hover:underline">Detail →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CursorPager
        hasPrev={history.length > 0}
        hasNext={nextCursor !== ''}
        onPrev={() => {
          const h = [...history];
          const prev = h.pop();
          setHistory(h);
          setCursor(prev ?? '');
        }}
        onNext={() => {
          setHistory([...history, cursor]);
          setCursor(nextCursor);
        }}
      />
    </div>
  );
}
