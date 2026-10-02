import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox, Loading, PageHeader, Pagination, StatusBadge } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { listQueue } from '../api/verificationService';
import type { QueueItem } from '../types';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'DIAJUKAN', label: 'Diajukan' },
  { value: 'DIVERIFIKASI', label: 'Diverifikasi' },
  { value: 'PERBAIKAN', label: 'Perbaikan' },
  { value: 'DISETUJUI', label: 'Disetujui' },
  { value: 'DITOLAK', label: 'Ditolak' },
];

export default function AntreanPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listQueue({ page, limit: 10, status: status || undefined });
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat antrean');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Antrean Pendaftaran" desc={`${total} pendaftaran sesuai cakupan wilayah Anda.`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button type="button" onClick={() => void load()} className="rounded-lg border border-kipan-border px-4 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-blue">
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
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
