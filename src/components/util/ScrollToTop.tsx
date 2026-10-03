import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ScrollToTop menangani posisi scroll setiap navigasi:
// - bila ada hash (#section) → scroll ke elemen tersebut (dengan offset navbar),
//   memungkinkan navigasi antar-halaman ke section landing (mis. "/#tentang").
// - selain itu → reset ke atas agar halaman baru tampil dari awal.
export const HEADER_OFFSET = 80;

export function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth'): void {
  const id = hash.replace(/^#/, '');
  if (!id || id === 'beranda') {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  let attempts = 0;
  const maxAttempts = 15;

  const tryScroll = () => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior });
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(tryScroll, 40);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  };

  tryScroll();
}

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      scrollToHash(hash, 'smooth');
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [pathname, search, hash]);

  return null;
}
