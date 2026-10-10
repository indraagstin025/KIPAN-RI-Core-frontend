import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { ErrorBox, Loading, PageHeader, Pagination } from '@/components/ui/stateful';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { exportAudit, listAudit } from '../api/auditService';
import { DECISION_GROUPS, extractAlasan } from '../lib/decisionMeta';
import type { ActivityLog } from '../types';

// LogKeputusanPage: dasbor "siapa memutuskan apa" (Batch 3, Super/Nasional).
// Sumber = jejak audit terfilter aksi putusan; alasan dibaca dari meta.
export default function LogKeputusanPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [grup, setGrup] = useState('semua');
  const [aktor, setAktor] = useState('');
  const [dari, setDari] = useState('');
  const [ke, setKe] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ekspor, setEkspor] = useState(false);

  const debouncedAktor = useDebouncedValue(aktor, 300);
  const aksiIn = DECISION_GROUPS.find((g) => g.key === grup)?.aksi.join(',') ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAudit({
        page,
        limit: 25,
        aksiIn,
        aktor: debouncedAktor || undefined,
        dari: dari || undefined,
        ke: ke || undefined,
      });
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat log keputusan');
    } finally {
      setLoading(false);
    }
  }, [page, aksiIn, debouncedAktor, dari, ke]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unduhCsv(): Promise<void> {
    setEkspor(true);
    try {
      await exportAudit({ aksiIn, aktor: debouncedAktor || undefined, dari: dari || undefined, ke: ke || undefined });
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengekspor CSV');
    } finally {
      setEkspor(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Log Keputusan"
        desc={`${total} putusan tercatat (verifikasi, SK, pengurus, data pribadi).`}
        action={(
          <Button variant="outline-navy" onClick={() => void unduhCsv()} disabled={ekspor}>
            {ekspor ? 'Menyiapkan...' : 'Ekspor CSV'}
          </Button>
        )}
      />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {DECISION_GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => { setGrup(g.key); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${grup === g.key ? 'bg-kipan-blue text-white' : 'border border-kipan-border bg-white text-kipan-navy'}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-kipan-border bg-white p-4 sm:grid-cols-3">
        <label className="text-xs font-semibold text-kipan-text-muted">
          Aktor
          <input
            value={aktor}
            onChange={(e) => setAktor(e.target.value)}
            placeholder="nama aktor"
            className="mt-1 w-full rounded-lg border border-kipan-border px-3 py-2 text-sm font-normal text-kipan-text-dark focus:border-kipan-blue focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-kipan-text-muted">
          Dari
          <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="mt-1 w-full rounded-lg border border-kipan-border px-3 py-2 text-sm font-normal text-kipan-text-dark" />
        </label>
        <label className="text-xs font-semibold text-kipan-text-muted">
          Sampai
          <input type="date" value={ke} onChange={(e) => setKe(e.target.value)} className="mt-1 w-full rounded-lg border border-kipan-border px-3 py-2 text-sm font-normal text-kipan-text-dark" />
        </label>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Belum ada putusan pada filter ini.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pemutus</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">Alasan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-kipan-text-muted">{new Date(a.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-kipan-text-dark">{a.actor_name}</div>
                    <div className="text-xs text-kipan-text-muted">{a.actor_role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-kipan-soft-blue px-2.5 py-1 text-xs font-bold text-kipan-navy">{a.action}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-kipan-text-dark">{a.entity_name} #{a.entity_id}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-xs text-kipan-text-muted" title={extractAlasan(a.metadata) ?? undefined}>
                    {extractAlasan(a.metadata) ?? '—'}
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
