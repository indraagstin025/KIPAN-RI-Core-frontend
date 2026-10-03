export interface DashboardSummary {
  total_anggota: number;
  anggota_aktif: number;
  anggota_baru_bulan_ini: number;
  menunggu_verifikasi: number;
  total_pengurus: number;
  total_provinsi: number;
  total_kabupaten: number;
}

export interface DashboardStatusCount {
  status: string;
  jumlah: number;
}

export interface DashboardWilayahCount {
  nama: string;
  jumlah: number;
}

export interface DashboardTrendPoint {
  bulan: string;
  jumlah: number;
}

export interface DashboardRecentItem {
  id: number;
  nama: string;
  status: string;
  kabupaten?: string;
  created_at: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  pendaftaran_by_status: DashboardStatusCount[];
  wilayah_distribusi: DashboardWilayahCount[];
  wilayah_label: string;
  trend: DashboardTrendPoint[];
  recent: DashboardRecentItem[];
}
