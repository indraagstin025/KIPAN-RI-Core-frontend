import AppLayout from './components/Layout/AppLayout';
import RequireAuth from './components/guards/RequireAuth';
import RequireRole from './components/guards/RequireRole';
import { ADMIN_ROLES, type Role } from './features/auth/types';
import AnggotaDetailPage from './features/anggota/pages/AnggotaDetailPage';
import AnggotaListPage from './features/anggota/pages/AnggotaListPage';
import TemplatePage from './features/kta/pages/TemplatePage';
import JabatanPage from './features/kepengurusan/pages/JabatanPage';
import PengurusListPage from './features/kepengurusan/pages/PengurusListPage';
import PengurusDetailPage from './features/kepengurusan/pages/PengurusDetailPage';
import SkDetailPage from './features/kepengurusan/pages/SkDetailPage';
import SkListPage from './features/kepengurusan/pages/SkListPage';
import AntreanPage from './features/verification/pages/AntreanPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import LaporanPage from './features/laporan/pages/LaporanPage';
import AuditPage from './features/audit/pages/AuditPage';
import LogKeputusanPage from './features/audit/pages/LogKeputusanPage';
import RolePage from './features/roles/pages/RolePage';
import OrganisasiPage from './features/organisasi/pages/OrganisasiPage';
import BackupPage from './features/backup/pages/BackupPage';
import DetailPage from './features/verification/pages/DetailPage';
import WilayahPage from './features/wilayah/pages/WilayahPage';
import UserManagementPage from './features/users/pages/UserManagementPage';
import OutboxListPage from './features/outbox/pages/OutboxListPage';
import DsarQueuePage from './features/dsar/pages/DsarQueuePage';

// Matriks rute admin (satu tempat, sejajar Matriks Hak Akses).
// roles kosong = seluruh ADMIN_ROLES (tanpa pembatasan tambahan).
interface AdminRoute {
  path: string;
  roles?: Role[];
  element: React.ReactNode;
}

const SUPER_NASIONAL: Role[] = ['SUPER_ADMIN', 'ADMIN_NASIONAL'];
const SUPER_SAJA: Role[] = ['SUPER_ADMIN'];

const ADMIN_ROUTES: AdminRoute[] = [
  { path: '/admin', element: <DashboardPage /> },
  { path: '/admin/laporan', element: <LaporanPage /> },
  { path: '/admin/audit', roles: SUPER_NASIONAL, element: <AuditPage /> },
  { path: '/admin/keputusan', roles: SUPER_NASIONAL, element: <LogKeputusanPage /> },
  { path: '/admin/roles', roles: SUPER_SAJA, element: <RolePage /> },
  { path: '/admin/organisasi', roles: SUPER_SAJA, element: <OrganisasiPage /> },
  { path: '/admin/backup', roles: SUPER_SAJA, element: <BackupPage /> },
  { path: '/admin/kta-template', roles: SUPER_NASIONAL, element: <TemplatePage /> },
  { path: '/admin/pendaftaran', element: <AntreanPage /> },
  { path: '/admin/pendaftaran/:id', element: <DetailPage /> },
  { path: '/admin/anggota', element: <AnggotaListPage /> },
  { path: '/admin/anggota/:id', element: <AnggotaDetailPage /> },
  { path: '/admin/sk', element: <SkListPage /> },
  { path: '/admin/sk/:id', element: <SkDetailPage /> },
  { path: '/admin/pengurus', element: <PengurusListPage /> },
  { path: '/admin/pengurus/:id', element: <PengurusDetailPage /> },
  { path: '/admin/jabatan', element: <JabatanPage /> },
  { path: '/admin/wilayah', roles: SUPER_NASIONAL, element: <WilayahPage /> },
  { path: '/admin/users', roles: SUPER_NASIONAL, element: <UserManagementPage /> },
  { path: '/admin/email-outbox', element: <OutboxListPage /> },
  { path: '/admin/dsar', element: <DsarQueuePage /> },
];

function AdminOnly({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  return (
    <RequireAuth loginPath="/">
      <RequireRole roles={ADMIN_ROLES}>
        <AppLayout>{roles ? <RequireRole roles={roles}>{children}</RequireRole> : children}</AppLayout>
      </RequireRole>
    </RequireAuth>
  );
}

export { ADMIN_ROUTES, AdminOnly };
export type { AdminRoute };
