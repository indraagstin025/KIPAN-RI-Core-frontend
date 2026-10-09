import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/loading';
import TurnstileWidget from '@/components/ui/TurnstileWidget';
import { Field, TextInput } from '@/components/ui/fields';
import { ErrorBox } from '@/components/ui/stateful';
import { TURNSTILE_SITE_KEY } from '@/config/env';
import { ApiError } from '@/services/apiClient';
import { hasLoginErrors, validateLoginInput, type LoginFieldErrors } from '../lib/validasiLogin';
import { MfaRequiredError, MfaSetupRequiredError, isAdminRole } from '../types';
import { enrollConfirm, enrollSetup, verifyMfa, type MfaSetupResult } from '../api/authService';

export default function AdminLoginShortcut() {
  const { login, logout, applyLogin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [loading, setLoading] = useState(false);
  // Tahap-2 MFA: challenge dari login tahap-1 + kode 6 digit.
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  // Enroll MFA wajib (AUTH-30): tiket enroll + secret + kode + recovery.
  const [enrollToken, setEnrollToken] = useState<string | null>(null);
  const [enrollPending, setEnrollPending] = useState<MfaSetupResult | null>(null);
  const [enrollQr, setEnrollQr] = useState<string | null>(null);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollRecovery, setEnrollRecovery] = useState<string[] | null>(null);
  // Gerbang bot lapis 3: widget muncul setelah 422 "verifikasi keamanan".
  const [perluCaptcha, setPerluCaptcha] = useState(false);
  const [tsToken, setTsToken] = useState<string | null>(null);
  const [tsKey, setTsKey] = useState(0);
  const butuhCaptcha = TURNSTILE_SITE_KEY !== '';

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
      const k = typeof e.key === 'string' ? e.key.toLowerCase() : '';
      if (!k) return;
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
      const k = typeof e.key === 'string' ? e.key.toLowerCase() : '';
      if (k) pressed.delete(k);
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
    setFieldErrors({});
    setEmail('');
    setPassword('');
    setChallenge(null);
    setCode('');
    setEnrollToken(null);
    setEnrollPending(null);
    setEnrollQr(null);
    setEnrollCode('');
    setEnrollRecovery(null);
    setPerluCaptcha(false);
    setTsToken(null);
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const invalid = validateLoginInput(email, password);
    setFieldErrors(invalid);
    if (hasLoginErrors(invalid)) {
      setError(null);
      return;
    }
    if (perluCaptcha && butuhCaptcha && tsToken === null) {
      setError('Selesaikan verifikasi keamanan di bawah dulu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password, tsToken ?? undefined);
      if (!isAdminRole(user.role)) {
        // Anti-enumeration: jangan bocorkan jenis akun. Pesan generik saja.
        await logout();
        setError('Email dan password salah.');
        return;
      }
      close();
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422 && /verifikasi keamanan/i.test(err.message)) {
        setPerluCaptcha(true);
        setTsToken(null);
        setTsKey((k) => k + 1);
        setError(err.message);
      } else if (err instanceof MfaRequiredError) {
        // Password benar, MFA aktif → lanjut ke input kode (tanpa bocor detail).
        setChallenge(err.challenge.challenge_token);
        setError(null);
      } else if (err instanceof MfaSetupRequiredError) {
        // Akun wajib-MFA belum enroll → ambil secret enroll.
        setEnrollToken(err.enrollToken);
        setError(null);
        try {
          const setup = await enrollSetup(err.enrollToken);
          setEnrollPending(setup);
          QRCode.toDataURL(setup.otpauth_url, { width: 180, margin: 1 })
            .then((url) => setEnrollQr(url))
            .catch(() => setEnrollQr(null));
        } catch (e2: unknown) {
          setError(e2 instanceof Error ? e2.message : 'Gagal memulai pendaftaran MFA');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Login gagal');
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitEnrollCode(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!enrollPending || !/^\d{6}$/.test(enrollCode.trim())) {
      setError('Masukkan 6 digit kode dari aplikasi authenticator.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await enrollConfirm(enrollPending.setup_token, enrollCode.trim());
      setEnrollRecovery(res.recovery_codes);
      setEnrollPending(null);
      setEnrollQr(null);
      setEnrollCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengaktifkan MFA');
    } finally {
      setLoading(false);
    }
  }

  function kembaliLogin(): void {
    setEnrollToken(null);
    setEnrollPending(null);
    setEnrollQr(null);
    setEnrollCode('');
    setEnrollRecovery(null);
    setError(null);
  }

  async function submitCode(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const normalized = code.replace(/[\s-]/g, '').toUpperCase();
    const isTotp = /^\d{6}$/.test(code.trim());
    const isRecovery = /^[A-HJ-NP-Z2-9]{10}$/.test(normalized);
    if (!challenge || (!isTotp && !isRecovery)) {
      setError('Masukkan 6 digit kode authenticator atau kode darurat (XXXXX-XXXXX).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // verifyMfa menerbitkan sesi penuh; terapkan ke AuthContext agar
      // guard rute langsung mengenali user (tanpa reload).
      const res = await verifyMfa(challenge, isTotp ? code.trim() : normalized);
      applyLogin(res);
      if (!isAdminRole(res.user.role)) {
        await logout();
        setError('Email dan password salah.');
        return;
      }
      close();
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verifikasi gagal');
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

          <form onSubmit={(e) => void (enrollToken ? submitEnrollCode(e) : challenge ? submitCode(e) : submit(e))} className="mt-4 grid gap-4">
            {error && <ErrorBox message={error} />}
          {enrollRecovery ? (
            <>
              <p className="rounded-lg border border-kipan-red/30 bg-red-50 p-3 text-xs text-kipan-text-dark">
                <b>MFA aktif.</b> Simpan kode darurat ini di tempat aman — hanya tampil sekali.
              </p>
              <ul className="grid grid-cols-2 gap-2 font-mono text-xs font-bold tracking-widest text-kipan-text-dark">
                {enrollRecovery.map((c) => <li key={c} className="rounded bg-kipan-soft-gray px-2 py-1 text-center">{c.slice(0, 5)}-{c.slice(5)}</li>)}
              </ul>
              <button
                type="button"
                onClick={kembaliLogin}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy"
              >
                Sudah saya simpan — lanjut login
              </button>
            </>
          ) : enrollToken ? (
            <>
              <p className="rounded-lg border border-amber-400/50 bg-amber-50 p-3 text-xs text-amber-800">
                Akun ini wajib mengaktifkan verifikasi dua langkah sebelum bisa masuk.
              </p>
              {enrollQr ? (
                <img src={enrollQr} alt="QR setup MFA" className="mx-auto h-44 w-44 rounded bg-white p-2" />
              ) : enrollPending ? (
                <p className="break-all font-mono text-sm font-bold tracking-widest text-kipan-navy">{enrollPending.secret}</p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-kipan-text-muted"><Spinner size={15} /> Menyiapkan…</p>
              )}
              <Field label="Kode 6 digit dari aplikasi" required>
                <TextInput value={enrollCode} onChange={(v) => setEnrollCode(v.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6 digit" invalid={false} />
              </Field>
            </>
          ) : challenge ? (
            <Field label="Kode Authenticator / Darurat" required>
              <TextInput value={code} onChange={(v) => setCode(v.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 11))} inputMode="text" autoComplete="one-time-code" placeholder="6 digit atau XXXXX-XXXXX" invalid={false} />
            </Field>
          ) : (
          <>
          <Field label="Email" required error={fieldErrors.email}>
            <TextInput value={email} onChange={(v) => { setEmail(v); setFieldErrors((p) => ({ ...p, email: undefined })); }} inputMode="email" autoComplete="username" placeholder="nama@kipan.id" invalid={fieldErrors.email !== undefined} />
          </Field>
          <Field label="Kata Sandi" required error={fieldErrors.password}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
              autoComplete="current-password"
              aria-invalid={fieldErrors.password !== undefined || undefined}
              className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
            />
          </Field>
          {perluCaptcha && butuhCaptcha && (
            <TurnstileWidget key={tsKey} onToken={(t) => setTsToken(t)} />
          )}
          </>
          )}
          {!enrollRecovery && (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
          >
            {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memproses...</span>) : enrollToken ? 'Aktifkan MFA' : challenge ? 'Verifikasi' : 'Masuk'}
          </button>
          )}
          {challenge && (
            <button
              type="button"
              onClick={() => { setChallenge(null); setCode(''); setError(null); }}
              className="text-center text-xs font-semibold text-kipan-text-muted hover:underline"
            >
              ← Kembali ke email & kata sandi
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
