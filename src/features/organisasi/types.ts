export interface OrganisasiProfile {
  id: number;
  nama: string;
  singkatan: string;
  deskripsi: string;
  visi: string;
  misi: string;
  alamat: string;
  email: string;
  telepon: string;
  whatsapp: string;
  website: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  logo_url: string;
  updated_at: string;
}

export type OrganisasiUpdateInput = Omit<OrganisasiProfile, 'id' | 'updated_at'>;
