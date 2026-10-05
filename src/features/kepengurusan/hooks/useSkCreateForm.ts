import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import { adminListAnggota } from '@/features/anggota/api/anggotaService';
import { useWilayah } from '@/features/pendaftaran/hooks/useWilayah';
import { uploadDokumen } from '@/features/storage/api/storageService';
import {
  adminAddPengurus,
  adminCreateSK,
  adminListJabatan,
  adminListPromosi,
} from '../api/kepengurusanService';
import { FORM_LEVELS, type KaderPick } from '../lib/skList';
import type { Jabatan } from '../types';

// SkCreateFormApi menampung SELURUH state form Buat SK + kader yang diangkat.
// onDone dipanggil setelah simpan sukses (tutup form + refresh daftar).
export interface SkCreateFormApi {
  showForm: boolean;
  bukaForm: () => void;
  nomor: string; setNomor: (v: string) => void;
  judul: string; setJudul: (v: string) => void;
  fLevel: string; setFLevel: (v: string) => void;
  fProvinsi: string;
  fKabupaten: string; setFKabupaten: (v: string) => void;
  tanggal: string; setTanggal: (v: string) => void;
  berakhir: string; setBerakhir: (v: string) => void;
  file: File | null; setFile: (v: File | null) => void;
  busy: boolean;
  formError: string | null;
  jabatanList: Jabatan[];
  fJabatanId: string; setFJabatanId: (v: string) => void;
  fTanggalMulai: string; setFTanggalMulai: (v: string) => void;
  fAnggotaSearch: string; setFAnggotaSearch: (v: string) => void;
  fMode: 'anggota' | 'promosi'; setFMode: (v: 'anggota' | 'promosi') => void;
  fHasilAnggota: KaderPick[];
  fLoadingAnggota: boolean;
  fAnggotaTerpilih: KaderPick | null; setFAnggotaTerpilih: (v: KaderPick | null) => void;
  fKonfirmasi: boolean; setFKonfirmasi: (v: boolean) => void;
  isNational: boolean;
  effLevel: string;
  formLevels: typeof FORM_LEVELS;
  wilayahProvinsi: Array<{ id: number; nama: string }>;
  wilayahKabupaten: Array<{ id: number; nama: string }>;
  loadingKabWilayah: boolean;
  ubahProvinsi: (v: string) => void;
  simpan: (e: React.FormEvent) => Promise<void>;
}

