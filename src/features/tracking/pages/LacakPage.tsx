import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { ErrorBox, StatusBadge } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { getTracking } from '../api/trackingService';
import { getRegistrations, removeRegistration, type RegistrationRecord } from '../lib/registrationHistory';
import type { TrackingResult } from '../types';

export default function LacakPage() {
  const [params, setParams] = useSearchParams();
  const nomorUrl = params.get('nomor') ?? '';
  const [nomor, setNomor] = useState(nomorUrl);
  const [hasil, setHasil] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [riwayat, setRiwayat] = useState<RegistrationRecord[]>([]);

  useEffect(() => {
    setRiwayat(getRegistrations());
  }, []);

  // Ambil hasil dari URL (back/refresh/share-link tetap menampilkan hasil).
  const fetchByNomor = useCallback(async (target: string) => {
    if (!target) {
      setHasil(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setHasil(null);
    try {
      setHasil(await getTracking(target));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal melacak status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setNomor(nomorUrl);
    void fetchByNomor(nomorUrl);
  }, [nomorUrl, fetchByNomor]);

  function cari(target?: string): void {
    const value = (typeof target === 'string' ? target : nomor).trim().toUpperCase();
    if (!value) {
      setError('Nomor pendaftaran wajib diisi');
      return;
    }
    setParams({ nomor: value });
  }

  function hapus(n: string): void {
    removeRegistration(n);
    setRiwayat(getRegistrations());
  }

  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-16 pt-32">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-kipan-blue">Layanan Mandiri</p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-kipan-text-dark">Lacak Status Pendaftaran</h1>
          <p className="mt-2 text-center text-sm text-kipan-text-muted">Masukkan nomor pendaftaran (contoh: REG-202610-00001).</p>

          <div className="mt-8 rounded-2xl border border-kipan-border bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-kipan-text-dark" htmlFor="nomor-lacak">Nomor Pendaftaran</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="nomor-lacak"
                value={nomor}
                onChange={(e) => setNomor(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') cari();
                }}
                placeholder="REG-202610-00001"
                className="w-full rounded-lg border border-kipan-border px-3.5 py-2.5 text-sm uppercase tracking-wide focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
              />
              <Button variant="primary" disabled={loading} onClick={() => cari()}>
                {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Mencari...</span>) : 'Lacak'}
              </Button>
            </div>

            {error && <div className="mt-4"><ErrorBox message={error} /></div>}

            {hasil && (
              <div className="mt-6 rounded-xl border border-kipan-border bg-kipan-soft-blue p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-bold text-kipan-navy">{hasil.nomor_pendaftaran}</p>
                  <StatusBadge status={hasil.status} label={hasil.status_label} />
                </div>
                <dl className="mt-4 grid gap-2 text-xs text-kipan-text-muted sm:grid-cols-2">
                  <div><dt>Diajukan</dt><dd className="font-semibold text-kipan-text-dark">{new Date(hasil.created_at).toLocaleString('id-ID')}</dd></div>
                  <div><dt>Diperbarui</dt><dd className="font-semibold text-kipan-text-dark">{new Date(hasil.updated_at).toLocaleString('id-ID')}</dd></div>
                </dl>
                {hasil.status === 'PERBAIKAN' && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
                    Berkas Anda perlu perbaikan.{' '}
                    <Link to={`/revisi?nomor=${encodeURIComponent(hasil.nomor_pendaftaran)}`} className="font-bold underline">
                      Ajukan revisi dokumen
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {riwayat.length > 0 && (
            <div className="mt-5 rounded-2xl border border-kipan-border bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-kipan-text-dark">Riwayat pendaftaran di perangkat ini</p>
              <p className="mt-1 text-xs text-kipan-text-muted">
                Nomor yang pernah Anda daftarkan tersimpan di browser. Ketuk untuk melacak kembali.
              </p>
              <ul className="mt-3 divide-y divide-kipan-border">
                {riwayat.map((r) => (
                  <li key={r.nomor} className="flex items-center justify-between gap-3 py-2.5">
                    <button type="button" onClick={() => cari(r.nomor)} className="min-w-0 flex-1 text-left">
                      <span className="block font-mono text-xs font-bold text-kipan-navy">{r.nomor}</span>
                      <span className="block truncate text-xs text-kipan-text-muted">
                        {r.nama} · {r.tipe}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link to={`/revisi?nomor=${encodeURIComponent(r.nomor)}`} className="text-xs font-semibold text-kipan-blue hover:underline">
                        Revisi
                      </Link>
                      <button type="button" onClick={() => hapus(r.nomor)} className="text-xs font-semibold text-kipan-text-muted hover:text-kipan-red" aria-label={`Hapus ${r.nomor}`}>
                        Hapus
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </LandingLayout>
  );
}
