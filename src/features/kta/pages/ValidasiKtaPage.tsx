import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { ErrorBox } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { verifyKta } from '../api/ktaService';
import QrScanModal from '../components/QrScanModal';
import type { KtaVerification } from '../types';

// Halaman validasi KTA publik (K2). Dibuka dari QR kartu
// (/validasi-kta/:nia?sig=...) → verifikasi otomatis, lalu menampilkan foto,
// nama, NIA, status, wilayah, dan ringkas riwayat. Tanpa sig: mode manual.
export default function ValidasiKtaPage() {
  const { nia: niaParam } = useParams();
  const [searchParams] = useSearchParams();
  const [nia, setNia] = useState(niaParam ?? '');
  const [sig, setSig] = useState(searchParams.get('sig') ?? '');
  const [hasil, setHasil] = useState<KtaVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const autoRan = useRef(false);

  const cek = useCallback(async (n: string, s: string): Promise<void> => {
    if (!n.trim()) {
      setError('NIA wajib diisi');
      return;
    }
    setLoading(true);
    setError(null);
    setHasil(null);
    try {
      setHasil(await verifyKta(n, s));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memverifikasi KTA');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-verifikasi sekali saat dibuka dari QR (nia di path + sig di query).
  useEffect(() => {
    if (autoRan.current) return;
    const n = niaParam?.trim() ?? '';
    const s = (searchParams.get('sig') ?? '').trim();
    if (n && s) {
      autoRan.current = true;
      void cek(n, s);
    }
  }, [niaParam, searchParams, cek]);

  const tidakBerlaku = hasil != null && !hasil.valid && !!(hasil.nama_lengkap || hasil.status);
  const terverifikasi = hasil != null && (hasil.valid || tidakBerlaku);

  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-16 pt-32">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-kipan-blue">Layanan Publik</p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-kipan-text-dark">Validasi Keaslian KTA</h1>
          <p className="mt-2 text-center text-sm text-kipan-text-muted">Pindai QR pada kartu, atau masukkan NIA dan kode signature secara manual.</p>

          <div className="mt-8 rounded-2xl border border-kipan-border bg-white p-6 shadow-sm">
            <Button variant="primary" disabled={loading} onClick={() => setScanOpen(true)}>
              Pindai QR dengan Kamera
            </Button>

            <div className="mt-6 border-t border-kipan-border pt-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-kipan-text-muted">atau isi manual</p>
              <label className="block text-sm font-semibold text-kipan-text-dark">NIA</label>
            <input
              value={nia}
              onChange={(e) => setNia(e.target.value.toUpperCase())}
              placeholder="KIPAN-IND-3204-2026-000001"
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
              <Button variant="primary" disabled={loading} onClick={() => void cek(nia, sig)}>
                {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memverifikasi...</span>) : 'Validasi'}
              </Button>
            </div>

            {error && <div className="mt-4"><ErrorBox message={error} /></div>}

            {hasil && (
              <div className={`mt-6 rounded-xl border p-5 ${hasil.valid ? 'border-kipan-green/40 bg-emerald-50' : tidakBerlaku ? 'border-amber-400/50 bg-amber-50' : 'border-kipan-red/30 bg-red-50'}`}>
                <p className={`text-lg font-bold ${hasil.valid ? 'text-kipan-green' : tidakBerlaku ? 'text-amber-700' : 'text-kipan-red'}`}>
                  {hasil.valid ? '✓ KTA VALID' : tidakBerlaku ? '⚠ KTA TIDAK BERLAKU' : '✗ KTA TIDAK VALID'}
                </p>
                <p className="mt-1 font-mono text-xs text-kipan-text-muted">{hasil.nia}</p>

                {terverifikasi ? (
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                    {hasil.foto_url && (
                      <img
                        src={hasil.foto_url}
                        alt="Foto anggota"
                        className="h-36 w-28 shrink-0 rounded-lg border border-kipan-border object-cover"
                      />
                    )}
                    <dl className="grid flex-1 gap-1.5 text-sm text-kipan-text-dark">
                      <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Nama</dt><dd className="font-semibold">{hasil.nama_lengkap}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Status</dt><dd className="font-semibold">{hasil.status || '-'}</dd></div>
                      {(hasil.wilayah_kabupaten || hasil.wilayah_provinsi) && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-kipan-text-muted">Wilayah</dt>
                          <dd className="text-right font-semibold">{[hasil.wilayah_kabupaten, hasil.wilayah_provinsi].filter(Boolean).join(', ')}</dd>
                        </div>
                      )}
                      {hasil.tanggal_angkat && (
                        <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Tanggal Angkat</dt><dd className="font-semibold">{new Date(hasil.tanggal_angkat).toLocaleDateString('id-ID')}</dd></div>
                      )}
                      {hasil.riwayat && (
                        <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Riwayat</dt><dd className="text-right font-semibold">{hasil.riwayat}</dd></div>
                      )}
                    </dl>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-kipan-text-muted">
                    Data tidak ditemukan atau signature tidak cocok. Pastikan NIA dan signature benar.
                  </p>
                )}

                {hasil.tanda_tangan_url && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-kipan-text-muted">Tanda tangan anggota</p>
                    <img
                      src={hasil.tanda_tangan_url}
                      alt="Tanda tangan anggota"
                      className="mt-1 w-full max-w-xs rounded-lg border border-kipan-border bg-white"
                    />
                  </div>
                )}

                {tidakBerlaku && (
                  <p className="mt-3 text-xs font-medium text-amber-700">
                    Kartu asli diterbitkan, namun keanggotaan tidak lagi aktif.
                  </p>
                )}

                {hasil.foto_url && (
                  <p className="mt-3 text-xs text-kipan-text-muted">
                    Bandingkan foto ini dengan foto pada sisi depan kartu.
                  </p>
                )}
              </div>
            )}
            </div>
          </div>
          <QrScanModal
            open={scanOpen}
            onClose={() => setScanOpen(false)}
            onScan={(n, s) => {
              setScanOpen(false);
              setNia(n);
              setSig(s);
              void cek(n, s);
            }}
          />
        </div>
      </section>
    </LandingLayout>
  );
}
