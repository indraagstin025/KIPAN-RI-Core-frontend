import { ORG } from '@/data/landing';
import Reveal from '../Layout/Reveal';

export default function TentangSection() {
  return (
    <section id="tentang" className="bg-kipan-soft-blue py-16 sm:py-20 scroll-mt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <img
            src="/duta-sample.jpg"
            alt="Kegiatan duta KIPAN"
            className="w-full rounded-2xl object-cover shadow-lg"
            loading="lazy"
          />
        </Reveal>
        <Reveal delayMs={120}>
          <p className="text-xs font-bold uppercase tracking-widest text-kipan-blue">Tentang Kami</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-kipan-text-dark sm:text-4xl">{ORG.full}</h2>
          <p className="mt-4 text-sm leading-relaxed text-kipan-text-muted sm:text-base">
            KIPAN menghimpun pemuda Indonesia sebagai kader inti gerakan anti narkoba — dari tingkat nasional (DPP),
            provinsi (DPD), hingga kabupaten/kota (DPC). Sistem informasi ini menjadi satu pintu resmi untuk
            pendaftaran, verifikasi berjenjang, penerbitan Nomor Induk Anggota (NIA), dan Kartu Tanda Anggota digital.
          </p>
          <div className="mt-6 flex items-center gap-5">
            <img src="/kipan-logo.png" alt="Logo KIPAN" className="h-14 w-14 rounded-full border border-kipan-border bg-white object-cover" loading="lazy" />
            <img src="/logo-bnn.jpg" alt="Logo BNN" className="h-14 w-14 rounded-full border border-kipan-border bg-white object-cover" loading="lazy" />
            <p className="text-xs text-kipan-text-muted">Bersinergi dengan Badan Narkotika Nasional dalam pencegahan penyalahgunaan narkoba.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
