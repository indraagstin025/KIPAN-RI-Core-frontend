import { useState } from 'react';
import { Field, TextInput } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { useAuth } from '@/context/AuthContext';

// StepUpModal: verifikasi ulang untuk operasi sensitif (AUTH-20).
// Selalu minta password; kode TOTP wajib bila akun ber-MFA.
// onToken(token) dipanggil SEKALI — token hanya untuk satu operasi.
interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  onToken: (token: string) => Promise<void> | void;
}

export default function StepUpModal({ open, title, onClose, onToken }: Props) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const needCode = !!user?.mfa_enabled;

  if (!open) return null;

  function close(): void {
    setPassword('');
    setCode('');
    setError(null);
    onClose();
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!password) {
      setError('Masukkan kata sandi untuk verifikasi ulang.');
      return;
    }
    if (needCode && !/^\d{6}$/.test(code.trim())) {
      setError('Masukkan 6 digit kode dari aplikasi authenticator.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { requestStepUp } = await import('@/features/auth/api/authService');
      const res = await requestStepUp(password, needCode ? code.trim() : undefined);
      const token = res.token;
      close();
      await onToken(token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verifikasi ulang gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="font-serif text-lg font-bold text-kipan-text-dark">{title}</h2>
        <p className="mt-1 text-xs text-kipan-text-muted">
          Operasi sensitif memerlukan verifikasi ulang. Token sekali pakai 5 menit; untuk Buka NIK, verifikasi berlaku 30 menit per sesi ini.
        </p>
        <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-4">
          {error && <ErrorBox message={error} />}
          <Field label="Kata Sandi" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
            />
          </Field>
          {needCode && (
            <Field label="Kode Authenticator" required>
              <TextInput value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6 digit" invalid={false} />
            </Field>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
            >
              {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memeriksa...</span>) : 'Verifikasi'}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-kipan-border px-5 py-3 text-sm font-semibold text-kipan-text-dark"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
