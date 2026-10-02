import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Field } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import { Card, ErrorBox, PageHeader } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/apiClient';
import { changePassword } from '../api/authService';
import { isAdminRole } from '../types';

const inputCls = 'w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20';

export default function ChangePasswordPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
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
            <Field label="Kata Sandi Saat Ini" required>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Kata Sandi Baru" required hint="Min 8 karakter, huruf besar/kecil, angka, dan simbol.">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Konfirmasi Kata Sandi Baru" required>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
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
