export interface PersyaratanItem {
  title: string;
  desc: string;
}

// Selaras PERSYARATAN proyek KIPAN_INDONESIA (kipan-data.ts). `title` menjadi
// label yang dikirim ke backend (persyaratan: string[]) dan ditampilkan di
// detail admin sebagai checklist persyaratan.
export const PERSYARATAN: PersyaratanItem[] = [
  { title: 'Warga Negara Indonesia', desc: 'Ber-KTP Indonesia dan domisili di wilayah tempat mendaftar' },
  { title: 'Usia 16-30 Tahun', desc: 'Calon anggota berusia antara 16 hingga 30 tahun pada saat pendaftaran' },
  { title: 'Sehat Jasmani & Rohani', desc: 'Bebas dari pengaruh narkoba dan tidak sedang dalam masa pemulihan' },
  { title: 'Bersedia Mengikuti Pelatihan', desc: 'Wajib mengikuti seluruh rangkaian pelatihan kader KIPAN' },
  { title: 'Mematuhi AD/ART', desc: 'Bersedia mematuhi Anggaran Dasar dan Rumah Tangga organisasi' },
  { title: 'Menjadi Relawan Aktif', desc: 'Bersedia menjadi relawan dalam program-program KIPAN' },
];
