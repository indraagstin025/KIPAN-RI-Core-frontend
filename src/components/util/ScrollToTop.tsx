import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ScrollToTop menangani posisi scroll setiap navigasi:
// - bila ada hash (#section) → scroll ke elemen tersebut (dengan offset navbar),
//   memungkinkan navigasi antar-halaman ke section landing (mis. "/#tentang").
// - selain itu → reset ke atas agar halaman baru tampil dari awal.
const HEADER_OFFSET = 80;

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, '');
      // Tunggu halaman tujuan selesai dirender/di-layout sebelum scroll.
      const t = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({ top, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      }, 60);
      return () => window.clearTimeout(t);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search, hash]);

  return null;
}
