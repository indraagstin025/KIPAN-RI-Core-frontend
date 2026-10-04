import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { CursorPager, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { adminDeactivateAnggota, adminExportAnggota, adminGetAnggota, adminListAnggotaCursor } from '../api/anggotaService';
import AnggotaFormModal from '../components/AnggotaFormModal';
import type { AnggotaDetail, AnggotaListItem } from '../types';

const STATUS_OPTIONS = ['', 'AKTIF', 'NONAKTIF', 'DEMISIONER', 'DIBERHENTIKAN', 'MENINGGAL'];

export default function AnggotaListPage() {
  const [items, setItems] = useState<AnggotaListItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState('');
  const [cursor, setCursor] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<AnggotaDetail | null>(null);
  const [editBusyId, setEditBusyId] = useState<number | null>(null);

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

  // Edit memerlukan DTO LENGKAP: daftar hanya proyeksi ringkas, jadi ambil
  // detail dulu sebelum membuka modal.
  async function editAnggota(a: AnggotaListItem): Promise<void> {
    setError(null);
    setEditBusyId(a.id);
    try {
      const detail = await adminGetAnggota(a.id);
      setEditMember(detail);
      setShowForm(true);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat detail anggota');
    } finally {
      setEditBusyId(null);
    }
  }

  async function nonaktifkan(a: AnggotaListItem): Promise<void> {
    if (!window.confirm(`Nonaktifkan anggota ${a.nama_lengkap}?`)) return;
    try {
      await adminDeactivateAnggota(a.id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal menonaktifkan anggota');
    }
  }

  async function ekspor(): Promise<void> {
    try {
      await adminExportAnggota(status || undefined, debouncedSearch || undefined);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengekspor CSV');
    }
  }

  return (
    <div>
      <PageHeader
        title="Data Anggota"
        desc={`Menampilkan ${items.length} kader ber-NIA (keyset).`}
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline-navy" onClick={() => void ekspor()}>Ekspor CSV</Button>
            <Button variant="outline-navy" onClick={() => window.print()}>Cetak / PDF</Button>
            <Button variant="primary" onClick={() => { setEditMember(null); setShowForm(true); }}>+ Tambah Anggota</Button>
          </div>
        )}
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
                <th className="px-4 py-3">Nama / NIA</th>
                <th className="px-4 py-3">Pekerjaan</th>
                <th className="px-4 py-3">Riwayat</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-kipan-border align-top hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-kipan-text-dark">{a.nama_lengkap}</div>
                    <div className="font-mono text-xs font-semibold text-kipan-navy">{a.nia}</div>
                  </td>
                  <td className="px-4 py-3 text-kipan-text-muted">{a.pekerjaan || '-'}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{a.riwayat || '-'}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{a.kabupaten_nama || (a.kabupaten_id ? `Kab. #${a.kabupaten_id}` : '-')}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-1">
                      <Link to={`/admin/anggota/${a.id}`} className="font-semibold text-kipan-blue hover:underline">Detail →</Link>
                      <button type="button" disabled={editBusyId === a.id} onClick={() => void editAnggota(a)} className="font-semibold text-kipan-blue hover:underline disabled:opacity-50">
                        {editBusyId === a.id ? 'Memuat…' : 'Edit'}
                      </button>
                      {a.status !== 'NONAKTIF' && (
                        <button type="button" onClick={() => void nonaktifkan(a)} className="font-semibold text-kipan-red hover:underline">Nonaktifkan</button>
                      )}
                    </div>
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

      <AnggotaFormModal open={showForm} member={editMember} onClose={() => setShowForm(false)} onDone={load} />
    </div>
  );
}
