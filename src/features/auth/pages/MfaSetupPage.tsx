import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, ErrorBox, PageHeader } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { Field, TextInput } from '@/components/ui/fields';
import { useAuth } from '@/context/AuthContext';
import { confirmMfa, setupMfa, type MfaSetupResult } from '../api/authService';

// Keamanan MFA: pendaftaran TOTP untuk Super Admin & Admin Nasional.
// Secret hanya tampil SEKALI — jangan screenshot/upload ke mana pun.
export default function MfaSetupPage() {
  const { user, refreshUser } = useAuth();
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<MfaSetupResult | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!pending) {
      setQrUrl(null);
      return;
    }
    QRCode.toDataURL(pending.otpauth_url, { width: 220, margin: 1 })
      .then((url) => { if (alive) setQrUrl(url); })
      .catch(() => { if (alive) setQrUrl(null); });
    return () => { alive = false; };
  }, [pending]);

  async function mulai(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!password) {
      setError('Masukkan kata sandi untuk konfirmasi.');
      return;
    }
    setLoading(true);
    setError(null);
    setDone(null);
    try {
      setPending(await setupMfa(password));
      setPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memulai setup MFA');
    } finally {
      setLoading(false);
    }
  }

  async function konfirmasi(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!pending || !/^\d{6}$/.test(code.trim())) {
      setError('Masukkan 6 digit kode dari aplikasi authenticator.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await confirmMfa(pending.setup_token, code.trim());
      setPending(null);
      setQrUrl(null);
      setCode('');
      setRecovery(res.recovery_codes);
      setDone('MFA aktif. Simpan kode darurat di bawah di tempat aman — hanya tampil sekali ini.');
      await refreshUser();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengaktifkan MFA');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Keamanan MFA" desc="Verifikasi dua langkah (TOTP) untuk akun Super Admin & Admin Nasional." />
      <Card>
        {user?.mfa_enabled ? (
          <p className="rounded-lg border border-kipan-green/40 bg-emerald-50 p-3 text-sm font-semibold text-kipan-green">
            ✓ MFA aktif di akun ini.
          </p>
        ) : (
          <p className="rounded-lg border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-800">
            MFA belum aktif. Aktifkan sebelum masuk produksi.
          </p>
        )}

        {done && <p className="mt-4 rounded-lg border border-kipan-green/40 bg-emerald-50 p-3 text-sm font-medium text-kipan-green">{done}</p>}
        {recovery && (
          <div className="mt-4 rounded-lg border border-kipan-red/30 bg-red-50 p-4">
            <p className="text-sm font-bold text-kipan-red">Kode darurat (simpan sekarang!)</p>
            <p className="mt-1 text-xs text-kipan-text-muted">Tiap kode hanya bisa dipakai sekali, untuk keadaan HP hilang. Tidak akan ditampilkan lagi.</p>
            <ul className="mt-2 grid grid-cols-2 gap-2 font-mono text-sm font-bold tracking-widest text-kipan-text-dark">
              {recovery.map((c) => <li key={c} className="rounded bg-white px-2 py-1 text-center">{c.slice(0, 5)}-{c.slice(5)}</li>)}
            </ul>
            <button
              type="button"
              onClick={() => setRecovery(null)}
              className="mt-3 text-xs font-semibold text-kipan-blue hover:underline"
            >
              Sudah saya simpan — sembunyikan
            </button>
          </div>
        )}
        {error && <div className="mt-4"><ErrorBox message={error} /></div>}

        {!pending ? (
          <form onSubmit={(e) => void mulai(e)} className="mt-4 grid gap-4">
            <Field label="Konfirmasi Kata Sandi" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
              />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
            >
              {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memproses...</span>) : 'Mulai Setup MFA'}
            </button>
          </form>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="rounded-lg bg-kipan-soft-gray p-4 text-sm">
              <p className="font-semibold text-kipan-text-dark">1. Pindai dengan aplikasi authenticator:</p>
              {qrUrl ? (
                <img src={qrUrl} alt="QR setup MFA" className="mt-2 h-44 w-44 rounded bg-white p-2" />
              ) : (
                <p className="mt-2 text-xs text-kipan-text-muted">Menyiapkan QR…</p>
              )}
              <p className="mt-3 font-semibold text-kipan-text-dark">atau masukkan kunci manual:</p>
              <p className="mt-2 break-all font-mono text-base font-bold tracking-widest text-kipan-navy">{pending.secret}</p>
            </div>
            <form onSubmit={(e) => void konfirmasi(e)} className="grid gap-4">
              <Field label="2. Kode 6 digit dari aplikasi" required>
                <TextInput value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6 digit" invalid={false} />
              </Field>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
                >
                  {loading ? 'Memproses...' : 'Aktifkan MFA'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPending(null); setCode(''); }}
                  className="rounded-lg border border-kipan-border px-6 py-3 text-sm font-semibold text-kipan-text-dark"
                >
                  Batal
                </button>
              </div>
            </form>
            <p className="text-xs text-kipan-text-muted">Token setup kedaluwarsa dalam {Math.round(pending.expires_in / 60)} menit dan sekali pakai.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
