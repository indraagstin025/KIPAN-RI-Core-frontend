import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { Field, TextInput } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import type { AuthUser } from '../types';

interface LoginFormProps {
  title: string;
  subtitle: string;
  submitLabel?: string;
  onSubmit: (email: string, password: string) => Promise<AuthUser>;
  onSuccess: (user: AuthUser) => void;
  footer?: React.ReactNode;
}

export default function LoginForm({ title, subtitle, submitLabel = 'Masuk', onSubmit, onSuccess, footer }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await onSubmit(email.trim(), password);
      onSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal');
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
        <h1 className="mt-4 text-center font-serif text-2xl font-bold text-kipan-text-dark">{title}</h1>
        <p className="mt-1 text-center text-sm text-kipan-text-muted">{subtitle}</p>

        <form onSubmit={(e) => void submit(e)} className="mt-6 grid gap-5">
          {error && <ErrorBox message={error} />}
          <Field label="Email" required>
            <TextInput value={email} onChange={setEmail} inputMode="email" placeholder="nama@kipan.id" />
          </Field>
          <Field label="Kata Sandi" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
            />
          </Field>
          <p className="-mt-2 text-right text-xs">
            <Link to="/lupa-password" className="font-semibold text-kipan-blue hover:underline">Lupa kata sandi?</Link>
          </p>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memproses...</span>) : submitLabel}
          </Button>
        </form>

        {footer}
      </div>
    </div>
  );
}
