import { useState } from 'react';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { ErrorBox } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { verifyKta } from '../api/ktaService';
import type { KtaVerification } from '../types';

export default function VerifikasiKtaPage() {
  const [nia, setNia] = useState('');
  const [sig, setSig] = useState('');
  const [hasil, setHasil] = useState<KtaVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function cek(): Promise<void> {
    if (!nia.trim()) {
      setError('NIA wajib diisi');
      return;
    }
    setLoading(true);
    setError(null);
    setHasil(null);
    try {
      setHasil(await verifyKta(nia, sig));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memverifikasi KTA');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-16 pt-32">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-kipan-blue">Layanan Publik</p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-kipan-text-dark">Verifikasi Keaslian KTA</h1>
          <p className="mt-2 text-center text-sm text-kipan-text-muted">Masukkan NIA dan kode signature dari QR pada kartu.</p>

          <div className="mt-8 rounded-2xl border border-kipan-border bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-kipan-text-dark">NIA</label>
            <input
              value={nia}
              onChange={(e) => setNia(e.target.value.toUpperCase())}
              placeholder="KIPAN-32-3273-2026-00001"
              className="mt-2 w-full rounded-lg border border-kipan-border px-3.5 py-2.5 text-sm uppercase focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
            />
            <label className="mt-4 block text-sm font-semibold text-kipan-text-dark">Signature QR</label>
            <input
              value={sig}
              onChange={(e) => setSig(e.target.value)}
              placeholder="Tempel kode dari QR di sini"
              className="mt-2 w-full rounded-lg border border-kipan-border px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
            />
            <div className="mt-5">
              <Button variant="primary" disabled={loading} onClick={() => void cek()}>
                {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memverifikasi...</span>) : 'Verifikasi'}
              </Button>
            </div>

            {error && <div className="mt-4"><ErrorBox message={error} /></div>}

            {hasil && (
              <div className={`mt-6 rounded-xl border p-5 ${hasil.valid ? 'border-kipan-green/40 bg-emerald-50' : 'border-kipan-red/30 bg-red-50'}`}>
                <p className={`text-lg font-bold ${hasil.valid ? 'text-kipan-green' : 'text-kipan-red'}`}>
                  {hasil.valid ? '✓ KTA VALID' : '✗ KTA TIDAK VALID'}
                </p>
                <p className="mt-1 font-mono text-xs text-kipan-text-muted">{hasil.nia}</p>
                {hasil.valid && (
                  <dl className="mt-3 grid gap-1 text-sm text-kipan-text-dark">
                    <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Nama</dt><dd className="font-semibold">{hasil.nama_lengkap}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Status</dt><dd className="font-semibold">{hasil.status}</dd></div>
                    {hasil.tanggal_angkat && (
                      <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Tanggal Angkat</dt><dd className="font-semibold">{new Date(hasil.tanggal_angkat).toLocaleDateString('id-ID')}</dd></div>
                    )}
                  </dl>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
