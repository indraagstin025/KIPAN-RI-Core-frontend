import type { Role } from '@/features/auth/types';

// Wewenang kepengurusan selaras IMPLEMENTASI_PENGANGKATAN.md + IMPLEMENTASI_SK_MULTILEVEL.md.
export function canCreateSK(role?: Role | null): boolean {
  return role === 'ADMIN_KABUPATEN' || role === 'ADMIN_PROVINSI' || role === 'ADMIN_NASIONAL' || role === 'SUPER_ADMIN';
}

export function canForwardSK(role?: Role | null): boolean {
  return role === 'ADMIN_PROVINSI';
}

// Wewenang mengajukan SK (DRAFT -> tahap berikut) mengikuti LEVEL SK.
export function canAjukanSK(role?: Role | null, level?: string | null): boolean {
  if (role === 'SUPER_ADMIN') return true;
  switch (level) {
    case 'KABUPATEN':
      return role === 'ADMIN_KABUPATEN';
    case 'PROVINSI':
      return role === 'ADMIN_PROVINSI';
    case 'NASIONAL':
      return role === 'ADMIN_NASIONAL';
    default:
      return false;
  }
}

export function canFinalizeSK(role?: Role | null): boolean {
  return role === 'ADMIN_NASIONAL' || role === 'SUPER_ADMIN';
}

// TDD D14: semua admin boleh menambah jabatan (kab/prov butuh jabatan sendiri).
export function canCreateJabatan(role?: Role | null): boolean {
  return role === 'ADMIN_NASIONAL' || role === 'ADMIN_PROVINSI' || role === 'ADMIN_KABUPATEN' || role === 'SUPER_ADMIN';
}

// Ubah/nonaktifkan jabatan: Super/Nasional.
export function canManageJabatan(role?: Role | null): boolean {
  return role === 'ADMIN_NASIONAL' || role === 'SUPER_ADMIN';
}

// B1/B3: pengelola pengurus mengikuti LEVEL SK (Opsi A).
// KABUPATEN -> Admin Kabupaten sekab ATAU Admin Provinsi seprov;
// PROVINSI -> Admin Provinsi; NASIONAL -> Nasional; Super oversight semua.
export function canManagePengurusForLevel(role?: Role | null, level?: string | null): boolean {
  if (role === 'SUPER_ADMIN') return true;
  switch (level) {
    case 'KABUPATEN':
      return role === 'ADMIN_KABUPATEN' || role === 'ADMIN_PROVINSI';
    case 'PROVINSI':
      return role === 'ADMIN_PROVINSI';
    case 'NASIONAL':
      return role === 'ADMIN_NASIONAL';
    default:
      return false;
  }
}

// canPromotePengurus: apakah role boleh membuka wizard pengangkatan (scoping
// per-SK ditegakkan di wizard & backend).
export function canPromotePengurus(role?: Role | null): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN_NASIONAL' || role === 'ADMIN_PROVINSI' || role === 'ADMIN_KABUPATEN';
}
