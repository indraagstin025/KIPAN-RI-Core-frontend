import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/fields';
import { CursorPager, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/apiClient';
import { listQueue, listQueueCursor } from '../api/verificationService';
import type { QueueItem } from '../types';

const STATUS_DEFS = [
  { value: '', label: 'Semua' },
  { value: 'DRAFT', label: 'Draf' },
  { value: 'DIVERIFIKASI', label: 'Diverifikasi' },
  { value: 'PERBAIKAN', label: 'Perbaikan' },
  { value: 'DITOLAK', label: 'Ditolak' },
  { value: 'KEDALUWARSA', label: 'Kedaluwarsa' },
];

const ALUR = ['Draf', 'Diverifikasi', 'Disetujui'];

export default function AntreanPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cursor, setCursor] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, countRes] = await Promise.all([
        listQueueCursor({ status: status || undefined, cursor: cursor || undefined, limit: 10 }),
        Promise.all(
          STATUS_DEFS.map((d) =>
            listQueue({ page: 1, limit: 1, status: d.value || undefined }).then((r) => [d.value, r.meta.total] as const),
          ),
        ),
      ]);
      setItems(res.data);
      setNextCursor(res.nextCursor);
      setCounts(Object.fromEntries(countRes));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat antrean');
    } finally {
      setLoading(false);
    }
  }, [status, cursor]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetPaging(): void {
    setCursor('');
    setHistory([]);
  }

  return (
    <div>
      <PageHeader title="Antrean Pendaftaran" desc={`${counts[status] ?? 0} pendaftaran sesuai cakupan wilayah Anda.`} />

      {user?.role === 'ADMIN_PROVINSI' && (
        <div className="mb-4">
          <Alert kind="info">Mode lihat saja: Admin Provinsi dapat melihat antrean; verifikasi dilakukan Admin Kabupaten/Kota.</Alert>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-kipan-border bg-white px-4 py-3 text-xs font-semibold text-kipan-text-muted">
        {ALUR.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-2">
            {i > 0 && <span className="text-kipan-border">→</span>}
            <span className="rounded-full bg-kipan-soft-blue px-3 py-1 text-kipan-navy">{s}</span>
          </span>
        ))}
        <span className="ml-2 text-kipan-text-muted">Cabang: Perbaikan · Ditolak · Kedaluwarsa</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_DEFS.map((d) => (
          <button
            key={d.value || 'all'}
            type="button"
            onClick={() => { setStatus(d.value); resetPaging(); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === d.value ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy hover:bg-kipan-soft-gray'}`}
          >
            {d.label} <span className="opacity-75">({counts[d.value] ?? 0})</span>
          </button>
        ))}
        <button type="button" onClick={() => void load()} className="rounded-full border border-kipan-border px-4 py-1.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-blue">
          Muat ulang
        </button>
      </div>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Tidak ada pendaftaran pada filter ini.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-kipan-navy">{it.nomor_pendaftaran}</td>
                  <td className="px-4 py-3 font-semibold text-kipan-text-dark">{it.nama_lengkap}</td>
                  <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                  <td className="px-4 py-3 text-kipan-text-muted">{new Date(it.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/pendaftaran/${it.id}`} className="font-semibold text-kipan-blue hover:underline">
                      Periksa →
                    </Link>
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
