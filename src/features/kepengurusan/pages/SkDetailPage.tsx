import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Alert, Field, SelectInput, TextInput } from '@/components/ui/fields';
import { Overlay, Spinner } from '@/components/ui/loading';
import { Card, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { adminListAnggota } from '@/features/anggota/api/anggotaService';
import type { AnggotaDetail } from '@/features/anggota/types';
import { presignView } from '@/features/storage/api/storageService';
import { ApiError } from '@/services/apiClient';
import {
  adminAddPengurus,
  adminApproveSK,
  adminGetSK,
  adminListJabatan,
  adminRemovePengurus,
  adminSetSKStatus,
} from '../api/kepengurusanService';
import { canAjukanSK, canFinalizeSK, canForwardSK, canManagePengurusForLevel } from '../roles';
import type { Jabatan, SKApprovalAction, SKDetail, SKStatus } from '../types';

const APPROVAL_LABEL: Record<string, string> = {
  DRAFT: 'Draf',
  MENUNGGU_PROVINSI: 'Menunggu Provinsi',
  MENUNGGU_NASIONAL: 'Menunggu Nasional',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
};

function tanggal(s: string): string {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SkDetailPage() {
  const { id } = useParams();
  const skId = Number(id);
  const { user } = useAuth();

  const [detail, setDetail] = useState<SKDetail | null>(null);
  const [jabatan, setJabatan] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [catatan, setCatatan] = useState('');
  const [cariAnggota, setCariAnggota] = useState('');
  const [hasilAnggota, setHasilAnggota] = useState<AnggotaDetail[]>([]);
  const [anggotaTerpilih, setAnggotaTerpilih] = useState<AnggotaDetail | null>(null);
  const [jabatanTerpilih, setJabatanTerpilih] = useState('');
  const [konfirmasi, setKonfirmasi] = useState(false);

  const load = useCallback(async () => {
    if (!skId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, j] = await Promise.all([adminGetSK(skId), adminListJabatan(false)]);
      setDetail(d);
      setJabatan(j);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat detail SK');
    } finally {
      setLoading(false);
    }
  }, [skId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function lihatFile(): Promise<void> {
    if (!detail) return;
    setAksiError(null);
    try {
      const res = await presignView(detail.sk.file_sk_key);
      window.open(res.view_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal membuka file SK');
    }
  }

  async function setujui(action: SKApprovalAction): Promise<void> {
    setAksiError(null);
    if (action === 'TOLAK' && !catatan.trim()) {
      setAksiError('Catatan wajib diisi untuk menolak SK.');
      return;
    }
    setBusy(true);
    try {
      await adminApproveSK(skId, action, catatan.trim());
      setCatatan('');
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Aksi persetujuan gagal');
    } finally {
      setBusy(false);
    }
  }

  async function ubahStatusSK(status: SKStatus): Promise<void> {
    setAksiError(null);
    setBusy(true);
    try {
      await adminSetSKStatus(skId, status);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal mengubah status SK');
    } finally {
      setBusy(false);
    }
  }

  async function cariAnggotaSubmit(): Promise<void> {
    setAksiError(null);
    try {
      const res = await adminListAnggota({ page: 1, limit: 8, search: cariAnggota.trim() || undefined, status: 'AKTIF' });
      setHasilAnggota(res.data);
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal mencari anggota');
    }
  }

  async function tambahPengurus(): Promise<void> {
    setAksiError(null);
    if (!anggotaTerpilih) {
      setAksiError('Pilih anggota terlebih dahulu.');
      return;
    }
    if (!jabatanTerpilih) {
      setAksiError('Pilih jabatan terlebih dahulu.');
      return;
    }
    if (!konfirmasi) {
      setAksiError('Centang konfirmasi kelayakan.');
      return;
    }
    setBusy(true);
    try {
      await adminAddPengurus(skId, anggotaTerpilih.id, Number(jabatanTerpilih), true);
      setAnggotaTerpilih(null);
      setCariAnggota('');
      setHasilAnggota([]);
      setJabatanTerpilih('');
      setKonfirmasi(false);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal menambahkan pengurus');
    } finally {
      setBusy(false);
    }
  }

  async function lepas(pengurusId: number): Promise<void> {
    if (!window.confirm('Lepas pengurus ini dari SK?')) return;
    setAksiError(null);
    setBusy(true);
    try {
      await adminRemovePengurus(skId, pengurusId);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal melepas pengurus');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (!detail) return <ErrorBox message={error ?? 'SK tidak ditemukan'} />;

  const { sk, pengurus } = detail;
  const final = sk.approval_status === 'DISETUJUI';
  const dapatAjukan = canAjukanSK(user?.role, sk.level);
  const dapatTambah = canManagePengurusForLevel(user?.role, sk.level) && sk.status === 'Aktif' && !final;
  const jabatanSesuai = jabatan.filter((j) => j.level === sk.level);

  return (
    <div>
      <PageHeader title={sk.nomor_sk} desc={sk.judul} action={
        <Button variant="outline-navy" onClick={() => void lihatFile()}>Lihat File SK</Button>
      } />

      {aksiError && <div className="mb-4"><Alert kind="error">{aksiError}</Alert></div>}
      {sk.catatan_penolakan && (
        <div className="mb-4"><Alert kind="warning">Catatan penolakan: {sk.catatan_penolakan}</Alert></div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div><dt className="text-kipan-text-muted">Level</dt><dd className="font-semibold">{sk.level}</dd></div>
            <div><dt className="text-kipan-text-muted">Tanggal Terbit</dt><dd className="font-semibold">{tanggal(sk.tanggal_terbit)}</dd></div>
            <div><dt className="text-kipan-text-muted">Tanggal Berakhir</dt><dd className="font-semibold">{sk.tanggal_berakhir ? tanggal(sk.tanggal_berakhir) : '-'}</dd></div>
            <div><dt className="text-kipan-text-muted">Status SK</dt><dd className="font-semibold"><StatusBadge status={sk.status} /></dd></div>
            <div><dt className="text-kipan-text-muted">Persetujuan</dt><dd className="font-semibold"><StatusBadge status={sk.approval_status} label={APPROVAL_LABEL[sk.approval_status] ?? sk.approval_status} /></dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            {sk.status === 'Aktif'
              ? <Button variant="ghost" onClick={() => void ubahStatusSK('TidakAktif')}>Nonaktifkan SK</Button>
              : <Button variant="ghost" onClick={() => void ubahStatusSK('Aktif')}>Aktifkan SK</Button>}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold text-kipan-text-dark">Rantai Persetujuan</p>
          <p className="mt-1 text-xs text-kipan-text-muted">Buat (DRAF) → Ajukan → Provinsi teruskan → Nasional sahkan (final &amp; terkunci).</p>
          <div className="mt-3 space-y-3">
            {dapatAjukan && sk.approval_status === 'DRAFT' && (
              <Button variant="primary" onClick={() => void setujui('AJUKAN')} disabled={busy}>Ajukan SK</Button>
            )}
            {canForwardSK(user?.role) && sk.approval_status === 'MENUNGGU_PROVINSI' && (
              <Button variant="primary" onClick={() => void setujui('TERUSKAN')} disabled={busy}>Teruskan ke Nasional</Button>
            )}
            {canFinalizeSK(user?.role) && sk.approval_status === 'MENUNGGU_NASIONAL' && (
              <>
                <Field label="Catatan (wajib bila menolak)">
                  <TextInput value={catatan} onChange={setCatatan} id="sk-catatan" />
                </Field>
                <div className="flex gap-3">
                  <Button variant="accent" onClick={() => void setujui('SAHKAN')} disabled={busy}>Sahkan (Final)</Button>
                  <Button variant="ghost" onClick={() => void setujui('TOLAK')} disabled={busy}>Tolak</Button>
                </div>
              </>
            )}
            {final && <Alert kind="info">SK final. Susunan pengurus terkunci — buat SK baru untuk perubahan.</Alert>}
            {!final && !(dapatAjukan && sk.approval_status === 'DRAFT') && !(canForwardSK(user?.role) && sk.approval_status === 'MENUNGGU_PROVINSI') && !(canFinalizeSK(user?.role) && sk.approval_status === 'MENUNGGU_NASIONAL') && (
              <p className="text-xs text-kipan-text-muted">Menunggu aksi pada tahap berikutnya.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <p className="text-base font-bold text-kipan-text-dark">Susunan Pengurus</p>
          {pengurus.length === 0 ? (
            <p className="mt-3 text-sm text-kipan-text-muted">Belum ada pengurus pada SK ini.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-kipan-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
                  <tr>
                    <th className="px-4 py-2.5">NIA</th>
                    <th className="px-4 py-2.5">Nama</th>
                    <th className="px-4 py-2.5">Jabatan</th>
                    <th className="px-4 py-2.5">Status</th>
                    {dapatTambah && <th className="px-4 py-2.5" />}
                  </tr>
                </thead>
                <tbody>
                  {pengurus.map((p) => (
                    <tr key={p.id} className="border-t border-kipan-border">
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-kipan-navy">{p.nia}</td>
                      <td className="px-4 py-2.5 font-semibold text-kipan-text-dark">{p.nama_lengkap}</td>
                      <td className="px-4 py-2.5 text-kipan-text-muted">{p.jabatan}{p.is_inti ? ' (inti)' : ''}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                      {dapatTambah && (
                        <td className="px-4 py-2.5 text-right">
                          <button type="button" onClick={() => void lepas(p.id)} className="font-semibold text-kipan-red hover:underline">Lepas</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dapatTambah && (
            <div className="mt-5 rounded-xl border border-kipan-border bg-kipan-soft-gray p-4">
              <p className="text-sm font-bold text-kipan-text-dark">Tambah Pengurus (Angkat Kader)</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Jabatan" required>
                  <SelectInput
                    value={jabatanTerpilih}
                    onChange={setJabatanTerpilih}
                    placeholder="Pilih jabatan"
                    id="add-jabatan"
                    options={jabatanSesuai.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))}
                  />
                </Field>
                <Field label="Cari Anggota (nama / NIA)" required hint="Hanya anggota AKTIF di wilayah SK">
                  <div className="flex gap-2">
                    <input
                      value={cariAnggota}
                      onChange={(e) => setCariAnggota(e.target.value)}
                      placeholder="Ketik nama atau NIA"
                      className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
                    />
                    <Button variant="primary" onClick={() => void cariAnggotaSubmit()}>Cari</Button>
                  </div>
                </Field>
              </div>

              {hasilAnggota.length > 0 && (
                <div className="mt-3 max-h-48 overflow-auto rounded-lg border border-kipan-border bg-white">
                  {hasilAnggota.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAnggotaTerpilih(a)}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-kipan-soft-blue ${anggotaTerpilih?.id === a.id ? 'bg-kipan-soft-blue font-semibold' : ''}`}
                    >
                      <span>{a.nama_lengkap}</span>
                      <span className="font-mono text-xs text-kipan-text-muted">{a.nia}</span>
                    </button>
                  ))}
                </div>
              )}
              {anggotaTerpilih && <p className="mt-2 text-xs font-semibold text-kipan-green">Terpilih: {anggotaTerpilih.nama_lengkap} ({anggotaTerpilih.nia})</p>}

              <label className="mt-3 flex items-start gap-2 text-sm text-kipan-text-dark">
                <input type="checkbox" checked={konfirmasi} onChange={(e) => setKonfirmasi(e.target.checked)} className="mt-0.5 h-4 w-4 accent-kipan-navy" />
                Saya mengonfirmasi kader ini layak diangkat (penilaian kelayakan dilakukan di luar sistem).
              </label>
              <div className="mt-3">
                <Button variant="accent" onClick={() => void tambahPengurus()} disabled={busy}>
                  {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Memproses...</span> : 'Angkat sebagai Pengurus'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {busy && <Overlay label="Memproses..." />}
    </div>
  );
}
