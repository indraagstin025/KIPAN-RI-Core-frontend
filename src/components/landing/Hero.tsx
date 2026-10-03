import { useEffect, useState } from 'react';
import { HERO } from '@/data/landing';
import Badge from '../ui/badge';
import Button from '../ui/button';

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span>
      {n.toLocaleString('id-ID')}
      {suffix}
    </span>
  );
}

export default function Hero() {
  return (
    <section id="beranda" className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-b from-[#061C33] via-kipan-navy to-[#0A3055] pb-14 pt-28 text-white scroll-mt-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-kipan-yellow/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <Badge>{HERO.badge}</Badge>
        <h1 className="mt-6 text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
          {HERO.titleA} <span className="text-kipan-yellow">{HERO.titleB}</span>
        </h1>
        <div className="mb-6 mt-4 h-1.5 w-24 rounded-full bg-kipan-yellow" />
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-blue-100/90 sm:text-lg">{HERO.subtitle}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button to="/daftar" variant="accent">
            Daftar sebagai Kader
            <span aria-hidden="true">→</span>
          </Button>
        </div>
        <dl className="mt-12 grid w-full max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-8 sm:gap-8">
          {HERO.stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="order-2 mt-1 block text-xs font-medium uppercase tracking-wider text-blue-100/70">{s.label}</dt>
              <dd className="text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
                <Counter value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
