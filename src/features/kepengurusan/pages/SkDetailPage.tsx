import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Alert, Field, SelectInput, TextInput } from '@/components/ui/fields';
import { Overlay } from '@/components/ui/loading';
import { Modal } from '@/components/ui/modal';
import { Card, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { presignView } from '@/features/storage/api/storageService';
import { ApiError } from '@/services/apiClient';
import {
  adminApproveSK,
  adminGetSK,
  adminRemovePengurus,
  adminSetSKStatus,
} from '../api/kepengurusanService';
import PromotePengurusWizard from '../components/PromotePengurusWizard';
import { canAjukanSK, canFinalizeSK, canForwardSK, canManagePengurusForLevel } from '../roles';
import type { SKApprovalAction, SKDetail, SKListItem, SKStatus } from '../types';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [showNonaktif, setShowNonaktif] = useState(false);
  const [nonaktifStatus, setNonaktifStatus] = useState<'Demisioner' | 'Diberhentikan'>('Demisioner');
  const [nonaktifKeterangan, setNonaktifKeterangan] = useState('');

  const load = useCallback(async () => {
    if (!skId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await adminGetSK(skId));
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

  async function konfirmasiNonaktif(): Promise<void> {
    setAksiError(null);
    if (!nonaktifKeterangan.trim()) {
      setAksiError('Keterangan wajib diisi untuk menonaktifkan SK.');
      return;
    }
    setBusy(true);
    try {
      await adminSetSKStatus(skId, 'TidakAktif', nonaktifStatus, nonaktifKeterangan.trim());
      setShowNonaktif(false);
      setNonaktifKeterangan('');
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal menonaktifkan SK');
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
  const presetSK: SKListItem = {
    id: sk.id, nomor_sk: sk.nomor_sk, judul: sk.judul, level: sk.level,
    provinsi_id: sk.provinsi_id, kabupaten_id: sk.kabupaten_id,
    status: sk.status, approval_status: sk.approval_status,
    tanggal_terbit: sk.tanggal_terbit, tanggal_berakhir: sk.tanggal_berakhir,
    jumlah_pengurus: pengurus.length, created_at: sk.created_at,
  };

  return (
    <div>
      <PageHeader title={sk.nomor_sk} desc={sk.judul} action={
        <Button variant="outline-navy" onClick={() => void lihatFile()}>Lihat File SK</Button>
      } />

      {aksiError && <div className="mb-4"><Alert kind="error">{aksiError}</Alert></div>}
      {sk.catatan_penolakan && (
        <div className="mb-4"><Alert kind="warning">Catatan penolakan: {sk.catatan_penolakan}</Alert></div>
      )}

      <div className="mb-5">
        <Alert kind="info">
          Alur: <b>Buat SK (Draf)</b> → <b>Susun Pengurus</b> → <b>Ajukan</b> → Provinsi teruskan → Nasional sahkan (final &amp; terkunci).
          Susun pengurus <b>sebelum</b> SK disahkan. Mengajukan &amp; menyetujui SK baru otomatis menonaktifkan SK lama selevel+wilayah beserta pengurusnya (<b>Single Active SK</b>).
        </Alert>
      </div>

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
              ? <Button variant="ghost" onClick={() => { setAksiError(null); setNonaktifStatus('Demisioner'); setNonaktifKeterangan(''); setShowNonaktif(true); }}>Nonaktifkan SK</Button>
              : <Button variant="ghost" onClick={() => void ubahStatusSK('Aktif')}>Aktifkan SK</Button>}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold text-kipan-text-dark">Rantai Persetujuan</p>
          <p className="mt-1 text-xs text-kipan-text-muted">Buat (DRAF) → Ajukan → Provinsi teruskan → Nasional sahkan (final &amp; terkunci).</p>
          <div className="mt-3 space-y-3">
            {dapatAjukan && sk.approval_status === 'DRAFT' && (
              <Button variant="primary" onClick={() => void setujui('AJUKAN')} disabled={busy || pengurus.length === 0}>
                Ajukan SK
              </Button>
            )}
            {dapatAjukan && sk.approval_status === 'DRAFT' && pengurus.length === 0 && (
              <p className="text-xs text-amber-600">Tambahkan minimal satu pengurus sebelum mengajukan SK.</p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-bold text-kipan-text-dark">Susunan Pengurus ({pengurus.length})</p>
            {dapatTambah && (
              <Button variant="primary" onClick={() => setShowWizard(true)}>+ Angkat Pengurus ke SK ini</Button>
            )}
          </div>

          {pengurus.length === 0 ? (
            <p className="mt-3 text-sm text-kipan-text-muted">
              Belum ada pengurus pada SK ini. {dapatTambah ? 'Gunakan tombol "Angkat Pengurus" untuk menyusun kepengurusan sebelum SK diajukan.' : ''}
            </p>
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

          {!final && sk.status === 'Aktif' && !dapatTambah && (
            <p className="mt-3 text-xs text-kipan-text-muted">Anda tidak berwenang menyusun pengurus pada SK level ini.</p>
          )}
        </Card>
      </div>

      <PromotePengurusWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onDone={load}
        actorRole={user?.role}
        presetSK={presetSK}
      />

      {showNonaktif && (
        <Modal title={`Nonaktifkan SK ${sk.nomor_sk}`} onClose={() => setShowNonaktif(false)}>
          {aksiError && <div className="mb-3"><Alert kind="error">{aksiError}</Alert></div>}
          <p className="mb-3 text-sm text-kipan-text-muted">Seluruh pengurus aktif pada SK ini akan didemosi otomatis.</p>
          <div className="grid gap-4">
            <Field label="Status Akhir Pengurus" required>
              <SelectInput
                value={nonaktifStatus}
                onChange={(v) => setNonaktifStatus(v as 'Demisioner' | 'Diberhentikan')}
                placeholder="Pilih status"
                id="sk-nonaktif-status"
                options={[{ value: 'Demisioner', label: 'Demisioner' }, { value: 'Diberhentikan', label: 'Diberhentikan' }]}
              />
            </Field>
            <Field label="Keterangan / Alasan" required>
              <TextInput value={nonaktifKeterangan} onChange={setNonaktifKeterangan} placeholder="Mis. masa jabatan selesai" id="sk-nonaktif-ket" />
            </Field>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="accent" onClick={() => void konfirmasiNonaktif()} disabled={busy}>Nonaktifkan</Button>
            <Button variant="ghost" onClick={() => setShowNonaktif(false)}>Batal</Button>
          </div>
        </Modal>
      )}

      {busy && <Overlay label="Memproses..." />}
    </div>
  );
}
