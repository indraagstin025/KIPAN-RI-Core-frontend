import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Card, ErrorBox, Loading, PageHeader, Pagination } from '@/components/ui/stateful';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { exportAudit, listAudit } from '../api/auditService';
import type { ActivityLog } from '../types';

const ENTITY_OPTIONS = ['', 'pendaftaran', 'anggota', 'surat_keputusan', 'pengurus', 'users', 'jabatan', 'wilayah_provinsi', 'wilayah_kabupaten'];

export default function AuditPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [aksi, setAksi] = useState('');
  const [entitas, setEntitas] = useState('');
  const [aktor, setAktor] = useState('');
  const [dari, setDari] = useState('');
  const [ke, setKe] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ekspor, setEkspor] = useState(false);

  const debouncedAktor = useDebouncedValue(aktor, 300);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAudit({
        page,
        limit: 25,
        aksi: aksi || undefined,
        entitas: entitas || undefined,
        aktor: debouncedAktor || undefined,
        dari: dari || undefined,
        ke: ke || undefined,
      });
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat jejak audit');
    } finally {
      setLoading(false);
    }
  }, [page, aksi, entitas, debouncedAktor, dari, ke]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unduhCsv(): Promise<void> {
    setEkspor(true);
    try {
      await exportAudit({ aksi: aksi || undefined, entitas: entitas || undefined, aktor: debouncedAktor || undefined, dari: dari || undefined, ke: ke || undefined });
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengekspor CSV');
    } finally {
      setEkspor(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Jejak Audit"
        desc={`${total} aktivitas tercatat (append-only).`}
        action={(
          <div className="flex gap-2">
            <Button variant="outline-navy" onClick={() => void unduhCsv()} disabled={ekspor}>{ekspor ? 'Menyiapkan...' : 'Ekspor CSV'}</Button>
            <Button variant="outline-navy" onClick={() => window.print()}>Cetak / PDF</Button>
          </div>
        )}
      />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-kipan-text-muted">
            Aksi
            <input value={aksi} onChange={(e) => { setAksi(e.target.value.toUpperCase()); setPage(1); }} placeholder="mis. SETUJU_SK"
              className="rounded-lg border border-kipan-border bg-white px-3 py-2 text-sm font-normal text-kipan-text-dark focus:outline-none focus:ring-2 focus:ring-kipan-blue/20" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-kipan-text-muted">
            Entitas
            <select value={entitas} onChange={(e) => { setEntitas(e.target.value); setPage(1); }}
              className="rounded-lg border border-kipan-border bg-white px-3 py-2 text-sm font-normal text-kipan-text-dark focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
              {ENTITY_OPTIONS.map((o) => <option key={o} value={o}>{o === '' ? 'Semua entitas' : o}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-kipan-text-muted">
            Aktor
            <input value={aktor} onChange={(e) => { setAktor(e.target.value); setPage(1); }} placeholder="Cari nama aktor"
              className="rounded-lg border border-kipan-border bg-white px-3 py-2 text-sm font-normal text-kipan-text-dark focus:outline-none focus:ring-2 focus:ring-kipan-blue/20" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-kipan-text-muted">
            Dari
            <input type="date" value={dari} onChange={(e) => { setDari(e.target.value); setPage(1); }}
              className="rounded-lg border border-kipan-border bg-white px-3 py-2 text-sm font-normal text-kipan-text-dark focus:outline-none focus:ring-2 focus:ring-kipan-blue/20" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-kipan-text-muted">
            Ke
            <input type="date" value={ke} onChange={(e) => { setKe(e.target.value); setPage(1); }}
              className="rounded-lg border border-kipan-border bg-white px-3 py-2 text-sm font-normal text-kipan-text-dark focus:outline-none focus:ring-2 focus:ring-kipan-blue/20" />
          </label>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Tidak ada aktivitas.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Aktor</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-kipan-border align-top hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-2 text-xs text-kipan-text-muted">{new Date(a.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2">
                    <div className="font-semibold text-kipan-text-dark">{a.actor_name}</div>
                    <div className="text-xs text-kipan-text-muted">{a.actor_role}</div>
                  </td>
                  <td className="px-4 py-2"><span className="rounded bg-kipan-soft-blue px-2 py-0.5 text-xs font-bold text-kipan-navy">{a.action}</span></td>
                  <td className="px-4 py-2 text-kipan-text-muted">{a.entity_name} #{a.entity_id}</td>
                  <td className="px-4 py-2 font-mono text-xs text-kipan-text-muted">{a.ip_address || '-'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-kipan-text-muted">{a.metadata || '-'}</td>
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
