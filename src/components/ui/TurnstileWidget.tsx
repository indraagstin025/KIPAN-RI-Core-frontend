import { useEffect, useRef } from 'react';
import { TURNSTILE_SITE_KEY } from '@/config/env';

// TurnstileWidget: widget verifikasi bot Cloudflare tanpa dependensi baru
// (script resmi + render manual). Key-remount dari induk me-reset widget
// (token Turnstile sekali pakai) — tanpa imperative API.
interface Props {
  onToken: (token: string | null) => void;
  onError?: (message: string) => void;
}

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    remove: (id: string) => void;
  };
}

declare const window: TurnstileWindow;

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window.turnstile !== 'undefined') return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('gagal memuat verifikasi keamanan'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function TurnstileWidget({ onToken, onError }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const cbRef = useRef({ onToken, onError });

  // Sinkronkan callback terbaru di luar render (aturan refs).
  useEffect(() => {
    cbRef.current = { onToken, onError };
  });

  useEffect(() => {
    let widgetId: string | null = null;
    let stop = false;
    if (!TURNSTILE_SITE_KEY) {
      cbRef.current.onError?.('Verifikasi keamanan belum dikonfigurasi (site key kosong).');
      return;
    }
    void loadScript().then(
      () => {
        if (stop || !boxRef.current || typeof window.turnstile === 'undefined') return;
        widgetId = window.turnstile.render(boxRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => cbRef.current.onToken(token),
          'expired-callback': () => cbRef.current.onToken(null),
          'error-callback': () => {
            cbRef.current.onToken(null);
            cbRef.current.onError?.('Verifikasi keamanan gagal dimuat. Periksa koneksi lalu coba lagi.');
          },
        });
      },
      (e: unknown) => {
        if (!stop) cbRef.current.onError?.(e instanceof Error ? e.message : 'Verifikasi keamanan gagal dimuat.');
      },
    );
    return () => {
      stop = true;
      if (widgetId !== null && typeof window.turnstile !== 'undefined') {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // abaikan (unmount ganda)
        }
      }
    };
  }, []);

  return <div ref={boxRef} className="mt-3 min-h-[65px]" />;
}
