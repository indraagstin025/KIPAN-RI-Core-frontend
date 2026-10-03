import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS, ORG } from '@/data/landing';
import { useAuth } from '@/context/AuthContext';
import { isAdminRole } from '@/features/auth/types';
import { scrollToHash } from '@/components/util/ScrollToTop';

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  const isHome = location.pathname === '/';
  const isSolid = !isHome || scrolled;

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

  // Scroll spy pada Landing Page untuk menyorot section yang aktif di navbar
  useEffect(() => {
    if (!isHome) return;

    const sectionIds = ['beranda', 'tentang', 'daftar', 'alur'];
    const handleSectionScroll = () => {
      const scrollPos = window.scrollY + 130;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          return;
        }
      }
      setActiveSection('beranda');
    };

    handleSectionScroll();
    window.addEventListener('scroll', handleSectionScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleSectionScroll);
  }, [isHome]);

  const isItemActive = (href: string) => {
    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '');
      return isHome && activeSection === sectionId;
    }
    return location.pathname === href;
  };

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    setOpen(false);

    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '');
      if (isHome) {
        e.preventDefault();
        window.history.pushState(null, '', href);
        scrollToHash(sectionId);
      }
      // Bila dari halaman lain (mis. /lacak), Link bawaan react-router-dom akan
      // mengarahkan ke '/' dengan hash, lalu ScrollToTop menangani scroll halus.
    } else if (href === '/') {
      if (isHome) {
        e.preventDefault();
        window.history.pushState(null, '', '/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (location.pathname === href) {
      // Sedang di halaman yang sama, scroll ke atas dengan halus
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    setOpen(false);
    if (isHome) {
      e.preventDefault();
      window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const userDashboard = user
    ? {
        to: isAdminRole(user.role) ? '/admin' : '/akun/kta',
        label: isAdminRole(user.role) ? 'Dasbor Admin' : 'Akun Saya',
      }
    : null;

  const isLoginActive = location.pathname === '/login';
  const isDaftarActive = location.pathname === '/daftar';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isSolid
          ? 'border-b border-white/15 bg-kipan-navy/95 py-3 shadow-lg backdrop-blur-md'
          : 'border-b border-white/10 bg-transparent py-4'
      }`}
    >
      <div className="absolute left-0 top-0 h-[3px] bg-kipan-yellow transition-all duration-150" style={{ width: `${progress}%` }} />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-kipan-yellow"
        >
          <img src="/logo-kipan.jpg" alt="Logo KIPAN" className="h-10 w-10 rounded-full border border-white/30 bg-white object-cover lg:h-11 lg:w-11" />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-tight text-white lg:text-lg">
              {ORG.name} <span className="text-kipan-yellow">RI</span>
            </span>
            <span className="hidden text-[11px] font-medium text-blue-100/80 sm:block">Sistem Informasi KIPAN</span>
          </span>
        </Link>

        {/* Menu Desktop */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-kipan-yellow font-bold shadow-xs'
                    : 'text-blue-50/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {userDashboard ? (
            <Link
              to={userDashboard.to}
              className="ml-2 flex items-center gap-2 rounded-lg bg-kipan-yellow px-4 py-2 text-sm font-bold text-kipan-text-dark shadow-sm hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-kipan-navy text-[10px] font-black text-white">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
              <span>{userDashboard.label}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={`ml-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kipan-yellow ${
                  isLoginActive
                    ? 'bg-white/15 text-kipan-yellow font-bold shadow-xs'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                onClick={(e) => handleNavClick('/daftar', e)}
                className={`ml-1 rounded-lg px-5 py-2.5 text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isDaftarActive
                    ? 'bg-white text-kipan-navy ring-2 ring-kipan-yellow shadow-md'
                    : 'bg-kipan-yellow text-kipan-text-dark shadow-sm hover:brightness-95'
                }`}
              >
                Daftar Sekarang
              </Link>
            </>
          )}
        </nav>

        {/* Tombol Hamburger Seluler */}
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

      {/* Menu Seluler */}
      {open && (
        <nav className="border-t border-white/10 bg-kipan-navy/95 px-4 pb-4 pt-2 backdrop-blur-md lg:hidden" aria-label="Navigasi seluler">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-kipan-yellow font-bold'
                    : 'text-blue-50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {userDashboard ? (
            <Link
              to={userDashboard.to}
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-kipan-yellow px-4 py-2.5 text-center text-sm font-bold text-kipan-text-dark"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-kipan-navy text-[10px] font-black text-white">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
              <span>{userDashboard.label}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={`mt-2 block rounded-lg border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                  isLoginActive
                    ? 'border-kipan-yellow bg-white/15 text-kipan-yellow font-bold'
                    : 'border-white/40 text-white hover:bg-white/10'
                }`}
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                onClick={(e) => handleNavClick('/daftar', e)}
                className={`mt-2 block rounded-lg px-3 py-2.5 text-center text-sm font-bold transition-all ${
                  isDaftarActive
                    ? 'bg-white text-kipan-navy ring-2 ring-kipan-yellow shadow-md'
                    : 'bg-kipan-yellow text-kipan-text-dark hover:brightness-95'
                }`}
              >
                Daftar Sekarang
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
