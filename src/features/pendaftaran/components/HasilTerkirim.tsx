import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import type { PendaftaranCreated } from '../types';

export default function HasilTerkirim({ hasil }: { hasil: PendaftaranCreated }) {
  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-28 pt-36">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <div className="rounded-2xl border border-kipan-border bg-white p-8 shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kipan-green text-2xl text-white">✓</span>
            <h1 className="mt-4 font-serif text-2xl font-bold text-kipan-text-dark sm:text-3xl">Pendaftaran Terkirim</h1>
            <p className="mt-2 text-sm text-kipan-text-muted">Simpan nomor pendaftaran untuk pelacakan mandiri. Nomor ini juga dikirim ke WhatsApp Anda.</p>
            <p className="mx-auto mt-5 w-fit rounded-lg bg-kipan-navy px-6 py-3 font-mono text-lg font-bold tracking-wider text-white">
              {hasil.nomor_pendaftaran}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to="/lacak" variant="primary">Lacak Status</Button>
              <Button to="/" variant="outline-navy">Kembali ke Beranda</Button>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
