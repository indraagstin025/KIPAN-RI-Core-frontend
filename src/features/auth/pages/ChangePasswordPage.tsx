import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Field } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import { Card, ErrorBox, PageHeader } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/apiClient';
import { changePassword } from '../api/authService';
import { unmetStrengthRules } from '../lib/validasiPassword';
import { isAdminRole } from '../types';

const inputCls = 'w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20';

export default function ChangePasswordPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ oldPassword?: string; newPassword?: string; confirm?: string }>({});
  const [sukses, setSukses] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    // Validasi lokal dulu agar tak membakar request sia-sia.
    const invalid: { oldPassword?: string; newPassword?: string; confirm?: string } = {};
    if (!oldPassword) invalid.oldPassword = 'Kata sandi saat ini wajib diisi.';
    if (!newPassword) {
      invalid.newPassword = 'Kata sandi baru wajib diisi.';
    } else {
      const unmet = unmetStrengthRules(newPassword);
      if (unmet.length > 0) {
        invalid.newPassword = `Belum memenuhi syarat: ${unmet.map((r) => r.label).join(', ')}.`;
      }
    }
    if (!confirm) {
      invalid.confirm = 'Konfirmasi wajib diisi.';
    } else if (newPassword && newPassword !== confirm) {
      invalid.confirm = 'Konfirmasi kata sandi tidak cocok.';
    }
    setFieldErrors(invalid);
    if (invalid.oldPassword ?? invalid.newPassword ?? invalid.confirm) {
      setError(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSukses(true);
      setTimeout(() => {
        void logout().then(() => navigate(isAdminRole(user?.role) ? '/' : '/login', { replace: true }));
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengubah kata sandi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Ganti Kata Sandi" desc="Setelah berhasil, seluruh sesi lain dihentikan dan Anda perlu login ulang." />
      {sukses ? (
        <Card><Alert kind="success">Kata sandi berhasil diperbarui. Mengalihkan ke halaman login...</Alert></Card>
      ) : (
        <Card>
          <form onSubmit={(e) => void submit(e)} className="grid gap-5">
            {error && <ErrorBox message={error} />}
            <Field label="Kata Sandi Saat Ini" required error={fieldErrors.oldPassword}>
              <input type="password" value={oldPassword} onChange={(e) => { setOldPassword(e.target.value); setFieldErrors((p) => ({ ...p, oldPassword: undefined })); }} autoComplete="current-password" aria-invalid={fieldErrors.oldPassword !== undefined || undefined} className={inputCls} />
            </Field>
            <Field label="Kata Sandi Baru" required hint="Min 8 karakter, huruf besar/kecil, angka, dan simbol." error={fieldErrors.newPassword}>
              <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setFieldErrors((p) => ({ ...p, newPassword: undefined })); }} autoComplete="new-password" aria-invalid={fieldErrors.newPassword !== undefined || undefined} className={inputCls} />
            </Field>
            <Field label="Konfirmasi Kata Sandi Baru" required error={fieldErrors.confirm}>
              <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })); }} autoComplete="new-password" aria-invalid={fieldErrors.confirm !== undefined || undefined} className={inputCls} />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-kipan-blue px-6 py-3 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
            >
              {loading ? (<><Spinner size={15} light /> Menyimpan...</>) : 'Simpan Kata Sandi'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
