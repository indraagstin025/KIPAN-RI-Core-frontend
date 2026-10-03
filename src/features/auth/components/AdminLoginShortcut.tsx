import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/loading';
import { Field, TextInput } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import { isAdminRole } from '../types';

export default function AdminLoginShortcut() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pressed = new Set<string>();
    let triggered = false;

    const isEditableTarget = (t: EventTarget | null): boolean => {
      if (!(t instanceof HTMLElement)) return false;
      if (t.isContentEditable) return true;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const onDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      // Abaikan saat mengetik di form agar Ctrl+A (select-all) tetap normal.
      if (isEditableTarget(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'i') {
        pressed.add(k);
        e.preventDefault();
      }
      if (pressed.has('a') && pressed.has('i') && !triggered) {
        triggered = true;
        setOpen(true);
      }
    };

    const onUp = (e: KeyboardEvent) => {
      pressed.delete(e.key.toLowerCase());
      if (!e.ctrlKey) {
        pressed.clear();
        triggered = false;
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  function close(): void {
    setOpen(false);
    setError(null);
    setEmail('');
    setPassword('');
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      if (!isAdminRole(user.role)) {
        await logout();
        setError('Akun ini bukan akun admin.');
        return;
      }
      close();
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Masuk Admin">
      <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-kipan-text-dark">Masuk Admin</h2>
            <p className="mt-0.5 text-xs text-kipan-text-muted">Akses khusus petugas KIPAN.</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="rounded-md p-1 text-kipan-text-muted hover:bg-kipan-soft-gray"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-4">
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
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
          >
            {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memproses...</span>) : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