export function useSkCreateForm(onDone: () => Promise<void>): SkCreateFormApi {
  const { user } = useAuth();
  const isNational = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const wilayah = useWilayah();

  const [showForm, setShowForm] = useState(false);
  const [nomor, setNomor] = useState('');
  const [judul, setJudul] = useState('');
  const [fLevel, setFLevel] = useState('NASIONAL');
  const [fProvinsi, setFProvinsi] = useState('');
  const [fKabupaten, setFKabupaten] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [berakhir, setBerakhir] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Langkah "Kader yang diangkat" (dalam form Buat SK).
  const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
  const [fJabatanId, setFJabatanId] = useState('');
  const [fTanggalMulai, setFTanggalMulai] = useState('');
  const [fAnggotaSearch, setFAnggotaSearch] = useState('');
  const fDebouncedSearch = useDebouncedValue(fAnggotaSearch, 300);
  const [fMode, setFMode] = useState<'anggota' | 'promosi'>('anggota');
  const [fHasilAnggota, setFHasilAnggota] = useState<KaderPick[]>([]);
  const [fLoadingAnggota, setFLoadingAnggota] = useState(false);
  const [fAnggotaTerpilih, setFAnggotaTerpilih] = useState<KaderPick | null>(null);
  const [fKonfirmasi, setFKonfirmasi] = useState(false);

  // Level efektif SK (mengikuti role; Super/Nasional dari pilihan form).
  const effLevel = isNational ? fLevel : (user?.role === 'ADMIN_PROVINSI' ? 'PROVINSI' : 'KABUPATEN');

  function resetForm(): void {
    setNomor('');
    setJudul('');
    setFLevel('NASIONAL');
    setFProvinsi('');
    setFKabupaten('');
    setTanggal('');
    setBerakhir('');
    setFile(null);
    setFormError(null);
    setJabatanList([]);
    setFJabatanId('');
    setFTanggalMulai('');
    setFAnggotaSearch('');
    setFMode('anggota');
    setFHasilAnggota([]);
    setFAnggotaTerpilih(null);
    setFKonfirmasi(false);
  }

  function bukaForm(): void {
    setShowForm((v) => !v);
    resetForm();
  }

  function ubahProvinsi(v: string): void {
    setFProvinsi(v);
    setFKabupaten('');
    if (v) void wilayah.pilihProvinsi(Number(v));
  }

  // Muat master jabatan (tanpa level — tingkat mengikuti SK).
  useEffect(() => {
    if (!showForm) return;
    adminListJabatan(false).then(setJabatanList).catch(() => setJabatanList([]));
  }, [showForm]);

  // Cari kader: mode "Dari Anggota (Baru)" atau "Promosi Pengurus".
  useEffect(() => {
    if (!showForm) return;
    const q = fDebouncedSearch.trim();
    if (q.length < 2) {
      setFHasilAnggota([]);
      return;
    }
    setFLoadingAnggota(true);
    const finish = (p: Promise<KaderPick[]>): void => {
      p.then(setFHasilAnggota).catch(() => setFHasilAnggota([])).finally(() => setFLoadingAnggota(false));
    };
    if (fMode === 'anggota') {
      void finish(
        adminListAnggota({ page: 1, limit: 8, search: q, status: 'AKTIF' })
          .then((r) => r.data.map((a) => ({ id: a.id, nama_lengkap: a.nama_lengkap, nia: a.nia }))),
      );
    } else {
      void finish(
        adminListPromosi(q).then((r) => r.map((c) => ({
          id: c.anggota_id, nama_lengkap: c.nama_lengkap, nia: c.nia,
          info: `${c.status} · ${c.jabatan} (${c.level})`,
        }))),
      );
    }
  }, [showForm, fDebouncedSearch, fMode]);

  async function simpan(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    if (!nomor.trim() || !judul.trim() || !tanggal || !berakhir) {
      setFormError('Nomor, judul, tanggal terbit, dan tanggal berakhir wajib diisi.');
      return;
    }
    if (new Date(`${berakhir}T00:00:00Z`) <= new Date(`${tanggal}T00:00:00Z`)) {
      setFormError('Tanggal berakhir harus setelah tanggal terbit.');
      return;
    }
    if (!file) {
      setFormError('File SK wajib diunggah.');
      return;
    }
    if (isNational) {
      if ((fLevel === 'PROVINSI' || fLevel === 'KABUPATEN') && !fProvinsi) {
        setFormError('Provinsi wajib dipilih.');
        return;
      }
      if (fLevel === 'KABUPATEN' && !fKabupaten) {
        setFormError('Kabupaten/Kota wajib dipilih.');
        return;
      }
    }
    if (!fJabatanId) {
      setFormError('Pilih jabatan kader yang akan diangkat.');
      return;
    }
    if (!fAnggotaTerpilih) {
      setFormError('Pilih kader yang akan diangkat.');
      return;
    }
    if (!fKonfirmasi) {
      setFormError('Centang konfirmasi kelayakan kader.');
      return;
    }
    setBusy(true);
    try {
      const key = await uploadDokumen('sk', file);
      const sk = await adminCreateSK({
        nomor_sk: nomor.trim(),
        judul: judul.trim(),
        level: isNational ? fLevel : undefined,
        provinsi_id: isNational && fLevel !== 'NASIONAL' ? Number(fProvinsi) : undefined,
        kabupaten_id: isNational && fLevel === 'KABUPATEN' ? Number(fKabupaten) : undefined,
        tanggal_terbit: new Date(`${tanggal}T00:00:00Z`).toISOString(),
        tanggal_berakhir: new Date(`${berakhir}T00:00:00Z`).toISOString(),
        file_sk_key: key,
      });
      await adminAddPengurus(
        sk.id,
        fAnggotaTerpilih.id,
        Number(fJabatanId),
        true,
        fTanggalMulai ? new Date(`${fTanggalMulai}T00:00:00Z`).toISOString() : undefined,
      );
      setShowForm(false);
      resetForm();
      await onDone();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal membuat SK');
    } finally {
      setBusy(false);
    }
  }

  return {
    showForm, bukaForm,
    nomor, setNomor, judul, setJudul, fLevel, setFLevel, fProvinsi, fKabupaten, setFKabupaten,
    tanggal, setTanggal, berakhir, setBerakhir, file, setFile, busy, formError,
    jabatanList, fJabatanId, setFJabatanId, fTanggalMulai, setFTanggalMulai,
    fAnggotaSearch, setFAnggotaSearch, fMode, setFMode, fHasilAnggota, fLoadingAnggota,
    fAnggotaTerpilih, setFAnggotaTerpilih, fKonfirmasi, setFKonfirmasi,
    isNational, effLevel, formLevels: FORM_LEVELS,
    wilayahProvinsi: wilayah.provinsi, wilayahKabupaten: wilayah.kabupaten,
    loadingKabWilayah: wilayah.loadingKab,
    ubahProvinsi, simpan,
  };
}
