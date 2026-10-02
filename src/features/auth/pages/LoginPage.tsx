import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from;
  const target = from && !from.startsWith('/admin') ? from : '/akun/kta';

  return (
    <LoginForm
      title="Masuk Anggota"
      subtitle="Akun anggota & kader KIPAN"
      onSubmit={login}
      onSuccess={() => navigate(target, { replace: true })}
      footer={
        <p className="mt-4 text-center text-xs text-kipan-text-muted">
          Belum punya akun? <Link to="/daftar" className="font-semibold text-kipan-blue hover:underline">Daftar di sini</Link>
        </p>
      }
    />
  );
}
