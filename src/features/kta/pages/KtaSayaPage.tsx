import { useCallback, useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { ApiError } from '@/services/apiClient';
import { getMyKta, getMyTandaTangan, saveMyTandaTangan } from '../api/ktaService';
import SignatureCanvas from '../components/SignatureCanvas';

// KTA Saya: unduh KTA digital. Aturan: tanda tangan WAJIB dibuat dulu
// (dipakai di halaman validasi saat QR dipindai). Tanpa tanda tangan,
// tombol unduh terkunci dan server juga menolak (fail-closed).
export default function KtaSayaPage() {
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [hasTtd, setHasTtd] = useState(false);
  const [ttdUrl, setTtdUrl] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(async (): Promise<void> => {
    setStatusLoading(true);
    try {
      const s = await getMyTandaTangan();
      setHasTtd(s.exists);
      setTtdUrl(s.view_url);
      setEditing(!s.exists);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat status tanda tangan');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function simpanTtd(blob: Blob): Promise<void> {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await saveMyTandaTangan(blob);
      setMsg('Tanda tangan tersimpan. Anda sekarang dapat mengunduh KTA.');
      await loadStatus();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal menyimpan tanda tangan');
    } finally {
      setSaving(false);
    }
  }

  async function ambil(format: 'pdf' | 'png'): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyKta(format);
      window.open(res.download_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'KTA belum tersedia');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="KTA Saya" desc="Buat tanda tangan lalu unduh Kartu Tanda Anggota digital Anda (PNG atau PDF)." />

      {statusLoading ? (
        <Card>
          <p className="flex items-center gap-2 text-sm text-kipan-text-muted"><Spinner size={15} /> Memuat…</p>
        </Card>
      ) : (
        <Card>
          {!hasTtd && (
            <div className="mb-4 rounded-lg border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-800">
              Buat tanda tangan terlebih dahulu untuk mengaktifkan unduhan KTA.
            </div>
          )}

          {hasTtd && !editing && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-kipan-text-dark">Tanda tangan tersimpan</p>
              {ttdUrl && (
                <img src={ttdUrl} alt="Tanda tangan" className="mt-2 w-full max-w-sm rounded-lg border border-kipan-border bg-white" />
              )}
              <button
                type="button"
                onClick={() => { setEditing(true); setMsg(null); }}
                className="mt-2 text-sm font-semibold text-kipan-blue hover:underline"
              >
                Ganti tanda tangan
              </button>
            </div>
          )}

          {editing && (
            <div className="mb-4">
              <SignatureCanvas onSave={simpanTtd} saving={saving} />
            </div>
          )}

          {msg && (
            <div className="mb-4 rounded-lg border border-kipan-green/40 bg-emerald-50 p-3 text-sm font-medium text-kipan-green">{msg}</div>
          )}
          {error && <div className="mb-4"><ErrorBox message={error} /></div>}

          <p className="text-sm text-kipan-text-muted">
            Tiket unduh berlaku 5 menit. Bila KTA belum diterbitkan atau akun belum terhubung ke data anggota, sistem akan menampilkan pesan.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void ambil('png')}
              disabled={loading || !hasTtd || editing}
              className="inline-flex items-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
            >
              {loading ? (<><Spinner size={15} light /> Menyiapkan...</>) : 'Unduh PNG'}
            </button>
            <button
              type="button"
              onClick={() => void ambil('pdf')}
              disabled={loading || !hasTtd || editing}
              className="inline-flex items-center gap-2 rounded-lg border border-kipan-blue px-6 py-3 text-sm font-semibold text-kipan-blue hover:bg-kipan-soft-blue disabled:opacity-60"
            >
              {loading ? (<><Spinner size={15} light /> Menyiapkan...</>) : 'Unduh PDF'}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
