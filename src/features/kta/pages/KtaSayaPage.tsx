import { useState } from 'react';
import { Card, ErrorBox, PageHeader } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { ApiError } from '@/services/apiClient';
import { getMyKta } from '../api/ktaService';

export default function KtaSayaPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ambil(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyKta();
      setUrl(res.download_url);
      window.open(res.download_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'KTA belum tersedia');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="KTA Saya" desc="Unduh Kartu Tanda Anggota digital Anda (PDF)." />
      <Card>
        <p className="text-sm text-kipan-text-muted">
          Tiket unduh berlaku 5 menit. Bila KTA belum diterbitkan atau akun belum terhubung ke data anggota, sistem akan menampilkan pesan.
        </p>
        {error && <div className="mt-4"><ErrorBox message={error} /></div>}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => void ambil()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
          >
            {loading ? (<><Spinner size={15} light /> Menyiapkan...</>) : 'Unduh KTA'}
          </button>
        </div>
        {url && <p className="mt-3 break-all text-xs text-kipan-text-muted">URL tiket: {url}</p>}
      </Card>
    </div>
  );
}
