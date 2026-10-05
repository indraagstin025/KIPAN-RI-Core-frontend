import { Link } from 'react-router-dom';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { Overlay, Spinner } from '@/components/ui/loading';
import { clearDraft } from '../lib/draft';
import { draftHasContent } from '../lib/daftarMapping';
import { STEPS, useDaftarForm } from '../hooks/useDaftarForm';
import { useDaftarSubmit } from '../hooks/useDaftarSubmit';
import HasilTerkirim from '../components/HasilTerkirim';
import LangkahDataDiri from '../components/LangkahDataDiri';
import LangkahDokumen from '../components/LangkahDokumen';
import LangkahKontak from '../components/LangkahKontak';
import LangkahPersyaratan from '../components/LangkahPersyaratan';
import LangkahRingkasan from '../components/LangkahRingkasan';
import { Alert, Stepper } from '../components/fields';

export default function DaftarPage() {
  const form = useDaftarForm();
  const { unggah, submit } = useDaftarSubmit(form);
  const { step, setStep, draft, hasil, umum, setUmum, kirim, wilayahError, touchStep, setSubmitted } = form;

  function lanjut(): void {
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
    if (step === 2 && !form.runValidDokumen()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
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

          {draftHasContent(draft) && !hasil && (
            <div className="mt-4">
              <Alert kind="info">
                Melanjutkan isian yang tersimpan otomatis di perangkat ini.{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Hapus draf tersimpan dan mulai dari awal?')) {
                      clearDraft();
                      window.location.reload();
                    }
                  }}
                  className="font-bold underline hover:text-kipan-navy"
                >
                  Mulai dari awal
                </button>
              </Alert>
            </div>
          )}

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
                          clearDraft();
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
                <Button variant="primary" onClick={lanjut}>Lanjut →</Button>
              ) : (
                <Button variant="accent" disabled={kirim} onClick={() => void submit()}>
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
