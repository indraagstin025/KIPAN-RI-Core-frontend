import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArchiveIcon,
  BarChartIcon,
  ClipboardIcon,
  DashboardIcon,
  DesktopIcon,
  EnvelopeClosedIcon,
  ExitIcon,
  FileTextIcon,
  GearIcon,
  GlobeIcon,
  GroupIcon,
  HomeIcon,
  IdCardIcon,
  LayersIcon,
  LockClosedIcon,
  MixIcon,
  MobileIcon,
  PersonIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/features/notification/components/NotificationBell';
import { isAdminRole } from '@/features/auth/types';
import { canCreateJabatan } from '@/features/kepengurusan/roles';

type NavIcon = React.ComponentType<{ className?: string }>;

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: NavIcon;
}

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dasbor', end: true, icon: DashboardIcon },
  { to: '/admin/pendaftaran', label: 'Antrean Pendaftaran', icon: ClipboardIcon },
  { to: '/admin/anggota', label: 'Data Anggota', icon: PersonIcon },
  { to: '/admin/sk', label: 'Surat Keputusan', icon: FileTextIcon },
  { to: '/admin/pengurus', label: 'Pengurus', icon: GroupIcon },
  { to: '/admin/laporan', label: 'Laporan', icon: BarChartIcon },
];

const USER_NAV: NavItem[] = [{ to: '/akun/kta', label: 'KTA Saya', icon: IdCardIcon }];

