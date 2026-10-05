import { useEffect, useState } from 'react';
import { ApiError } from '@/services/apiClient';
import {
  adminListJabatan,
  adminListSK,
  adminMutasi,
  adminPaws,
  adminUpdatePengurusJabatan,
  adminUpdatePengurusStatus,
} from '../api/kepengurusanService';
import type { Jabatan, PengurusDetail, PengurusPAWAksi, PengurusStatus, SKListItem } from '../types';

// PengurusAksiApi menampung state + handler 4 aksi baris
// (Ubah Status, Ganti Jabatan, PAW, Mutasi). Refresh daftar
// diserahkan ke pemanggil via onChanged.
export interface PengurusAksiApi {
  aksiError: string | null;
  editing: number | null; setEditing: (v: number | null) => void;
  editStatus: PengurusStatus; setEditStatus: (v: PengurusStatus) => void;
  editKeterangan: string; setEditKeterangan: (v: string) => void;
  editingJabatan: number | null; setEditingJabatan: (v: number | null) => void;
  newJabatanId: string; setNewJabatanId: (v: string) => void;
  jabatanAll: Jabatan[];
  pawId: number | null; setPawId: (v: number | null) => void;
  pawAksi: PengurusPAWAksi; setPawAksi: (v: PengurusPAWAksi) => void;
  pawKeterangan: string; setPawKeterangan: (v: string) => void;
  mutasiId: number | null; setMutasiId: (v: number | null) => void;
  mutasiSKId: string; setMutasiSKId: (v: string) => void;
  mutasiJabatanId: string; setMutasiJabatanId: (v: string) => void;
  mutasiTanggal: string; setMutasiTanggal: (v: string) => void;
  mutasiKeterangan: string; setMutasiKeterangan: (v: string) => void;
  skTargets: SKListItem[];
  mulaiUbah: (p: PengurusDetail) => void;
  mulaiGantiJabatan: (p: PengurusDetail) => void;
  simpanJabatan: (id: number) => Promise<void>;
  simpanStatus: (id: number) => Promise<void>;
  mulaiPaw: (p: PengurusDetail) => void;
  simpanPaw: (id: number) => Promise<void>;
  mulaiMutasi: (p: PengurusDetail) => void;
  simpanMutasi: (id: number) => Promise<void>;
}

export function usePengurusAksi(onChanged: () => Promise<void>): PengurusAksiApi {
  const [aksiError, setAksiError] = useState<string | null>(null);

  const [editing, setEditing] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<PengurusStatus>('Demisioner');
  const [editKeterangan, setEditKeterangan] = useState('');

  const [jabatanAll, setJabatanAll] = useState<Jabatan[]>([]);
  const [editingJabatan, setEditingJabatan] = useState<number | null>(null);
  const [newJabatanId, setNewJabatanId] = useState('');

  // PAW & Mutasi (A3).
  const [pawId, setPawId] = useState<number | null>(null);
  const [pawAksi, setPawAksi] = useState<PengurusPAWAksi>('DEMISIONER');
  const [pawKeterangan, setPawKeterangan] = useState('');
  const [mutasiId, setMutasiId] = useState<number | null>(null);
  const [mutasiSKId, setMutasiSKId] = useState('');
  const [mutasiJabatanId, setMutasiJabatanId] = useState('');
  const [mutasiTanggal, setMutasiTanggal] = useState('');
  const [mutasiKeterangan, setMutasiKeterangan] = useState('');
  const [skTargets, setSkTargets] = useState<SKListItem[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        setJabatanAll(await adminListJabatan(false));
      } catch {
        // abaikan; dropdown tetap tampil bila list tersedia
      }
    })();
  }, []);

  // SK tujuan mutasi: aktif & belum final (wewenang ditegakkan backend).
  useEffect(() => {
    void (async () => {
      try {
        const res = await adminListSK({ page: 1, limit: 100 });
        setSkTargets(res.data.filter((s) => s.status === 'Aktif' && s.approval_status !== 'DISETUJUI'));
      } catch {
        // abaikan
      }
    })();
  }, []);

  function mulaiUbah(p: PengurusDetail): void {
    setEditing(p.id);
    setEditStatus(p.status === 'Aktif' ? 'Demisioner' : 'Aktif');
    setEditKeterangan('');
    setAksiError(null);
  }

  function mulaiGantiJabatan(p: PengurusDetail): void {
    setEditingJabatan(p.id);
    setNewJabatanId(String(p.jabatan_id));
    setAksiError(null);
  }

  async function simpanJabatan(id: number): Promise<void> {
    setAksiError(null);
    if (!newJabatanId) {
      setAksiError('Pilih jabatan baru terlebih dahulu.');
      return;
    }
    try {
      await adminUpdatePengurusJabatan(id, Number(newJabatanId));
      setEditingJabatan(null);
      await onChanged();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal mengganti jabatan pengurus');
    }
  }

  async function simpanStatus(id: number): Promise<void> {
    setAksiError(null);
    if (editStatus !== 'Aktif' && !editKeterangan.trim()) {
      setAksiError('Keterangan wajib diisi saat menonaktifkan pengurus.');
      return;
    }
    try {
      await adminUpdatePengurusStatus(id, editStatus, editKeterangan.trim());
      setEditing(null);
      await onChanged();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal memperbarui status pengurus');
    }
  }

  function mulaiPaw(p: PengurusDetail): void {
    setPawId(p.id);
    setPawAksi('DEMISIONER');
    setPawKeterangan('');
    setAksiError(null);
  }

  async function simpanPaw(id: number): Promise<void> {
    setAksiError(null);
    if (!pawKeterangan.trim()) {
      setAksiError('Keterangan wajib diisi untuk aksi PAW.');
      return;
    }
    try {
      await adminPaws(id, pawAksi, pawKeterangan.trim());
      setPawId(null);
      await onChanged();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal memproses PAW');
    }
  }

  function mulaiMutasi(p: PengurusDetail): void {
    setMutasiId(p.id);
    setMutasiSKId('');
    setMutasiJabatanId(String(p.jabatan_id));
    setMutasiTanggal('');
    setMutasiKeterangan('');
    setAksiError(null);
  }

  async function simpanMutasi(id: number): Promise<void> {
    setAksiError(null);
    if (!mutasiSKId) {
      setAksiError('Pilih SK tujuan mutasi.');
      return;
    }
    if (!mutasiJabatanId) {
      setAksiError('Pilih jabatan tujuan.');
      return;
    }
    try {
      await adminMutasi(id, {
        sk_id: Number(mutasiSKId),
        jabatan_id: Number(mutasiJabatanId),
        tanggal_mulai: mutasiTanggal || undefined,
        keterangan: mutasiKeterangan.trim() || undefined,
      });
      setMutasiId(null);
      await onChanged();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal memutasi pengurus');
    }
  }

  return {
    aksiError,
    editing, setEditing, editStatus, setEditStatus, editKeterangan, setEditKeterangan,
    editingJabatan, setEditingJabatan, newJabatanId, setNewJabatanId, jabatanAll,
    pawId, setPawId, pawAksi, setPawAksi, pawKeterangan, setPawKeterangan,
    mutasiId, setMutasiId, mutasiSKId, setMutasiSKId, mutasiJabatanId, setMutasiJabatanId,
    mutasiTanggal, setMutasiTanggal, mutasiKeterangan, setMutasiKeterangan, skTargets,
    mulaiUbah, mulaiGantiJabatan, simpanJabatan, simpanStatus,
    mulaiPaw, simpanPaw, mulaiMutasi, simpanMutasi,
  };
}
