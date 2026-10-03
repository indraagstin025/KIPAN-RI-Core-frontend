import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { Alert, Field, Stepper, TextInput } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { uploadDokumen } from '@/features/storage/api/storageService';
import type { DokumenCategory } from '@/features/storage/types';
import { requestRevisionToken, submitRevision } from '../api/trackingService';
import { getRegistrations } from '../lib/registrationHistory';

const DOCS: Array<{ category: DokumenCategory; label: string; accept: string }> = [
  { category: 'foto', label: 'Pas Foto', accept: 'image/jpeg,image/png' },
  { category: 'ktp', label: 'KTP', accept: 'image/jpeg,image/png,application/pdf' },
  { category: 'cv', label: 'CV / Resume', accept: 'application/pdf' },
  { category: 'sk', label: 'Surat Keputusan (SK)', accept: 'application/pdf' },
  { category: 'surat_pernyataan', label: 'Surat Pernyataan', accept: 'application/pdf' },
  { category: 'surat_sehat', label: 'Surat Sehat', accept: 'application/pdf' },
];

export default function RevisiPage() {
  const [params] = useSearchParams();
  const nomorAwal = params.get('nomor') ?? '';
  const riwayatCocok = getRegistrations().find((r) => r.nomor.toUpperCase() === nomorAwal.toUpperCase());
  const [step, setStep] = useState(0);
  const [nomor, setNomor] = useState(nomorAwal);
  const [email, setEmail] = useState(riwayatCocok?.email ?? '');
  const [wa, setWa] = useState(riwayatCocok?.whatsapp ?? '');
  const [token, setToken] = useState('');
  const [keys, setKeys] = useState<Partial<Record<DokumenCategory, string>>>({});
  const [uploading, setUploading] = useState<DokumenCategory | null>(null);
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);
  const [tokenTerkirim, setTokenTerkirim] = useState(false);
  const [loading, setLoading] = useState(false);

  async function mintaToken(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      await requestRevisionToken({ nomor: nomor.trim(), email: email.trim(), whatsapp: wa.trim() });
      setTokenTerkirim(true);
      setStep(1);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal meminta token revisi');
    } finally {
      setLoading(false);
    }
  }

  async function unggah(category: DokumenCategory, file: File): Promise<void> {
    setUploading(category);
    setError(null);
    try {
      const key = await uploadDokumen(category, file);
      setKeys((p) => ({ ...p, [category]: key }));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Unggah gagal');
    } finally {
      setUploading(null);
    }
  }

  async function kirim(): Promise<void> {
    if (!token.trim()) {
      setError('Token revisi wajib diisi');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitRevision(nomor.trim(), { token: token.trim(), ...keys, catatan: catatan.trim() || undefined });
      setSukses(true);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Revisi gagal dikirim');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-16 pt-32">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-kipan-blue">Revisi Dokumen</p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-kipan-text-dark">Perbaikan Berkas Pendaftaran</h1>
          <div className="mt-8"><Stepper steps={['Bukti Pemilik', 'Unggah Berkas']} active={step} /></div>

          {error && <div className="mt-5"><ErrorBox message={error} /></div>}

          {sukses ? (
            <div className="mt-6 rounded-2xl border border-kipan-border bg-white p-8 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kipan-green text-2xl text-white">✓</span>
              <h2 className="mt-4 text-xl font-bold text-kipan-text-dark">Revisi Terkirim</h2>
              <p className="mt-2 text-sm text-kipan-text-muted">Status pendaftaran kembali ke DRAFT dan akan diverifikasi ulang.</p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-kipan-border bg-white p-6 shadow-sm sm:p-8">
              {step === 0 && (
                <div className="grid gap-5">
                  <Alert kind="info">Masukkan nomor pendaftaran serta email <strong>dan</strong> WhatsApp yang terdaftar sebagai bukti kepemilikan.</Alert>
                  <Field label="Nomor Pendaftaran">
                    <TextInput value={nomor} onChange={setNomor} placeholder="REG-202610-00001" />
                  </Field>
                  <Field label="Email Terdaftar">
                    <TextInput value={email} onChange={setEmail} inputMode="email" />
                  </Field>
                  <Field label="Nomor WhatsApp Terdaftar">
                    <TextInput value={wa} onChange={setWa} inputMode="tel" />
                  </Field>
                  <Button variant="primary" disabled={loading} onClick={() => void mintaToken()}>
                    {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memproses...</span>) : 'Minta Token Revisi'}
                  </Button>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-5">
                  {tokenTerkirim && (
                    <Alert kind="success">
                      Token revisi telah dikirim ke <strong>{email}</strong>. Buka email tersebut, salin tokennya ke kolom di bawah (berlaku 24 jam, sekali pakai).
                    </Alert>
                  )}
                  <Field label="Token Revisi" hint="Salin dari email terdaftar. Berlaku 24 jam, sekali pakai.">
                    <TextInput value={token} onChange={setToken} />
                  </Field>
                  <p className="text-sm font-semibold text-kipan-text-dark">Unggah berkas pengganti (kosongkan bila tidak diubah)</p>
                  {DOCS.map((d) => (
                    <div key={d.category} className="rounded-xl border border-kipan-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-kipan-text-dark">{d.label}</p>
                        {keys[d.category] && <span className="text-kipan-green">✓</span>}
                      </div>
                      <input
                        type="file"
                        accept={d.accept}
                        disabled={uploading === d.category}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.currentTarget.value = '';
                          if (f) void unggah(d.category, f);
                        }}
                        className="mt-2 block w-full text-sm text-kipan-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-kipan-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      {uploading === d.category && <p className="mt-1 inline-flex items-center gap-2 text-xs text-kipan-blue"><Spinner size={12} /> Mengunggah...</p>}
                    </div>
                  ))}
                  <Field label="Catatan (opsional)">
                    <TextInput value={catatan} onChange={setCatatan} />
                  </Field>
                  <div className="flex justify-between gap-3">
                    <Button variant="ghost" onClick={() => setStep(0)}>← Kembali</Button>
                    <Button variant="primary" disabled={loading} onClick={() => void kirim()}>
                      {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Mengirim...</span>) : 'Kirim Revisi'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </LandingLayout>
  );
}
