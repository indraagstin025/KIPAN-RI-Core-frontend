import { apiFetch } from '@/services/apiClient';
import type { RoleCatalog } from '../types';

// getRoleCatalog: katalog role + matriks wewenang (Super Admin).
export function getRoleCatalog(): Promise<RoleCatalog> {
  return apiFetch<RoleCatalog>('/admin/roles');
}
