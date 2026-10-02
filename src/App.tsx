import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import RequireAuth from './components/guards/RequireAuth';
import RequireRole from './components/guards/RequireRole';
import ScrollToTop from './components/util/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { ADMIN_ROLES } from './features/auth/types';
import ChangePasswordPage from './features/auth/pages/ChangePasswordPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import LoginPage from './features/auth/pages/LoginPage';
import AdminLoginShortcut from './features/auth/components/AdminLoginShortcut';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import AnggotaDetailPage from './features/anggota/pages/AnggotaDetailPage';
import AnggotaListPage from './features/anggota/pages/AnggotaListPage';
import CekAnggotaPage from './features/anggota/pages/CekAnggotaPage';
import KtaSayaPage from './features/kta/pages/KtaSayaPage';
import VerifikasiKtaPage from './features/kta/pages/VerifikasiKtaPage';
import DaftarPage from './features/pendaftaran/pages/DaftarPage';
import LacakPage from './features/tracking/pages/LacakPage';
import RevisiPage from './features/tracking/pages/RevisiPage';
import AntreanPage from './features/verification/pages/AntreanPage';
import DashboardPage from './features/verification/pages/DashboardPage';
import DetailPage from './features/verification/pages/DetailPage';
import LandingPage from './pages/public/LandingPage';

function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth loginPath="/">
      <RequireRole roles={ADMIN_ROLES}>
        <AppLayout>{children}</AppLayout>
      </RequireRole>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AdminLoginShortcut />
        <Routes>
          {/* Publik */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/daftar" element={<DaftarPage />} />
          <Route path="/lacak" element={<LacakPage />} />
          <Route path="/revisi" element={<RevisiPage />} />
          <Route path="/verifikasi-kta" element={<VerifikasiKtaPage />} />
          <Route path="/anggota" element={<CekAnggotaPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lupa-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminOnly><DashboardPage /></AdminOnly>} />
          <Route path="/admin/pendaftaran" element={<AdminOnly><AntreanPage /></AdminOnly>} />
          <Route path="/admin/pendaftaran/:id" element={<AdminOnly><DetailPage /></AdminOnly>} />
          <Route path="/admin/anggota" element={<AdminOnly><AnggotaListPage /></AdminOnly>} />
          <Route path="/admin/anggota/:id" element={<AdminOnly><AnggotaDetailPage /></AdminOnly>} />

          {/* Akun (semua role terotentikasi) */}
          <Route
            path="/akun/password"
            element={<RequireAuth><AppLayout><ChangePasswordPage /></AppLayout></RequireAuth>}
          />
          <Route
            path="/akun/kta"
            element={<RequireAuth><AppLayout><KtaSayaPage /></AppLayout></RequireAuth>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
