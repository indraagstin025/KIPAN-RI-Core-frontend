import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { Alert, Field, TextInput } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { forgotPassword } from '../api/authService';
import { validateEmailField } from '../lib/validasiPassword';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    // Validasi lokal dulu: jangan bakar kuota rate-limit reset (3+5)
    // untuk email yang pasti-422.
    const invalid = validateEmailField(email);
    setEmailError(invalid);
    if (invalid) {
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim tautan reset');
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
        <h1 className="mt-4 text-center font-serif text-2xl font-bold text-kipan-text-dark">Lupa Kata Sandi</h1>
        <p className="mt-1 text-center text-sm text-kipan-text-muted">
          Masukkan email akun Anda. Kami kirim tautan reset (berlaku 30 menit).
        </p>

        {sent ? (
          <div className="mt-6">
            <Alert kind="success">
              Jika email terdaftar dan aktif, tautan reset telah dikirim. Periksa inbox dan folder spam Anda.
            </Alert>
            <p className="mt-4 text-center text-sm">
              <Link to="/login" className="font-semibold text-kipan-blue hover:underline">← Kembali ke login</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-6 grid gap-5">
            {error && <ErrorBox message={error} />}
            <Field label="Email" required error={emailError}>
              <TextInput value={email} onChange={(v) => { setEmail(v); setEmailError(undefined); }} inputMode="email" autoComplete="email" placeholder="nama@kipan.id" invalid={emailError !== undefined} />
            </Field>
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Mengirim...</span>) : 'Kirim Tautan Reset'}
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="font-semibold text-kipan-blue hover:underline">← Kembali ke login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
