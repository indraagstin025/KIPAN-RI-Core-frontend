import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert } from '@/components/ui/fields';
import { ErrorBox, Loading, PageHeader, Pagination } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { decideDsar, listDsar } from '../api/dsarService';
import { sisaJam } from '../lib/sla';
import type { DsarRequest } from '../types';

const STATUS_LABEL: Record<string, string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
};

const FILTERS = ['', 'diajukan', 'diproses', 'selesai', 'ditolak'];

export default function DsarQueuePage() {
  const [items, setItems] = useState<DsarRequest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listDsar(page, 25, filter);
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat antrean');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function putuskan(id: number, status: string): Promise<void> {
    if (status === 'ditolak' && !(catatan[id] ?? '').trim()) {
      setError('Penolakan wajib disertai alasan (diberitahukan ke pemohon).');
      return;
    }
    setBusyId(id);
    setError(null);
    setOk(null);
    try {
      await decideDsar(id, status, (catatan[id] ?? '').trim());
      setOk(`Permohonan #${id} → ${STATUS_LABEL[status]}.`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memutus permohonan');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Permohonan Data Pribadi" desc="Antrean hak subjek data (UU PDP). SLA respons 3x24 jam — yang terdesak tampil dulu." />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {ok && <div className="mb-4"><Alert kind="success">{ok}</Alert></div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || 'semua'}
            type="button"
            onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === f ? 'bg-kipan-blue text-white' : 'border border-kipan-border bg-white text-kipan-navy'}`}
          >
            {f === '' ? 'Semua' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Antrean kosong.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Pemohon</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Batas (SLA)</th>
                <th className="px-4 py-3">Catatan / Alasan</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const sisa = sisaJam(b.due_at);
                const terbuka = b.status === 'diajukan' || b.status === 'diproses';
                const telat = terbuka && sisa < 0;
                return (
                  <tr key={b.id} className={`border-t border-kipan-border hover:bg-kipan-soft-gray/60 ${telat ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                    <td className="px-4 py-3 font-semibold">{b.jenis}</td>
                    <td className="px-4 py-3">{b.anggota_nama ?? `#${b.anggota_id}`}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${b.status === 'selesai' ? 'bg-emerald-100 text-kipan-green' : b.status === 'ditolak' ? 'bg-red-100 text-kipan-red' : 'bg-sky-100 text-kipan-blue'}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-kipan-text-muted">
                      {new Date(b.due_at).toLocaleString('id-ID')}
                      {terbuka && <span className={`ml-2 font-bold ${telat ? 'text-kipan-red' : ''}`}>{telat ? 'TERLAMBAT' : `sisa ${sisa} jam`}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {terbuka ? (
                        <input
                          value={catatan[b.id] ?? ''}
                          onChange={(e) => setCatatan((p) => ({ ...p, [b.id]: e.target.value.slice(0, 2000) }))}
                          placeholder="Alasan / catatan (wajib bila tolak)"
                          className="w-full min-w-[180px] rounded-lg border border-kipan-border px-3 py-2 text-xs focus:border-kipan-blue focus:outline-none"
                        />
                      ) : (
                        <span className="text-xs text-kipan-text-muted">{b.catatan_admin ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {terbuka && (
                        <div className="flex justify-end gap-2">
                          {b.status === 'diajukan' && (
                            <Button variant="outline-navy" disabled={busyId === b.id} onClick={() => void putuskan(b.id, 'diproses')}>Proses</Button>
                          )}
                          <Button variant="primary" disabled={busyId === b.id} onClick={() => void putuskan(b.id, 'selesai')}>Selesai</Button>
                          <button type="button" disabled={busyId === b.id} onClick={() => void putuskan(b.id, 'ditolak')} className="font-semibold text-kipan-red hover:underline disabled:opacity-40">Tolak</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
