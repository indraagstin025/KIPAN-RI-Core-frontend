import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert } from '@/components/ui/fields';
import { ErrorBox, Loading, PageHeader, Pagination } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { listOutbox, retryManyOutbox, retryPendingOutbox, sendOutboxNow } from '../api/outboxService';
import type { OutboxItem, OutboxJenis, OutboxStatus } from '../types';

const JENIS_LABEL: Record<OutboxJenis, string> = {
  STATUS_DISETUJUI: 'Status: Disetujui',
  STATUS_DITOLAK: 'Status: Ditolak',
  STATUS_PERBAIKAN: 'Status: Perbaikan',
  SET_PASSWORD: 'Buat Kata Sandi',
  AKUN_TERHUBUNG: 'Akun Tertaut',
};

const JENIS_OPTIONS = ['', 'SET_PASSWORD', 'AKUN_TERHUBUNG', 'STATUS_DISETUJUI', 'STATUS_PERBAIKAN', 'STATUS_DITOLAK'];
const STATUS_OPTIONS = ['', 'pending', 'sent', 'failed'];

function statusStyle(s: OutboxStatus): string {
  if (s === 'sent') return 'bg-emerald-100 text-kipan-green';
  if (s === 'failed') return 'bg-red-100 text-kipan-red';
  return 'bg-amber-100 text-amber-700';
}
function statusLabel(s: OutboxStatus): string {
  return s === 'sent' ? 'Terkirim' : s === 'failed' ? 'Gagal' : 'Menunggu';
}

export default function OutboxListPage() {
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [jenis, setJenis] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listOutbox({ page, limit: 20, jenis: jenis || undefined, status: status || undefined });
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
      setSelected(new Set());
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat antrian email');
    } finally {
      setLoading(false);
    }
  }, [page, jenis, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: number): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function aksi(fn: () => Promise<unknown>): Promise<void> {
    setAksiError(null);
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Aksi gagal');
    } finally {
      setBusy(false);
    }
  }

  const allSelected = items.length > 0 && items.every((it) => selected.has(it.id));

  return (
    <div>
      <PageHeader
        title="Antrian Email"
        desc="Pemantauan pengiriman email. Tombol 'Kirim Sekarang' mengirim langsung; tombol antre menunggu worker (perlu cmd/worker aktif)."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline-navy" onClick={() => void aksi(retryPendingOutbox)} disabled={busy}>Antrekan Semua Pending</Button>
            <Button variant="outline-navy" onClick={() => void aksi(() => retryManyOutbox([...selected]))} disabled={busy || selected.size === 0}>
              Antrekan Terpilih ({selected.size})
            </Button>
            <Button
              variant="primary"
              disabled={busy || selected.size !== 1}
              onClick={() => {
                const id = [...selected][0];
                if (id !== undefined) void aksi(() => sendOutboxNow(id));
              }}
            >
              Kirim Sekarang
            </Button>
          </div>
        )}
      />

      {aksiError && <div className="mb-4"><Alert kind="error">{aksiError}</Alert></div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          {JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j === '' ? 'Semua jenis' : JENIS_LABEL[j as OutboxJenis]}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === '' ? 'Semua status' : statusLabel(s as OutboxStatus)}</option>)}
        </select>
        <button type="button" onClick={() => void load()} className="rounded-lg border border-kipan-border px-4 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-blue">Muat ulang</button>
      </div>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Antrian email kosong.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? new Set(items.map((it) => it.id)) : new Set())} className="h-4 w-4 accent-kipan-navy" aria-label="Pilih semua" />
                </th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Penerima</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Percobaan</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)} className="h-4 w-4 accent-kipan-navy" /></td>
                  <td className="px-4 py-3 font-semibold text-kipan-text-dark">{JENIS_LABEL[it.jenis] ?? it.jenis}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{it.to_email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle(it.status)}`}>{statusLabel(it.status)}</span>
                    {it.status === 'failed' && it.last_error && <div className="mt-1 text-[10px] text-kipan-red">{it.last_error}</div>}
                  </td>
                  <td className="px-4 py-3 text-kipan-text-muted">{it.attempts}</td>
                  <td className="px-4 py-3 text-xs text-kipan-text-muted">{new Date(it.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">
                    {it.status !== 'sent' && (
                      <button type="button" onClick={() => void aksi(() => sendOutboxNow(it.id))} className="font-semibold text-kipan-blue hover:underline">Kirim Sekarang</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      <p className="mt-2 text-xs text-kipan-text-muted">{total} email dalam antrian.</p>
    </div>
  );
}
