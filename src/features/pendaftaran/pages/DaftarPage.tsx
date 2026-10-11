import { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { Overlay, Spinner } from '@/components/ui/loading';
import { ApiError } from '@/services/apiClient';
import { useTurnstileGate } from '@/components/ui/useTurnstileGate';
import { STEPS, useDaftarForm } from '../hooks/useDaftarForm';
import { useDaftarSubmit } from '../hooks/useDaftarSubmit';
import HasilTerkirim from '../components/HasilTerkirim';
import LangkahDataDiri from '../components/LangkahDataDiri';
import LangkahDokumen from '../components/LangkahDokumen';
import LangkahKontak from '../components/LangkahKontak';
import LangkahPersyaratan from '../components/LangkahPersyaratan';
import LangkahRingkasan from '../components/LangkahRingkasan';
import TurnstileWidget from '@/components/ui/TurnstileWidget';
import { Alert, Stepper } from '../components/fields';
import { verifyDokumen } from '@/features/storage/api/storageService';
import { DOKUMEN_LIST, isDokumenWajib } from '../constants/dokumen';

export default function DaftarPage() {
  const form = useDaftarForm();
  const { unggah, submit } = useDaftarSubmit(form);
  const { step, setStep, hasil, umum, setUmum, kirim, wilayahError, touchStep, setSubmitted } = form;
  // Token Turnstile lapis 2 (submit): sekali pakai, remount tiap percobaan.
  const gate = useTurnstileGate();
  const siapKirim = !kirim && (!gate.enabled || gate.token !== null);

  async function kirimPendaftaran(): Promise<void> {
    if (!siapKirim) return;
    await submit(gate.token ?? undefined);
    gate.reset();
  }

  const [verifikasi, setVerifikasi] = useState(false);

  // verifikasiDokumenServer: gerbang langkah — pastikan tiap berkas wajib
  // benar-benar valid di server SEBELUM ke Persyaratan (masalah muncul dini,
  // bukan misteri di submit). Tanpa purge; error ditulis per slot.
  async function verifikasiDokumenServer(): Promise<boolean> {
    const wajib = DOKUMEN_LIST.filter((d) => isDokumenWajib(d.category));
    const hasil = await Promise.all(wajib.map(async (d) => {
      const st = form.docs[d.category];
      if (!st.key) return { category: d.category, label: d.label, ok: true };
      try {
        await verifyDokumen(st.key, d.category);
        return { category: d.category, label: d.label, ok: true };
      } catch (e: unknown) {
        return {
          category: d.category,
          label: d.label,
          ok: false,
          pesan: e instanceof ApiError ? e.message : 'Dokumen gagal diverifikasi',
        };
      }
    }));
    const gagal = hasil.filter((r) => !r.ok);
    if (gagal.length > 0) {
      form.setDocs((p) => {
        const next = { ...p };
        for (const g of gagal) {
          const cur = next[g.category];
          if (cur) next[g.category] = { ...cur, error: (g as { pesan?: string }).pesan ?? 'Dokumen bermasalah' };
        }
        return next;
      });
      setUmum(`Ada dokumen bermasalah (${gagal.map((g) => g.label).join(', ')}). Perbaiki/unggah ulang sebelum lanjut.`);
      return false;
    }
    return true;
  }

  async function lanjut(): Promise<void> {
    if (verifikasi) return;
    setUmum(null);
    setSubmitted(true);
    touchStep(step);
    if (step === 0 && !form.runValidDataDiri()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (step === 1 && !form.runValidKontak()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (step === 2) {
      if (!form.runValidDokumen()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setVerifikasi(true);
      try {
        if (!(await verifikasiDokumenServer())) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } finally {
        setVerifikasi(false);
      }
    }
    if (step === 3 && !form.runValidPersyaratan()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function mundur(): void {
    setUmum(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (hasil) {
    return <HasilTerkirim hasil={hasil} />;
  }

  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-14 pt-28 sm:pt-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-kipan-blue">Formulir Pendaftaran</p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-kipan-text-dark sm:text-4xl">
            Daftar sebagai Kader
          </h1>
          <div className="mt-8">
            <Stepper steps={STEPS} active={step} />
          </div>

          {umum && (
            <div className="mt-6">
              <Alert kind="error">{umum}</Alert>
            </div>
          )}
          {wilayahError && (
            <div className="mt-4">
              <Alert kind="error">{wilayahError}</Alert>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-kipan-border bg-white p-6 shadow-sm sm:p-8">
            {step === 0 && <LangkahDataDiri form={form} />}
            {step === 1 && <LangkahKontak form={form} />}
            {step === 2 && <LangkahDokumen form={form} unggah={unggah} />}
            {step === 3 && <LangkahPersyaratan form={form} />}
            {step === 4 && <LangkahRingkasan form={form} />}
            {step === 4 && gate.enabled && (
              <div className="mt-5 rounded-xl border border-kipan-border bg-kipan-soft-blue p-4">
                <p className="text-sm font-bold text-kipan-navy">Verifikasi keamanan terakhir</p>
                <TurnstileWidget key={gate.widgetKey} onToken={(t) => gate.handleToken(t)} />
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">
              <div>
                {step > 0 ? (
                  <Button variant="ghost" onClick={mundur}>← Kembali</Button>
                ) : (
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-kipan-blue hover:bg-kipan-soft-blue">
                      ← Beranda
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Kosongkan formulir dan mulai dari awal?')) {
                          window.location.reload();
                        }
                      }}
                      className="text-xs font-semibold text-kipan-text-muted underline hover:text-kipan-red"
                    >
                      Kosongkan formulir
                    </button>
                  </div>
                )}
              </div>
              {step < 4 ? (
                <Button variant="primary" disabled={verifikasi} onClick={() => void lanjut()}>
                  {verifikasi ? (<span className="inline-flex items-center gap-2"><Spinner size={15} /> Memverifikasi dokumen...</span>) : 'Lanjut →'}
                </Button>
              ) : (
                <Button variant="accent" disabled={!siapKirim} onClick={() => void kirimPendaftaran()}>
                  {kirim ? (<span className="inline-flex items-center gap-2"><Spinner size={15} /> Mengirim...</span>) : 'Kirim Pendaftaran'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      {kirim && <Overlay label="Mengirim pendaftaran... mohon tunggu, jangan tutup halaman ini." />}
    </LandingLayout>
  );
}
