import { useCallback, useState } from 'react';
import { TURNSTILE_SITE_KEY } from '@/config/env';

// useTurnstileGate: state token Turnstile sekali pakai + remount widget.
// Dipakai 4 titik (OTP, submit, 2 form login) agar logika remount tidak
// diduplikasi. JSX <TurnstileWidget> tetap di tiap situs (posisi beda).
export function useTurnstileGate() {
  const [token, setToken] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const enabled = TURNSTILE_SITE_KEY !== '';

  // reset: token hangus terpakai/gagal → widget baru untuk percobaan berikut.
  const reset = useCallback(() => {
    setToken(null);
    setWidgetKey((k) => k + 1);
  }, []);

  const handleToken = useCallback((t: string | null) => setToken(t), []);

  return { enabled, token, widgetKey, reset, handleToken };
}
