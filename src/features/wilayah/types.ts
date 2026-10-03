import type { PengurusDetail } from '@/features/kepengurusan/types';

export interface WilayahCards {
  total_provinsi: number;
  total_kabupaten: number;
  total_pengurus: number;
}

export interface WilayahAdminItem {
  id: number;
  kode: string;
  nama: string;
  is_active: boolean;
  provinsi_id?: number;
  provinsi_nama?: string;
  jml_kabupaten: number;
  jml_pengurus: number;
  ketua?: string;
}

export interface TrenBulan {
  bulan: string;
  jumlah: number;
}

export interface WilayahStatistik {
  total_pengurus: number;
  pengurus_aktif: number;
  total_kabupaten: number;
  tren: TrenBulan[];
}

export interface WilayahActivity {
  id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_name: string;
  entity_id: string;
  created_at: string;
}

export interface WilayahDetail {
  type: string;
  id: number;
  kode: string;
  nama: string;
  is_active: boolean;
  provinsi_id?: number;
  provinsi_nama?: string;
  statistik: WilayahStatistik;
  pengurus: PengurusDetail[];
  activity: WilayahActivity[];
}

export type WilayahType = 'provinsi' | 'kabupaten';
