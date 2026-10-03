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
import JabatanPage from './features/kepengurusan/pages/JabatanPage';
import PengurusListPage from './features/kepengurusan/pages/PengurusListPage';
import SkDetailPage from './features/kepengurusan/pages/SkDetailPage';
import SkListPage from './features/kepengurusan/pages/SkListPage';
import DaftarPage from './features/pendaftaran/pages/DaftarPage';
import LacakPage from './features/tracking/pages/LacakPage';
import RevisiPage from './features/tracking/pages/RevisiPage';
import AntreanPage from './features/verification/pages/AntreanPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import LaporanPage from './features/laporan/pages/LaporanPage';
import AuditPage from './features/audit/pages/AuditPage';
import RolePage from './features/roles/pages/RolePage';
import OrganisasiPage from './features/organisasi/pages/OrganisasiPage';
import OrganisasiPublicPage from './features/organisasi/pages/OrganisasiPublicPage';
import DetailPage from './features/verification/pages/DetailPage';
import WilayahPage from './features/wilayah/pages/WilayahPage';
import UserManagementPage from './features/users/pages/UserManagementPage';
import OutboxListPage from './features/outbox/pages/OutboxListPage';
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
          <Route path="/profil" element={<OrganisasiPublicPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lupa-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/set-password" element={<ResetPasswordPage mode="set" />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminOnly><DashboardPage /></AdminOnly>} />
          <Route path="/admin/laporan" element={<AdminOnly><LaporanPage /></AdminOnly>} />
          <Route path="/admin/audit" element={<AdminOnly><RequireRole roles={['SUPER_ADMIN', 'ADMIN_NASIONAL']}><AuditPage /></RequireRole></AdminOnly>} />
          <Route path="/admin/roles" element={<AdminOnly><RequireRole roles={['SUPER_ADMIN']}><RolePage /></RequireRole></AdminOnly>} />
          <Route path="/admin/organisasi" element={<AdminOnly><RequireRole roles={['SUPER_ADMIN']}><OrganisasiPage /></RequireRole></AdminOnly>} />
          <Route path="/admin/pendaftaran" element={<AdminOnly><AntreanPage /></AdminOnly>} />
          <Route path="/admin/pendaftaran/:id" element={<AdminOnly><DetailPage /></AdminOnly>} />
          <Route path="/admin/anggota" element={<AdminOnly><AnggotaListPage /></AdminOnly>} />
          <Route path="/admin/anggota/:id" element={<AdminOnly><AnggotaDetailPage /></AdminOnly>} />
          <Route path="/admin/sk" element={<AdminOnly><SkListPage /></AdminOnly>} />
          <Route path="/admin/sk/:id" element={<AdminOnly><SkDetailPage /></AdminOnly>} />
          <Route path="/admin/pengurus" element={<AdminOnly><PengurusListPage /></AdminOnly>} />
          <Route
            path="/admin/jabatan"
            element={<AdminOnly><JabatanPage /></AdminOnly>}
          />
          <Route
            path="/admin/wilayah"
            element={<AdminOnly><RequireRole roles={['SUPER_ADMIN', 'ADMIN_NASIONAL']}><WilayahPage /></RequireRole></AdminOnly>}
          />
          <Route
            path="/admin/users"
            element={<AdminOnly><RequireRole roles={['SUPER_ADMIN', 'ADMIN_NASIONAL']}><UserManagementPage /></RequireRole></AdminOnly>}
          />
          <Route path="/admin/email-outbox" element={<AdminOnly><OutboxListPage /></AdminOnly>} />

          {/* Akun (semua role terotentikasi) */}
          <Route
            path="/akun/password"
            element={<RequireAuth><AppLayout><ChangePasswordPage /></AppLayout></RequireAuth>}
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
