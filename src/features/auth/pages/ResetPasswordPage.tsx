import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { Alert, Field } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { resetPassword, setPassword as setAccountPassword } from '../api/authService';

const inputCls = 'w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20';

// Aturan kekuatan cermin backend (password_strength): min 8 (maks 128),
// huruf besar, huruf kecil, angka, dan simbol.
const STRENGTH_RULES: Array<{ key: string; label: string; ok: (v: string) => boolean }> = [
  { key: 'len', label: 'Minimal 8 karakter', ok: (v) => v.length >= 8 && v.length <= 128 },
  { key: 'upper', label: 'Ada huruf besar (A-Z)', ok: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Ada huruf kecil (a-z)', ok: (v) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Ada angka (0-9)', ok: (v) => /[0-9]/.test(v) },
  { key: 'symbol', label: 'Ada simbol (mis. !@#)', ok: (v) => /[^A-Za-z0-9]/.test(v) },
];

export default function ResetPasswordPage({ mode = 'reset' }: { mode?: 'reset' | 'set' }) {
  const isSet = mode === 'set';
  const [params] = useSearchParams();
  // Token dari tautan email dipakai otomatis (disembunyikan). Kolom token hanya
  // tampil bila dibuka tanpa token di URL (input manual).
  const urlToken = (params.get('token') ?? '').trim();
  const showTokenField = urlToken === '';
  const [token, setToken] = useState(urlToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const failedRules = STRENGTH_RULES.filter((r) => !r.ok(password));

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (token.trim() === '') {
      setError('Token wajib diisi. Buka tautan dari email atau tempel tokennya.');
      return;
    }
    if (failedRules.length > 0) {
      setError(`Kata sandi belum memenuhi syarat: ${failedRules.map((r) => r.label).join(', ')}.`);
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setLoading(true);
    try {
      if (isSet) {
        await setAccountPassword(token.trim(), password);
      } else {
        await resetPassword(token.trim(), password);
      }
      setDone(true);
    } catch (err: unknown) {
      // Tampilkan pesan per-field server bila ada (mis. new_password),
      // bukan pesan generik "Validasi gagal".
      if (err instanceof ApiError && err.fields['new_password']) {
        setError(err.fields['new_password']);
      } else {
        setError(err instanceof ApiError ? err.message : 'Gagal mengatur ulang kata sandi');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#061C33] via-kipan-navy to-[#0A3055] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <Link to="/" className="flex items-center justify-center gap-3">
          <img src="/logo-kipan.jpg" alt="Logo KIPAN" className="h-12 w-12 rounded-full border border-kipan-border object-cover" />
        </Link>
        <h1 className="mt-4 text-center font-serif text-2xl font-bold text-kipan-text-dark">{isSet ? 'Buat Kata Sandi Akun' : 'Atur Kata Sandi Baru'}</h1>

        {done ? (
          <div className="mt-6">
            <Alert kind="success">{isSet ? 'Kata sandi berhasil dibuat. Silakan login.' : 'Kata sandi berhasil diatur ulang. Silakan login dengan kata sandi baru.'}</Alert>
            <p className="mt-4 text-center">
              <Link to="/login" className="font-semibold text-kipan-blue hover:underline">Ke halaman login →</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-6 grid gap-5">
            {error && <ErrorBox message={error} />}
            {showTokenField && (
              <Field label={isSet ? 'Token' : 'Token Reset'} required hint="Tempel token dari email bila Anda tidak membuka tautan langsung.">
                <input value={token} onChange={(e) => setToken(e.target.value)} className={inputCls} />
              </Field>
            )}
            <Field label="Kata Sandi Baru" required>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              <ul className="mt-2 space-y-1" aria-live="polite">
                {STRENGTH_RULES.map((r) => {
                  const ok = r.ok(password);
                  return (
                    <li key={r.key} className={`text-xs ${ok ? 'font-semibold text-kipan-green' : 'text-kipan-text-muted'}`}>
                      {ok ? '✓' : '○'} {r.label}
                    </li>
                  );
                })}
              </ul>
            </Field>
            <Field label="Konfirmasi Kata Sandi Baru" required>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
            </Field>
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Menyimpan...</span>) : 'Simpan Kata Sandi Baru'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
