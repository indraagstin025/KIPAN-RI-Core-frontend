import { ALUR } from '@/data/landing';
import Reveal from '../Layout/Reveal';

export default function AlurSection() {
  return (
    <section id="alur" className="bg-kipan-soft-gray py-16 sm:py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-kipan-blue">Cara Bergabung</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-kipan-text-dark sm:text-4xl">Alur Pendaftaran</h2>
        </Reveal>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ALUR.map((s, i) => (
            <Reveal key={s.no} delayMs={i * 100}>
              <li className="relative h-full rounded-2xl border border-kipan-border bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-kipan-navy text-base font-extrabold text-white">
                  {s.no}
                </span>
                <h3 className="mt-4 font-bold text-kipan-text-dark">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-kipan-text-muted">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mx-auto mt-8 max-w-3xl rounded-xl border border-kipan-yellow/60 bg-yellow-50 p-4 text-center text-sm text-kipan-text-dark">
          Nomor WhatsApp wajib diverifikasi OTP sebelum submit — mencegah pendaftaran bot. Email dipakai untuk akun &amp; reset password.
        </Reveal>
      </div>
    </section>
  );
}
