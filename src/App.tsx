import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import RequireAuth from './components/guards/RequireAuth';
import RequireRole from './components/guards/RequireRole';
import ScrollToTop from './components/util/ScrollToTop';
import OfflineBanner from './components/util/OfflineBanner';
import { AuthProvider } from './context/AuthContext';
import { ADMIN_ROUTES, AdminOnly } from './adminRoutes';
import ChangePasswordPage from './features/auth/pages/ChangePasswordPage';
import MfaSetupPage from './features/auth/pages/MfaSetupPage';
import SessionsPage from './features/auth/pages/SessionsPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import LoginPage from './features/auth/pages/LoginPage';
import AdminLoginShortcut from './features/auth/components/AdminLoginShortcut';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import CekAnggotaPage from './features/anggota/pages/CekAnggotaPage';
import KtaSayaPage from './features/kta/pages/KtaSayaPage';
import ValidasiKtaPage from './features/kta/pages/ValidasiKtaPage';
import DaftarPage from './features/pendaftaran/pages/DaftarPage';
import LacakPage from './features/tracking/pages/LacakPage';
import RevisiPage from './features/tracking/pages/RevisiPage';
import OrganisasiPublicPage from './features/organisasi/pages/OrganisasiPublicPage';
import LandingPage from './pages/public/LandingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <OfflineBanner />
        <AdminLoginShortcut />
        <Routes>
          {/* Publik */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/daftar" element={<DaftarPage />} />
          <Route path="/lacak" element={<LacakPage />} />
          <Route path="/revisi" element={<RevisiPage />} />
          <Route path="/verifikasi-kta" element={<ValidasiKtaPage />} />
          {/* Validasi KTA dari QR kartu: /validasi-kta/{nia}?sig=… (QR baru)
              dan /v/{nia}?sig=… (kartu lama) — dua-duanya halaman yang sama. */}
          <Route path="/validasi-kta" element={<ValidasiKtaPage />} />
          <Route path="/validasi-kta/:nia" element={<ValidasiKtaPage />} />
          <Route path="/v/:nia" element={<ValidasiKtaPage />} />
          <Route path="/anggota" element={<CekAnggotaPage />} />
          <Route path="/profil" element={<OrganisasiPublicPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lupa-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/set-password" element={<ResetPasswordPage mode="set" />} />

          {/* Admin (matriks terpusat di adminRoutes.tsx; .map inline karena
              <Routes> hanya menerima <Route>/fragment sebagai anak langsung) */}
          {ADMIN_ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={<AdminOnly roles={r.roles}>{r.element}</AdminOnly>} />
          ))}

          {/* Akun (semua role terotentikasi) */}
          <Route
            path="/akun/password"
            element={<RequireAuth><AppLayout><ChangePasswordPage /></AppLayout></RequireAuth>}
          />
          <Route
            path="/akun/keamanan"
            element={<RequireAuth><RequireRole roles={['SUPER_ADMIN', 'ADMIN_NASIONAL']}><AppLayout><MfaSetupPage /></AppLayout></RequireRole></RequireAuth>}
          />
          <Route
            path="/akun/sesi"
            element={<RequireAuth><AppLayout><SessionsPage /></AppLayout></RequireAuth>}
          />
          <Route
            path="/akun/kta"
            element={<RequireAuth><RequireRole roles={['USER']}><AppLayout><KtaSayaPage /></AppLayout></RequireRole></RequireAuth>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
