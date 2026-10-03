import Button from '../ui/button';
import Reveal from '../Layout/Reveal';

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#061C33] to-kipan-navy py-16 text-white sm:py-20">
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-kipan-yellow/10 blur-3xl" aria-hidden="true" />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-serif text-3xl font-bold sm:text-4xl">
          Siap Menjadi Bagian dari <span className="text-kipan-yellow">Indonesia Bersinar?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-blue-100/85 sm:text-base">
          Pendaftaran gratis, terverifikasi resmi, dan data Anda dilindungi standar keamanan perbankan.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button to="/daftar" variant="accent">Daftar sebagai Kader</Button>
        </div>
      </Reveal>
    </section>
  );
}
