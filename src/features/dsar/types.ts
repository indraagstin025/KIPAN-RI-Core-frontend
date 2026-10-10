export type DsarJenis = 'akses' | 'perbaiki' | 'hapus' | 'tarik' | 'portabilitas' | 'batasi';
export type DsarStatus = 'diajukan' | 'diproses' | 'selesai' | 'ditolak';

export const DSAR_JENIS: Array<{ key: DsarJenis; label: string; desc: string }> = [
  { key: 'akses', label: 'Minta salinan data', desc: 'Terima salinan data pribadi Anda beserta rekam pengolahannya.' },
  { key: 'perbaiki', label: 'Perbaiki data', desc: 'Betulkan data yang salah/tidak akurat (maks 3x24 jam).' },
  { key: 'hapus', label: 'Hapus data', desc: 'Minta penghapusan bila tak lagi diperlukan / persetujuan ditarik.' },
  { key: 'tarik', label: 'Tarik persetujuan', desc: 'Hentikan pemrosesan berbasis persetujuan Anda.' },
  { key: 'portabilitas', label: 'Portabilitas', desc: 'Terima data dalam format lazim yang terbaca sistem.' },
  { key: 'batasi', label: 'Batasi pemrosesan', desc: 'Tunda/batasi pemrosesan sebagian atau seluruhnya.' },
];

export interface DsarRequest {
  id: number;
  jenis: string;
  anggota_id: number;
  anggota_nama?: string;
  status: string;
  detail?: string | null;
  catatan_admin?: string | null;
  due_at: string;
  decided_at?: string | null;
  created_at: string;
}
