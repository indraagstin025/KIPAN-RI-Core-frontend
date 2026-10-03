import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox, Loading } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { getOrganisasi } from '../api/organisasiService';
import type { OrganisasiProfile } from '../types';

export default function OrganisasiPublicPage() {
  const [data, setData] = useState<OrganisasiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getOrganisasi());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat profil organisasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading />;
  if (!data) return (
    <div className="mx-auto max-w-3xl p-6">
      <ErrorBox message={error ?? 'Profil tidak tersedia'} />
      <div className="mt-4 text-center"><Link to="/" className="text-sm font-semibold text-kipan-blue hover:underline">← Beranda</Link></div>
    </div>
  );

  const sosmed = [
    { label: 'Instagram', value: data.instagram },
    { label: 'Facebook', value: data.facebook },
    { label: 'YouTube', value: data.youtube },
    { label: 'TikTok', value: data.tiktok },
    { label: 'Website', value: data.website },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-kipan-soft-gray">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex justify-center">
          <Link to="/" className="text-sm font-semibold text-kipan-blue hover:underline">← Beranda</Link>
        </div>

        <div className="rounded-2xl border border-kipan-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            {data.logo_url && <img src={data.logo_url} alt={data.nama} className="h-20 w-20 rounded-full border border-kipan-border object-cover" />}
            <div>
              <h1 className="text-2xl font-black text-kipan-navy">{data.nama}</h1>
              {data.singkatan && <p className="text-sm font-semibold text-kipan-blue">{data.singkatan}</p>}
            </div>
          </div>

          {data.deskripsi && <p className="mt-5 text-sm leading-relaxed text-kipan-text-dark">{data.deskripsi}</p>}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {data.visi && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Visi</h2>
                <p className="mt-2 text-sm text-kipan-text-dark">{data.visi}</p>
              </section>
            )}
            {data.misi && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Misi</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-kipan-text-dark">
                  {data.misi.split('\n').filter((m) => m.trim()).map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </section>
            )}
          </div>

          <div className="mt-8 grid gap-4 border-t border-kipan-border pt-6 sm:grid-cols-2">
            <div className="text-sm text-kipan-text-dark">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Kontak</h2>
              {data.alamat && <p>{data.alamat}</p>}
              {data.email && <p>Email: {data.email}</p>}
              {data.telepon && <p>Telepon: {data.telepon}</p>}
              {data.whatsapp && <p>WhatsApp: {data.whatsapp}</p>}
            </div>
            {sosmed.length > 0 && (
              <div className="text-sm text-kipan-text-dark">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Media Sosial</h2>
                <ul className="space-y-1">
                  {sosmed.map((s) => <li key={s.label}><span className="font-semibold">{s.label}:</span> {s.value}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
