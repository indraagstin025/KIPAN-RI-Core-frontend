import { apiFetch } from '@/services/apiClient';
import type { DashboardData } from '../types';

// getDashboard: agregat analitik ter-scope actor (role/wilayah dari JWT).
export function getDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>('/admin/dashboard');
}
