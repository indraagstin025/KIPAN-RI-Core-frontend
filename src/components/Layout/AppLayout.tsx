import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/features/notification/components/NotificationBell';
import { isAdminRole } from '@/features/auth/types';
import { canManageJabatan } from '@/features/kepengurusan/roles';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dasbor', end: true },
  { to: '/admin/pendaftaran', label: 'Antrean Pendaftaran' },
  { to: '/admin/anggota', label: 'Data Anggota' },
  { to: '/admin/sk', label: 'Surat Keputusan' },
  { to: '/admin/pengurus', label: 'Pengurus' },
];

const USER_NAV: NavItem[] = [{ to: '/akun/kta', label: 'KTA Saya' }];

const ACCOUNT_NAV: NavItem[] = [{ to: '/akun/password', label: 'Ganti Kata Sandi' }];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const admin = isAdminRole(user?.role);
  const jabatanNav: NavItem[] = canManageJabatan(user?.role) ? [{ to: '/admin/jabatan', label: 'Master Jabatan' }] : [];
  const isNasionalOrSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const wilayahNav: NavItem[] = isNasionalOrSuper ? [{ to: '/admin/wilayah', label: 'Wilayah' }] : [];
  const usersNav: NavItem[] = user?.role === 'SUPER_ADMIN' ? [{ to: '/admin/users', label: 'Manajemen Pengguna' }] : [];
  const outboxNav: NavItem[] = admin ? [{ to: '/admin/email-outbox', label: 'Antrian Email' }] : [];
  const nav = admin ? [...ADMIN_NAV, ...wilayahNav, ...jabatanNav, ...usersNav, ...outboxNav, ...ACCOUNT_NAV] : [...USER_NAV, ...ACCOUNT_NAV];

  async function onLogout(): Promise<void> {
    const isAdmin = isAdminRole(user?.role);
    await logout();
    navigate(isAdmin ? '/' : '/login', { replace: true });
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-kipan-yellow text-kipan-text-dark' : 'text-blue-100/85 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-kipan-soft-gray">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-kipan-navy p-4 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="flex items-center gap-3 rounded-lg px-2 py-2">
          <img src="/logo-kipan.jpg" alt="Logo KIPAN" className="h-9 w-9 rounded-full border border-white/30 bg-white object-cover" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold text-white">KIPAN RI</span>
            <span className="text-[11px] text-blue-100/70">Sistem Informasi</span>
          </span>
        </Link>
        <nav className="mt-6 space-y-1" aria-label="Navigasi akun">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end ?? false} className={linkCls} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-6 w-full rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-blue-100 hover:bg-white/10"
        >
          Keluar
        </button>
      </aside>

      {open && <button type="button" aria-label="Tutup menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-kipan-border bg-kipan-navy px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Buka menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="min-w-0 flex-1" />
          <NotificationBell />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-[11px] text-blue-100/70">{user?.role}{user?.tipe_user ? ` · ${user.tipe_user}` : ''}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kipan-yellow text-sm font-bold text-kipan-text-dark">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
