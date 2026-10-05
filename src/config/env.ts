export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080';

export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

// Access token disimpan di MEMORI (bukan localStorage) untuk menekan risiko
// pencurian token lewat XSS: token tidak persist antar-reload. Sesi dipulihkan
// dari refresh cookie HttpOnly saat aplikasi dimuat (lihat hasSessionHint).
let accessToken: string | null = null;

// Penanda non-sensitif (tanpa token) agar aplikasi tahu ada kemungkinan sesi
// refresh cookie tanpa harus menembak endpoint sia-sia pada pengunjung anonim.
export const SESSION_HINT_KEY = 'kipan_has_session';

// Identitas sesi non-sensitif (id + role, tanpa token) untuk sinkronisasi
// antar-tab: cookie refresh dipakai bersama, jadi login di satu tab harus
// diikuti tab lain (last login wins).
export const SESSION_USER_KEY = 'kipan_session_user';

export interface SessionIdentity {
  id: string;
  role: string;
}

export function setSessionIdentity(id: string | null, role: string | null): void {
  try {
    if (id && role) {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify({ id, role }));
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }
  } catch {
    // abaikan (mode privat)
  }
}

export function getSessionIdentity(): SessionIdentity | null {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionIdentity>;
    if (typeof parsed.id === 'string' && typeof parsed.role === 'string') {
      return { id: parsed.id, role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  try {
    if (token) {
      localStorage.setItem(SESSION_HINT_KEY, '1');
    } else {
      localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // abaikan (mode privat)
  }
}

// hasSessionHint true bila perangkat ini pernah login dan belum logout.
export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
}
