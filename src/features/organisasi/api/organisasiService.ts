import { apiFetch } from '@/services/apiClient';
import type { OrganisasiProfile, OrganisasiUpdateInput } from '../types';

// getOrganisasi: profil organisasi (publik).
export function getOrganisasi(): Promise<OrganisasiProfile> {
  return apiFetch<OrganisasiProfile>('/organisasi');
}

// adminUpdateOrganisasi: simpan profil organisasi (Super Admin).
export function adminUpdateOrganisasi(input: OrganisasiUpdateInput): Promise<OrganisasiProfile> {
  return apiFetch<OrganisasiProfile>('/admin/organisasi', { method: 'PUT', data: input });
}
