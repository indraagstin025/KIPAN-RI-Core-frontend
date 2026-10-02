export const NAV_ITEMS = [
  { label: 'Beranda', href: '/#beranda' },
  { label: 'Tentang', href: '/#tentang' },
  { label: 'Pendaftaran', href: '/#daftar' },
  { label: 'Alur', href: '/#alur' },
  { label: 'Lacak', href: '/lacak' },
  { label: 'Verifikasi KTA', href: '/verifikasi-kta' },
  { label: 'Cek Anggota', href: '/anggota' },
] as const;

export const HERO = {
  badge: 'Sistem Informasi Manajemen KIPAN RI',
  titleA: 'PEMUDA BERGERAK,',
  titleB: 'INDONESIA BERSINAR',
  subtitle:
    'Satu pintu pendaftaran Kader Inti Pemuda Anti Narkoba Republik Indonesia — daftar sebagai Kader atau Pengurus, lacak status berkas, dan verifikasi Kartu Tanda Anggota (KTA) secara resmi.',
  stats: [
    { value: 38, suffix: '', label: 'Provinsi' },
    { value: 514, suffix: '+', label: 'Kabupaten / Kota' },
    { value: 4, suffix: '', label: 'Tahap Verifikasi' },
  ],
};

export const TIPE_CARDS = [
  {
    tipe: 'kader',
    title: 'Daftar sebagai Kader',
    desc: 'Untuk pemuda yang ingin bergabung sebagai kader KIPAN. Tanpa Surat Keputusan — cukup KTP, pas foto, CV, surat pernyataan, dan surat sehat.',
    points: ['KTP & pas foto latar biru', 'CV / Resume', 'Surat pernyataan & surat sehat', 'Tanpa SK'],
    cta: '/daftar?tipe=kader',
  },
  {
    tipe: 'pengurus',
    title: 'Daftar sebagai Pengurus',
    desc: 'Untuk calon pengurus struktur DPD/DPC. Wajib melampirkan Surat Keputusan sebagai bukti penugasan struktural.',
    points: ['Seluruh dokumen kader', 'Surat Keputusan (SK) wajib', 'Verifikasi berjenjang', 'Akun USER bertipe PENGURUS'],
    cta: '/daftar?tipe=pengurus',
  },
] as const;

export const ALUR = [
  { no: '1', title: 'Isi Data Diri', desc: 'Lengkapi identitas, kontak, dan wilayah sesuai KTP. Pilih jalur Kader atau Pengurus di awal.' },
  { no: '2', title: 'Verifikasi WhatsApp', desc: 'Masukkan kode OTP 6-digit yang dikirim ke nomor WhatsApp Anda (berlaku 5 menit).' },
  { no: '3', title: 'Unggah Dokumen', desc: 'Unggah KTP, pas foto, CV, surat pernyataan, surat sehat — plus SK khusus Pengurus.' },
  { no: '4', title: 'Diverifikasi & Terima NIA', desc: 'Admin memverifikasi berjenjang. Saat disetujui Anda menerima NIA, akun login, dan KTA digital.' },
];

export const ORG = {
  name: 'KIPAN',
  full: 'Kader Inti Pemuda Anti Narkoba Republik Indonesia',
  email: 'info@kipan.id',
};
