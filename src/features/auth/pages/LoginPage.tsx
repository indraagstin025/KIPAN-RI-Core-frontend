import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '../components/LoginForm';
import { isAdminRole } from '../types';

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(email: string, password: string) {
    const user = await login(email, password);
    if (isAdminRole(user.role)) {
      // Anti-enumeration: jangan bocorkan jenis akun. Pesan generik saja.
      await logout();
      throw new Error('Email dan password salah.');
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
        <div className="mt-4 space-y-1 text-center text-xs text-kipan-text-muted">
          <p>
            Belum punya akun? <Link to="/daftar" className="font-semibold text-kipan-blue hover:underline">Daftar di sini</Link>
          </p>
          <p>Petugas? Buka halaman utama lalu tekan Ctrl+A+I untuk Masuk Admin.</p>
        </div>
      }
    />
  );
}
