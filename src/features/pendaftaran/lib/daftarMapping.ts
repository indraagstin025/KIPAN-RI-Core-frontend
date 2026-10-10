// FIELD_MAP memetakan nama field backend (JSON Go) ke kunci error form,
// agar pesan validasi server (422 per-field) tampil di input yang tepat.
export const FIELD_MAP: Record<string, string> = {
  nama_lengkap: 'nama',
  nik: 'nik',
  tempat_lahir: 'tempat',
  tanggal_lahir: 'tanggal',
  jenis_kelamin: 'jk',
  agama: 'agama',
  pendidikan: 'pendidikan',
  pekerjaan: 'pekerjaan',
  alamat: 'alamat',
  provinsi_id: 'prov',
  kabupaten_id: 'kab',
  kecamatan: 'kec',
  desa: 'desa',
  kode_pos: 'kodepos',
  email: 'email',
  whatsapp: 'wa',
  wa_otp_token: 'otp',
  motivation: 'motivasi',
  foto_key: 'foto',
  ktp_key: 'ktp',
  cv_key: 'cv',
  surat_pernyataan_key: 'surat_pernyataan',
  surat_sehat_key: 'surat_sehat',
};

export function mapServerFields(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[FIELD_MAP[k] ?? k] = v;
  }
  return out;
}

// stepForKey menentukan langkah wizard yang memuat field error server,
// agar pengguna otomatis dibawa ke input yang bermasalah.
export const STEP1_KEYS = ['nama', 'nik', 'tempat', 'tanggal', 'jk', 'agama', 'pendidikan', 'pekerjaan', 'alamat', 'prov', 'kab', 'kec', 'desa', 'kodepos'];
export const STEP2_KEYS = ['email', 'wa', 'otp', 'motivasi'];
export const STEP3_KEYS = ['foto', 'ktp', 'cv', 'surat_pernyataan', 'surat_sehat'];
export const STEP4_KEYS = ['persyaratan'];

export function stepForKey(key: string): number {
  if (STEP1_KEYS.includes(key)) return 0;
  if (STEP2_KEYS.includes(key)) return 1;
  if (STEP3_KEYS.includes(key)) return 2;
  if (STEP4_KEYS.includes(key)) return 3;
  return 4;
}
