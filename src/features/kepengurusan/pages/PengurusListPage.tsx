import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Alert, SelectInput, TextInput } from '@/components/ui/fields';
import { Card, ErrorBox, Loading, PageHeader, Pagination, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { useWilayah } from '@/features/pendaftaran/hooks/useWilayah';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import {
  adminListJabatan,
  adminListPengurus,
  adminListSK,
  adminMutasi,
  adminPaws,
  adminPengurusStats,
  adminUpdatePengurusJabatan,
  adminUpdatePengurusStatus,
} from '../api/kepengurusanService';
import PromotePengurusWizard from '../components/PromotePengurusWizard';
import { canManagePengurusForLevel } from '../roles';
import type { Jabatan, PengurusDetail, PengurusPAWAksi, PengurusStats, PengurusStatus, SKListItem } from '../types';

const STATUS_OPTIONS: PengurusStatus[] = ['Aktif', 'Demisioner', 'Diberhentikan', 'Mengundurkan Diri', 'Meninggal'];
const MASA_OPTIONS = [
  { value: '', label: 'Semua masa jabatan' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'AkanBerakhir', label: 'Akan berakhir (≤90 hari)' },
  { value: 'Berakhir', label: 'Berakhir' },
];

const PAW_OPTIONS: { value: PengurusPAWAksi; label: string }[] = [
  { value: 'DEMISIONER', label: 'Demisioner (purna tugas awal)' },
  { value: 'DIBERHENTIKAN', label: 'Diberhentikan (sanksi)' },
  { value: 'MENGUNDURKAN_DIRI', label: 'Mengundurkan diri' },
  { value: 'MENINGGAL', label: 'Meninggal dunia' },
];

const EMPTY_STATS: PengurusStats = { total: 0, nasional: 0, provinsi: 0, kabupaten: 0, akan_berakhir: 0 };

function wilayahNama(p: PengurusDetail): string {
  if (p.level === 'NASIONAL') return 'Nasional';
  if (p.level === 'PROVINSI') return p.provinsi_nama ?? '-';
  return p.kabupaten_nama ?? '-';
}

function masaJabatan(s?: string): { text: string; cls: string } {
  if (!s) return { text: 'Tanpa batas', cls: 'text-kipan-text-muted' };
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return { text: '-', cls: 'text-kipan-text-muted' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { text: 'Berakhir', cls: 'text-kipan-red' };
  if (days <= 90) return { text: `Akan berakhir (${days} hari)`, cls: 'text-amber-600' };
  return { text: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }), cls: 'text-kipan-text-muted' };
}

