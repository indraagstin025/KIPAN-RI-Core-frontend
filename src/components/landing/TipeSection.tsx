import { TIPE_CARDS } from '@/data/landing';
import Button from '../ui/button';
import Reveal from '../Layout/Reveal';

export default function TipeSection() {
  return (
    <section id="daftar" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-kipan-blue">Pendaftaran</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-kipan-text-dark sm:text-4xl">Pilih Jalur Pendaftaran</h2>
          <p className="mt-3 text-sm leading-relaxed text-kipan-text-muted sm:text-base">
            Satu formulir, dua jalur. Pengurus wajib melampirkan Surat Keputusan (SK) — Kader tidak perlu.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {TIPE_CARDS.map((c, i) => (
            <Reveal key={c.tipe} delayMs={i * 120}>
              <article
                className={`flex h-full flex-col rounded-2xl border p-7 sm:p-8 ${
                  c.tipe === 'pengurus' ? 'border-kipan-navy/20 bg-kipan-soft-blue' : 'border-kipan-border bg-white shadow-sm'
                }`}
              >
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    c.tipe === 'pengurus' ? 'bg-kipan-navy text-white' : 'bg-kipan-yellow text-kipan-text-dark'
                  }`}
                >
                  {c.tipe}
                </span>
                <h3 className="mt-4 text-xl font-bold text-kipan-text-dark">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-kipan-text-muted">{c.desc}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-kipan-text-dark">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
                        <circle cx="10" cy="10" r="9" fill={c.tipe === 'pengurus' ? '#0D3F70' : '#3A7662'} opacity="0.12" />
                        <path d="M6.5 10.2l2.4 2.4 4.6-5" stroke={c.tipe === 'pengurus' ? '#0D3F70' : '#3A7662'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <Button to={c.cta} variant={c.tipe === 'pengurus' ? 'primary' : 'accent'}>
                    {c.title} <span aria-hidden="true">→</span>
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
