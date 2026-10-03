// src/services/apiClient.ts
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL, DEFAULT_REQUEST_TIMEOUT_MS, getAccessToken, setAccessToken } from '@/config/env';

export interface BackendError {
    success: false;
    code: string;
    message: string;
    errors?: Array<{ field: string; issue: string }>;
    trace_id?: string;
}

export class ApiError extends Error {
    status: number;
    code: string;
    fields: Record<string, string>;

    constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.fields = fields;
    }
}

function toApiError(err: unknown): ApiError {
    if (axios.isAxiosError(err)) {
        const ax = err as AxiosError<BackendError>;
        const status = ax.response?.status ?? 0;
        const data = ax.response?.data;
        if (status === 0) {
            return new ApiError(0, 'NETWORK_ERROR', 'Tidak dapat terhubung ke server. Periksa koneksi Anda.');
        }
        const fields: Record<string, string> = {};
        for (const fe of data?.errors ?? []) {
            fields[fe.field] = fe.issue;
        }
        return new ApiError(status, data?.code ?? 'ERROR', data?.message ?? 'Terjadi kesalahan pada server', fields);
    }
    return new ApiError(0, 'UNKNOWN', err instanceof Error ? err.message : 'Kesalahan tidak dikenal');
}

export const api: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: DEFAULT_REQUEST_TIMEOUT_MS,
    withCredentials: true, 
});

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});


let refreshing: Promise<string | null> | null = null;

function doRefresh(): Promise<string | null> {
    if (!refreshing) {
        refreshing = axios
            .post(`${API_BASE_URL}/api/v1/auth/refresh`, null, { withCredentials: true, timeout: DEFAULT_REQUEST_TIMEOUT_MS })
            .then((res) => {
                const token = res.data?.data?.access_token as string | undefined;
                setAccessToken(token ?? null);
                return token ?? null;
            })
            .catch(() => {
                setAccessToken(null);
                // A3: refresh gagal = sesi mati. Beri tahu AuthContext agar
                // keluar otomatis (hindari sesi "zombie").
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('auth:expired'));
                }
                return null;
            })
            .finally(() => {
                refreshing = null;
            });
    }
    return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (err: unknown) => {
    if (!axios.isAxiosError(err)) throw toApiError(err);
    const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    // Auto-refresh pada 401, KECUALI endpoint auth yang memang menangani
    // kredensial sendiri (login/refresh/reset). /auth/me & /auth/password
    // HARUS boleh memicu refresh (dipakai memulihkan sesi in-memory saat reload).
    const url = original?.url ?? '';
    const skipRefresh =
      url.includes('/auth/login') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');
    if (err.response?.status === 401 && original && !original._retry && !skipRefresh) {
      original._retry = true;
      const token = await doRefresh();
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      }
    }
    throw toApiError(err);
  },
);

export async function apiFetch<T>(path: string, options: AxiosRequestConfig = {}): Promise<T> {
  try {
    const res = await api.request<{ success: boolean; data: T }>({
      url: path,
      method: options.method ?? 'GET',
      ...options,
    });
    return res.data.data as T;
  } catch (err) {
    throw toApiError(err);
  }
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  // Varían keyset (B8): cursor halaman berikutnya (kosong = habis).
  next_cursor?: string;
  with_total?: boolean;
}

export interface Paginated<T> {
  data: T;
  meta: PaginationMeta;
}

// apiFetchPaginated memakai endpoint ber-meta (response.Paginated backend).
export async function apiFetchPaginated<T>(path: string, options: AxiosRequestConfig = {}): Promise<Paginated<T>> {
  try {
    const res = await api.request<{ success: boolean; data: T; meta: PaginationMeta }>({
      url: path,
      method: options.method ?? 'GET',
      ...options,
    });
    return { data: res.data.data as T, meta: res.data.meta };
  } catch (err) {
    throw toApiError(err);
  }
}