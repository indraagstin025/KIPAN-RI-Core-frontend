import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NAV_ITEMS, ORG } from '@/data/landing';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 25);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/15 bg-kipan-navy/95 py-3 shadow-lg backdrop-blur-md' : 'border-b border-white/10 bg-transparent py-4'
      }`}
    >
      <div className="absolute left-0 top-0 h-[3px] bg-kipan-yellow transition-all duration-150" style={{ width: `${progress}%` }} />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-kipan-yellow">
          <img src="/logo-kipan.jpg" alt="Logo KIPAN" className="h-10 w-10 rounded-full border border-white/30 bg-white object-cover lg:h-11 lg:w-11" />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-tight text-white lg:text-lg">
              {ORG.name} <span className="text-kipan-yellow">RI</span>
            </span>
            <span className="hidden text-[11px] font-medium text-blue-100/80 sm:block">Sistem Informasi KIPAN</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) =>
            item.href.startsWith('#') ? (
              <a key={item.label} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-blue-50/90 hover:bg-white/10 hover:text-white">
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-blue-50/90 hover:bg-white/10 hover:text-white">
                {item.label}
              </Link>
            ),
          )}
          <Link
            to="/login"
            className="ml-2 rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-kipan-yellow"
          >
            Masuk
          </Link>
          <Link
            to="/daftar"
            className="ml-1 rounded-lg bg-kipan-yellow px-5 py-2.5 text-sm font-bold text-kipan-text-dark hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Daftar Sekarang
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-kipan-navy/95 px-4 pb-4 pt-2 backdrop-blur-md lg:hidden" aria-label="Navigasi seluler">
          {NAV_ITEMS.map((item) =>
            item.href.startsWith('#') ? (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-blue-50 hover:bg-white/10">
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-blue-50 hover:bg-white/10">
                {item.label}
              </Link>
            ),
          )}
          <Link to="/login" onClick={() => setOpen(false)} className="mt-2 block rounded-lg border border-white/40 px-3 py-2.5 text-center text-sm font-semibold text-white">
            Masuk
          </Link>
          <Link to="/daftar" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-kipan-yellow px-3 py-2.5 text-center text-sm font-bold text-kipan-text-dark">
            Daftar Sekarang
          </Link>
        </nav>
      )}
    </header>
  );
}
