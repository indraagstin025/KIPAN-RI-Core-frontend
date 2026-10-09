import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '../components/LoginForm';
import { LOGIN_GAGAL_GENERIK, mapMemberLoginError } from '../lib/memberLoginError';
import { isAdminRole } from '../types';

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(email: string, password: string, turnstileToken?: string) {
    let user;
    try {
      user = await login(email, password, turnstileToken);
    } catch (err: unknown) {
      // Anti-enumeration: akun MFA di pintu anggota = pesan generik.
      throw mapMemberLoginError(err);
    }
    if (isAdminRole(user.role)) {
      // Anti-enumeration: jangan bocorkan jenis akun. Pesan generik saja.
      await logout();
      throw new Error(LOGIN_GAGAL_GENERIK);
    }
    return user;
  }

  const from = (location.state as { from?: string } | null)?.from;
  const target = from && !from.startsWith('/admin') ? from : '/akun/kta';

  return (
    <LoginForm
      title="Masuk Anggota"
      subtitle="Akun anggota & kader KIPAN"
      onSubmit={handleLogin}
      onSuccess={() => navigate(target, { replace: true })}
      footer={
        <>
          <p className="mt-4 text-center text-xs text-kipan-text-muted">
            Belum punya akun? <Link to="/daftar" className="font-semibold text-kipan-blue hover:underline">Daftar di sini</Link>
          </p>
          <p className="mt-2 text-center text-xs text-kipan-text-muted">
            Petugas KIPAN? Masuk melalui halaman admin.
          </p>
        </>
      }
    />
  );
}
