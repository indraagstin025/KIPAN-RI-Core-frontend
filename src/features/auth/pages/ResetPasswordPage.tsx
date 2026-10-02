import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { Alert, Field } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { resetPassword } from '../api/authService';

const inputCls = 'w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengatur ulang kata sandi');
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
        <h1 className="mt-4 text-center font-serif text-2xl font-bold text-kipan-text-dark">Atur Kata Sandi Baru</h1>

        {done ? (
          <div className="mt-6">
            <Alert kind="success">Kata sandi berhasil diatur ulang. Silakan login dengan kata sandi baru.</Alert>
            <p className="mt-4 text-center">
              <Link to="/login" className="font-semibold text-kipan-blue hover:underline">Ke halaman login →</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-6 grid gap-5">
            {error && <ErrorBox message={error} />}
            <Field label="Token Reset" required hint="Dari tautan email (otomatis terisi bila membuka tautan).">
              <input value={token} onChange={(e) => setToken(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Kata Sandi Baru" required hint="Min 8 karakter: huruf besar/kecil, angka, simbol.">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
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