const ACCOUNT_NAV: NavItem[] = [
  { to: '/akun/password', label: 'Ganti Kata Sandi', icon: LockClosedIcon },
  { to: '/akun/sesi', label: 'Sesi Aktif', icon: DesktopIcon },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // Collapse desktop ala Supabase (ikon + tooltip); preferensi persist.
  // Hanya ≥lg (drawer mobile selalu penuh).
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kipan_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Skala admin 90% (setara zoom-out browser sekali): lebih banyak konten
  // muat di layar 2560x1440. Dipasang di <html> (bukan kontainer) agar
  // elemen fixed (modal/dropdown/drawer) ikut ter-scale dengan benar.
  // Efek samping: unit vh ikut mengecil (h-screen = 90%) — maka sidebar
  // memakai inset-y-0 (jangkar viewport, bukan vh) + body disamakan dengan
  // bg konten agar tak ada jahitan putih. Cleanup mengembalikan semula.
  useEffect(() => {
    const el = document.documentElement;
    const prevZoom = el.style.zoom;
    const prevBg = document.body.style.background;
    el.style.zoom = '0.9';
    document.body.style.background = '#ffffff';
    return () => {
      el.style.zoom = prevZoom;
      document.body.style.background = prevBg;
    };
  }, []);

  function toggleCollapsed(): void {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem('kipan_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // abaikan (mode privat)
      }
      return next;
    });
  }

  const admin = isAdminRole(user?.role);
  const jabatanNav: NavItem[] = canCreateJabatan(user?.role) ? [{ to: '/admin/jabatan', label: 'Master Jabatan', icon: LayersIcon }] : [];
  const isNasionalOrSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const wilayahNav: NavItem[] = isNasionalOrSuper ? [{ to: '/admin/wilayah', label: 'Wilayah', icon: GlobeIcon }] : [];
  const usersNav: NavItem[] = isNasionalOrSuper ? [{ to: '/admin/users', label: 'Pengguna', icon: GearIcon }] : [];
  const outboxNav: NavItem[] = admin ? [{ to: '/admin/email-outbox', label: 'Antrian Email', icon: EnvelopeClosedIcon }] : [];
  const auditNav: NavItem[] = isNasionalOrSuper ? [{ to: '/admin/audit', label: 'Jejak Audit', icon: ReaderIcon }] : [];
  const rolesNav: NavItem[] = user?.role === 'SUPER_ADMIN' ? [{ to: '/admin/roles', label: 'Role & Wewenang', icon: MixIcon }] : [];
  const organisasiNav: NavItem[] = user?.role === 'SUPER_ADMIN' ? [{ to: '/admin/organisasi', label: 'Profil Organisasi', icon: HomeIcon }] : [];
  const backupNav: NavItem[] = user?.role === 'SUPER_ADMIN' ? [{ to: '/admin/backup', label: 'Database Backup', icon: ArchiveIcon }] : [];
  const ktaTemplateNav: NavItem[] = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL' ? [{ to: '/admin/kta-template', label: 'Template KTA', icon: IdCardIcon }] : [];
  const mfaNav: NavItem[] = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL' ? [{ to: '/akun/keamanan', label: 'Keamanan MFA', icon: MobileIcon }] : [];
  const nav = admin ? [...ADMIN_NAV, ...wilayahNav, ...jabatanNav, ...usersNav, ...outboxNav, ...auditNav, ...rolesNav, ...organisasiNav, ...backupNav, ...ktaTemplateNav, ...ACCOUNT_NAV, ...mfaNav] : [...USER_NAV, ...ACCOUNT_NAV];
  const bisaMfa = mfaNav.length > 0;
  const menuItemCls = 'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-kipan-text-dark transition hover:bg-kipan-soft-gray';

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
    <div className="flex min-h-screen bg-white">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[300px] transform flex-col overflow-x-hidden bg-kipan-navy p-4 transition-all duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'lg:w-[76px] lg:px-3' : ''}`}>
        <Link to="/" className={`flex items-center gap-2 rounded-lg px-1 py-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <img src="/logo-kipan.jpg" alt="Logo KIPAN" className={`shrink-0 rounded-full border border-white/30 bg-white object-cover ${collapsed ? 'h-10 w-10' : 'h-10 w-10 lg:h-12 lg:w-12'}`} />
          <span className={`flex-col leading-tight ${collapsed ? 'lg:hidden' : 'flex'}`}>
            <span className="whitespace-nowrap text-[13px] font-extrabold tracking-tight text-white">KIPAN <span className="text-kipan-yellow">REPUBLIK INDONESIA</span></span>
            <span className="text-[10px] font-medium tracking-wide text-blue-100/70">SIM-KIPAN</span>
          </span>
        </Link>
        {/* Scrollbar disembunyikan (tetap bisa scroll): [scrollbar-width:none] + webkit. */}
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Navigasi akun">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              title={collapsed ? item.label : undefined}
              className={({ isActive }: { isActive: boolean }) => `${linkCls({ isActive })}${collapsed ? ' lg:justify-center lg:px-2' : ''} flex items-center gap-3`}
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && <button type="button" aria-label="Tutup menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Kolom konten di-offset selebar sidebar (sidebar fixed di luar flow):
          sinkron dengan animasi collapse. Mobile tanpa offset (drawer overlay). */}
      <div className={`flex min-w-0 flex-1 flex-col transition-[padding-left] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[300px]'}`}>
        {/* Navbar admin gaya CMS (navy blur, sticky): brand ringkas +
            lonceng + menu profil. Tanpa link landing. */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/15 bg-kipan-navy/95 px-4 py-3 shadow-lg backdrop-blur-md lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-md p-2 text-white/80 hover:bg-white/10 lg:hidden"
              aria-label="Buka menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Bentangkan menu' : 'Ciutkan menu'}
              aria-pressed={collapsed}
              title={collapsed ? 'Bentangkan menu' : 'Ciutkan menu'}
              className="hidden rounded-md p-2 text-white/80 hover:bg-white/10 lg:block"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h10M4 17h16" /></svg>
            </button>
            {/* Brand ringkas khusus mobile (sidebar tersembunyi).
                Varian penuh tak muat di layar kecil. */}
            <Link to="/" className="flex min-w-0 items-center gap-2 rounded-lg px-1 lg:hidden">
              <img src="/logo-kipan.jpg" alt="Logo KIPAN" className="h-9 w-9 shrink-0 rounded-full border border-white/30 bg-white object-cover" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-extrabold tracking-tight text-white">KIPAN <span className="text-kipan-yellow">RI</span></span>
                <span className="text-[10px] font-medium tracking-wide text-blue-100/70">SIM-KIPAN</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Menu profil"
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
              >
                <span className="hidden text-right sm:block">
                  <span className="block max-w-[140px] truncate text-sm font-semibold text-white">{user?.name}</span>
                  <span className="block text-[11px] text-blue-100/70">{user?.role}</span>
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kipan-yellow text-sm font-bold text-kipan-text-dark">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                  <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-kipan-border bg-white py-1 shadow-xl">
                    <div className="border-b border-kipan-border px-4 py-3">
                      <p className="truncate text-sm font-semibold text-kipan-text-dark">{user?.name}</p>
                      <p className="truncate text-xs text-kipan-text-muted">{user?.role}{user?.tipe_user ? ` · ${user.tipe_user}` : ''}</p>
                    </div>
                    <Link to="/akun/password" onClick={() => setUserMenuOpen(false)} role="menuitem" className={menuItemCls}>Ganti Kata Sandi</Link>
                    <Link to="/akun/sesi" onClick={() => setUserMenuOpen(false)} role="menuitem" className={menuItemCls}>Sesi Aktif</Link>
                    {bisaMfa && (
                      <Link to="/akun/keamanan" onClick={() => setUserMenuOpen(false)} role="menuitem" className={menuItemCls}>Keamanan MFA</Link>
                    )}
                    <div className="my-1 border-t border-kipan-border" />
                    <button type="button" role="menuitem" onClick={() => void onLogout()} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-kipan-red transition hover:bg-red-50"><ExitIcon className="h-4 w-4" aria-hidden="true" /> Keluar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 3xl:px-12 3xl:py-10">{children}</main>
      </div>
    </div>
  );
}
