import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import { ErrorBox, Loading, PageHeader, Pagination } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { createBackup, deleteBackup, downloadBackup, listBackups } from '../api/backupService';
import type { Backup } from '../types';

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function BackupPage() {
  const [items, setItems] = useState<Backup[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBackups(page, 25);
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat riwayat backup');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function buat(): Promise<void> {
    if (!window.confirm('Jalankan backup database sekarang? Proses ini dapat memakan waktu.')) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const b = await createBackup();
      setOk(`Backup dibuat: ${b.filename} (${formatSize(b.size_bytes)})`);
      setPage(1);
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal membuat backup');
    } finally {
      setBusy(false);
    }
  }

  async function unduh(b: Backup): Promise<void> {
    try {
      const res = await downloadBackup(b.id);
      window.open(res.download_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengunduh backup');
    }
  }

  async function hapus(b: Backup): Promise<void> {
    if (!window.confirm(`Hapus backup ${b.filename}?`)) return;
    setBusy(true);
    try {
      await deleteBackup(b.id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal menghapus backup');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Database Backup"
        desc={`${total} arsip backup tersimpan (bucket privat).`}
        action={(
          <Button variant="primary" onClick={() => void buat()} disabled={busy}>
            {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Memproses...</span> : '+ Buat Backup'}
          </Button>
        )}
      />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {ok && <div className="mb-4"><Alert kind="success">{ok}</Alert></div>}
      {busy && <div className="mb-4"><Alert kind="info">Menjalankan pg_dump… mohon tunggu.</Alert></div>}

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Belum ada backup.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">Berkas</th>
                <th className="px-4 py-3">Ukuran</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3 font-mono text-xs text-kipan-text-dark">{b.filename}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{formatSize(b.size_bytes)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${b.status === 'ready' ? 'bg-emerald-100 text-kipan-green' : 'bg-red-100 text-kipan-red'}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-kipan-text-muted">{new Date(b.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => void unduh(b)} className="font-semibold text-kipan-blue hover:underline">Unduh</button>
                      <button type="button" onClick={() => void hapus(b)} className="font-semibold text-kipan-red hover:underline">Hapus</button>
                    </div>
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
