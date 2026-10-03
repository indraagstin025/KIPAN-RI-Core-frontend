import { useState } from 'react';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { ErrorBox, StatusBadge } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { checkPublic } from '../api/anggotaService';
import type { AnggotaPublicInfo } from '../types';

export default function CekAnggotaPage() {
  const [q, setQ] = useState('');
  const [hasil, setHasil] = useState<AnggotaPublicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function cek(): Promise<void> {
    if (!q.trim()) {
      setError('NIA wajib diisi');
      return;
    }
    setLoading(true);
    setError(null);
    setHasil(null);
    try {
      setHasil(await checkPublic(q.trim()));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Data tidak ditemukan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-16 pt-32">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-kipan-blue">Layanan Publik</p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-kipan-text-dark">Cek Keanggotaan Kader</h1>
          <p className="mt-2 text-center text-sm text-kipan-text-muted">Pencarian hanya berdasarkan NIA (Nomor Induk Anggota).</p>

          <div className="mt-8 rounded-2xl border border-kipan-border bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-kipan-text-dark">NIA</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value.toUpperCase())}
                placeholder="KIPAN-IND-3204-2026-000001"
                className="w-full rounded-lg border border-kipan-border px-3.5 py-2.5 text-sm uppercase focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
              />
              <Button variant="primary" disabled={loading} onClick={() => void cek()}>
                {loading ? 'Mencari...' : 'Cek'}
              </Button>
            </div>

            {error && <div className="mt-4"><ErrorBox message={error} /></div>}

            {hasil && (
              <div className="mt-6 rounded-xl border border-kipan-border bg-kipan-soft-blue p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-bold text-kipan-navy">{hasil.nia}</p>
                  <StatusBadge status={hasil.status} />
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-kipan-text-dark">
                  <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Nama</dt><dd className="font-semibold">{hasil.nama_lengkap}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Provinsi</dt><dd className="font-semibold">{hasil.provinsi_nama || '-'}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Kabupaten/Kota</dt><dd className="font-semibold">{hasil.kabupaten_nama || '-'}</dd></div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
