import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SESSION_HINT_KEY, SESSION_USER_KEY, getSessionIdentity, hasSessionHint, setAccessToken, setSessionIdentity } from '@/config/env';
import { refreshAccessToken } from '@/services/apiClient';
import * as authApi from '@/features/auth/api/authService';
import { isAdminRole, type AuthUser, type LoginResult } from '@/features/auth/types';

function roleHome(role: string | undefined): string {
  return role && isAdminRole(role as AuthUser['role']) ? '/admin' : '/akun/kta';
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  // applyLogin menerapkan hasil login tahap-2 MFA ke state (tanpa password).
  applyLogin: (res: LoginResult) => AuthUser;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Mengikuti sesi tab lain: token in-memory milik tab ini, tetapi cookie
  // refresh dipakai bersama — login di tab lain (akun berbeda) harus diikuti
  // tab ini (last login wins), kalau tidak request memakai token basi/asing.
  const followingRef = useRef(false);
  const lastFollowAtRef = useRef(0);

  const refreshUser = useCallback(async () => {
    // Hindari balapan /auth/me ganda saat followSession sedang berjalan.
    if (followingRef.current) return;
    // Token akses ada di memori, jadi tidak ada token saat reload. Bila
    // perangkat ini punya sesi (hint), /auth/me memicu refresh via cookie
    // HttpOnly di interceptor apiClient. Pengunjung anonim dilewati.
    if (!hasSessionHint()) {
      setUser(null);
      return;
    }
    try {
      setUser(await authApi.getMe());
    } catch {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const followSession = useCallback(async () => {
    if (followingRef.current) return;
    // Debounce: storage + forbidden bisa datang beruntun (2 tab).
    const now = Date.now();
    if (now - lastFollowAtRef.current < 1500) return;
    lastFollowAtRef.current = now;
    followingRef.current = true;
    try {
      // Buang token lama (milik akun lain) lalu refresh eksplisit dulu agar
      // /auth/me berikut memakai token baru — hindari 401 noise + balapan
      // Navigate vs location.assign saat 2 tab anonim.
      setAccessToken(null);
      const newToken = await refreshAccessToken().catch(() => null);
      if (!newToken) {
        setUser(null);
        if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/akun')) {
          window.location.assign('/');
        }
        return;
      }
      const me = await authApi.getMe().catch(() => null);
      if (!me) {
        setUser(null);
        if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/akun')) {
          window.location.assign('/');
        }
        return;
      }
      setUser(me);
      setSessionIdentity(me.id, me.role);
      const target = roleHome(me.role);
      if (window.location.pathname !== target) {
        window.location.assign(target);
      }
    } finally {
      followingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const clearLocalSession = () => {
      setAccessToken(null);
      setUser(null);
    };
    // A3: sesi mati (refresh gagal) → keluar otomatis. RequireAuth lalu
    // mengarahkan ke halaman login yang sesuai.
    const onExpired = () => clearLocalSession();
    // B7: logout di tab lain → sinkronkan tab ini.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_HINT_KEY && e.newValue === null) clearLocalSession();
      // Login di tab lain (identitas sesi berubah) → ikuti akun terbaru.
      if (e.key === SESSION_USER_KEY) {
        const ident = getSessionIdentity();
        if (!ident) {
          clearLocalSession();
          return;
        }
        setUser((prev) => {
          if (!prev || prev.id !== ident.id) void followSession();
          return prev;
        });
      }
    };
    // 403 terisolasi: satu kali rekonsiliasi identitas; bila token tab ini
    // ternyata milik akun lain, ikuti akun tersebut. 403 yang sah (otorisasi
    // memang ditolak) tidak mengubah apa pun.
    const onForbidden = () => {
      const ident = getSessionIdentity();
      setUser((prev) => {
        if (prev && ident && prev.id !== ident.id) void followSession();
        return prev;
      });
    };
    window.addEventListener('auth:expired', onExpired);
    window.addEventListener('auth:forbidden', onForbidden);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth:expired', onExpired);
      window.removeEventListener('auth:forbidden', onForbidden);
      window.removeEventListener('storage', onStorage);
    };
  }, [followSession]);

  const applyLogin = useCallback((res: LoginResult) => {
    setAccessToken(res.access_token);
    setUser(res.user);
    setSessionIdentity(res.user.id, res.user.role);
    return res.user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    return applyLogin(res);
  }, [applyLogin]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // idempoten: tetap bersihkan state lokal
    }
    setAccessToken(null);
    setSessionIdentity(null, null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, applyLogin, logout, refreshUser }),
    [user, loading, login, applyLogin, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
