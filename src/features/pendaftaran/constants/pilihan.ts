// Opsi dropdown Agama & Pendidikan Terakhir (disamakan proyek lama).
// Backend memvalidasi keduanya sebagai teks bebas, jadi value di sini
// adalah string persis yang dikirim ke server.

export interface Pilihan {
  value: string;
  label: string;
}

export const AGAMA_OPTIONS: Pilihan[] = [
  { value: 'Islam', label: 'Islam' },
  { value: 'Kristen', label: 'Kristen' },
  { value: 'Katolik', label: 'Katolik' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Buddha', label: 'Buddha' },
  { value: 'Konghucu', label: 'Konghucu' },
];

export const PENDIDIKAN_OPTIONS: Pilihan[] = [
  { value: 'SMP', label: 'SMP' },
  { value: 'SMA/SMK', label: 'SMA/SMK' },
  { value: 'D3', label: 'D3' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'S3', label: 'S3' },
];