export default function PengurusListPage() {
  const { user } = useAuth();
  const isNational = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const wilayah = useWilayah();

  const [items, setItems] = useState<PengurusDetail[]>([]);
  const [stats, setStats] = useState<PengurusStats>(EMPTY_STATS);
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [masa, setMasa] = useState('');
  const [provFilter, setProvFilter] = useState('');
  const [kabFilter, setKabFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Wizard pengangkatan terpadu (SK → Anggota → Jabatan → Konfirmasi).
  const [showWizard, setShowWizard] = useState(false);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, st] = await Promise.all([
        adminListPengurus({
          page, limit: 10,
          level: level || undefined,
          status: status || undefined,
          masa_jabatan: masa || undefined,
          provinsi_id: provFilter ? Number(provFilter) : undefined,
          kabupaten_id: kabFilter ? Number(kabFilter) : undefined,
          search: debouncedSearch || undefined,
        }),
        adminPengurusStats(),
      ]);
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
      setStats(st);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar pengurus');
    } finally {
      setLoading(false);
    }
  }, [page, level, status, masa, provFilter, kabFilter, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function pilihProvinsi(v: string): void {
    setProvFilter(v);
    setKabFilter('');
    setPage(1);
    if (v) void wilayah.pilihProvinsi(Number(v));
  }

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
      await load();
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
      await load();
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
      await load();
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
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal memutasi pengurus');
    }
  }

  const tabs: { value: string; label: string; count: number }[] = [
    { value: '', label: 'Semua', count: stats.total },
    { value: 'NASIONAL', label: 'Nasional', count: stats.nasional },
    { value: 'PROVINSI', label: 'Provinsi', count: stats.provinsi },
    { value: 'KABUPATEN', label: 'Kabupaten/Kota', count: stats.kabupaten },
  ];

  return (
    <div>
      <PageHeader
        title="Pengurus"
        desc={`${total} pengurus sesuai cakupan wilayah Anda.`}
        action={(
          <div className="flex gap-2">
            <Button variant="outline-navy" onClick={() => window.print()}>Cetak / PDF</Button>
            <Button variant="primary" onClick={() => setShowWizard(true)}>+ Tambah Pengurus</Button>
          </div>
        )}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card><p className="text-xs text-kipan-text-muted">Total Pengurus</p><p className="text-2xl font-bold text-kipan-text-dark">{stats.total}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Nasional</p><p className="text-2xl font-bold text-kipan-text-dark">{stats.nasional}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Provinsi</p><p className="text-2xl font-bold text-kipan-text-dark">{stats.provinsi}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Kabupaten/Kota</p><p className="text-2xl font-bold text-kipan-text-dark">{stats.kabupaten}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Masa Jabatan Akan Berakhir</p><p className="text-2xl font-bold text-amber-600">{stats.akan_berakhir}</p></Card>
      </div>

      {aksiError && <div className="mb-4"><Alert kind="error">{aksiError}</Alert></div>}

      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => { setLevel(t.value); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${level === t.value ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy hover:bg-kipan-soft-gray'}`}
          >
            {t.label} <span className="opacity-75">({t.count})</span>
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); void load(); }} className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari nama atau NIA"
          className="w-full max-w-xs rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          <option value="">Semua status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={masa} onChange={(e) => { setMasa(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          {MASA_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {isNational && (
          <>
            <select value={provFilter} onChange={(e) => pilihProvinsi(e.target.value)} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
              <option value="">Semua provinsi</option>
              {wilayah.provinsi.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            <select value={kabFilter} onChange={(e) => { setKabFilter(e.target.value); setPage(1); }} disabled={!provFilter} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20 disabled:bg-kipan-soft-gray">
              <option value="">Semua kabupaten/kota</option>
              {wilayah.kabupaten.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </>
        )}
        <button type="submit" className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">Cari</button>
      </form>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Belum ada pengurus.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama / NIA</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">SK</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Masa Jabatan</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((p, idx) => {
                const mj = masaJabatan(p.sk_tanggal_berakhir);
                return (
                  <tr key={p.id} className="border-t border-kipan-border align-top hover:bg-kipan-soft-gray/60">
                    <td className="px-4 py-3 text-kipan-text-muted">{(page - 1) * 10 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-kipan-text-dark">{p.nama_lengkap}</div>
                      <div className="font-mono text-xs text-kipan-navy">{p.nia}</div>
                      {editing === p.id && (
                        <div className="mt-2 space-y-2">
                          <SelectInput
                            value={editStatus}
                            onChange={(v) => setEditStatus(v as PengurusStatus)}
                            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                            placeholder="Pilih status"
                            id={`pst-${p.id}`}
                          />
                          {editStatus !== 'Aktif' && (
                            <TextInput value={editKeterangan} onChange={setEditKeterangan} placeholder="Keterangan (wajib)" id={`pket-${p.id}`} />
                          )}
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={() => void simpanStatus(p.id)}>Simpan</Button>
                            <Button variant="ghost" onClick={() => setEditing(null)}>Batal</Button>
                          </div>
                        </div>
                      )}
                      {editingJabatan === p.id && (
                        <div className="mt-2 space-y-2">
                          <SelectInput
                            value={newJabatanId}
                            onChange={setNewJabatanId}
                            options={jabatanAll.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))}
                            placeholder="Pilih jabatan baru"
                            id={`pjab-${p.id}`}
                          />
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={() => void simpanJabatan(p.id)}>Simpan Jabatan</Button>
                            <Button variant="ghost" onClick={() => setEditingJabatan(null)}>Batal</Button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-kipan-text-muted">{p.jabatan}{p.is_inti ? ' (inti)' : ''}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{p.level}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{wilayahNama(p)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/sk/${p.surat_keputusan_id}`} className="font-mono text-xs font-semibold text-kipan-blue hover:underline">{p.nomor_sk}</Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className={`px-4 py-3 text-xs font-semibold ${mj.cls}`}>{mj.text}</td>
                    <td className="px-4 py-3 text-right">
                      {canManagePengurusForLevel(user?.role, p.level) &&
                        editing !== p.id && editingJabatan !== p.id && pawId !== p.id && mutasiId !== p.id && (
                        <div className="flex flex-col items-end gap-1">
                          <button type="button" onClick={() => mulaiUbah(p)} className="font-semibold text-kipan-blue hover:underline">Ubah Status</button>
                          <button type="button" onClick={() => mulaiGantiJabatan(p)} className="font-semibold text-kipan-blue hover:underline">Ganti Jabatan</button>
                          {p.status === 'Aktif' && (
                            <>
                              <button type="button" onClick={() => mulaiPaw(p)} className="font-semibold text-kipan-red hover:underline">PAW</button>
                              <button type="button" onClick={() => mulaiMutasi(p)} className="font-semibold text-kipan-blue hover:underline">Mutasi</button>
                            </>
                          )}
                        </div>
                      )}
                      {pawId === p.id && (
                        <div className="mt-2 space-y-2 text-left">
                          <p className="text-xs font-bold text-kipan-text-dark">Aksi PAW</p>
                          <SelectInput
                            value={pawAksi}
                            onChange={(v) => setPawAksi(v as PengurusPAWAksi)}
                            options={PAW_OPTIONS}
                            placeholder="Pilih aksi"
                            id={`paw-${p.id}`}
                          />
                          <TextInput value={pawKeterangan} onChange={setPawKeterangan} placeholder="Keterangan (wajib)" id={`pawk-${p.id}`} />
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={() => void simpanPaw(p.id)}>Proses PAW</Button>
                            <Button variant="ghost" onClick={() => setPawId(null)}>Batal</Button>
                          </div>
                        </div>
                      )}
                      {mutasiId === p.id && (
                        <div className="mt-2 space-y-2 text-left">
                          <p className="text-xs font-bold text-kipan-text-dark">Mutasi ke SK Lain</p>
                          <SelectInput
                            value={mutasiSKId}
                            onChange={setMutasiSKId}
                            options={skTargets
                              .filter((s) => s.id !== p.surat_keputusan_id)
                              .map((s) => ({ value: String(s.id), label: `${s.nomor_sk} · ${s.judul}` }))}
                            placeholder="Pilih SK tujuan"
                            id={`mut-${p.id}`}
                          />
                          <SelectInput
                            value={mutasiJabatanId}
                            onChange={setMutasiJabatanId}
                            options={jabatanAll.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))}
                            placeholder="Pilih jabatan tujuan"
                            id={`mutj-${p.id}`}
                          />
                          <TextInput value={mutasiTanggal} onChange={setMutasiTanggal} placeholder="Tanggal mulai (YYYY-MM-DD, opsional)" id={`mutt-${p.id}`} />
                          <TextInput value={mutasiKeterangan} onChange={setMutasiKeterangan} placeholder="Keterangan (opsional)" id={`mutk-${p.id}`} />
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={() => void simpanMutasi(p.id)}>Proses Mutasi</Button>
                            <Button variant="ghost" onClick={() => setMutasiId(null)}>Batal</Button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <PromotePengurusWizard open={showWizard} onClose={() => setShowWizard(false)} onDone={load} actorRole={user?.role} />
    </div>
  );
}
