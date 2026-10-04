import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Alert, SelectInput, TextInput } from '@/components/ui/fields';
import { Card, ErrorBox, Loading, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { adminAnggotaActivity } from '@/features/anggota/api/anggotaService';
import AnggotaFormModal from '@/features/anggota/components/AnggotaFormModal';
import type { ActivityLog } from '@/features/audit/types';
import KtaCardPreview from '@/features/kta/components/KtaCardPreview';
import { presignView } from '@/features/storage/api/storageService';
import { ApiError } from '@/services/apiClient';
import {
  adminGetPengurus,
  adminListJabatan,
  adminListSK,
  adminMutasi,
  adminPaws,
  adminUpdatePengurusJabatan,
  adminUpdatePengurusStatus,
} from '../api/kepengurusanService';
import { canManagePengurusForLevel } from '../roles';
import type {
  Jabatan,
  PengurusDetailResponse,
  PengurusPAWAksi,
  PengurusStatus,
  SKListItem,
} from '../types';

type TabKey = 'profil' | 'kepengurusan' | 'riwayat' | 'dokumen' | 'activity' | 'kartu';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'profil', label: 'Profil' },
  { key: 'kepengurusan', label: 'Kepengurusan' },
  { key: 'riwayat', label: 'Riwayat' },
  { key: 'dokumen', label: 'Dokumen' },
  { key: 'activity', label: 'Activity' },
  { key: 'kartu', label: 'Kartu Anggota' },
];

const STATUS_OPTIONS: PengurusStatus[] = ['Aktif', 'Demisioner', 'Diberhentikan', 'Mengundurkan Diri', 'Meninggal'];
const PAW_OPTIONS: { value: PengurusPAWAksi; label: string }[] = [
  { value: 'DEMISIONER', label: 'Demisioner (purna tugas awal)' },
  { value: 'DIBERHENTIKAN', label: 'Diberhentikan (sanksi)' },
  { value: 'MENGUNDURKAN_DIRI', label: 'Mengundurkan diri' },
  { value: 'MENINGGAL', label: 'Meninggal dunia' },
];

const DOC_FIELDS: Array<{ field: 'foto_key' | 'ktp_key' | 'cv_key' | 'sk_key' | 'surat_pernyataan_key' | 'surat_sehat_key'; label: string }> = [
  { field: 'foto_key', label: 'Pas Foto' },
  { field: 'ktp_key', label: 'KTP' },
  { field: 'cv_key', label: 'CV / Resume' },
  { field: 'sk_key', label: 'SK (Pendaftaran)' },
  { field: 'surat_pernyataan_key', label: 'Surat Pernyataan' },
  { field: 'surat_sehat_key', label: 'Surat Sehat' },
];

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-kipan-text-muted">{label}</div>
      <div className="text-sm font-medium text-kipan-text-dark">{value || '-'}</div>
    </div>
  );
}

function formatTanggal(d?: string): string {
  if (!d) return '-';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '-' : t.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function levelLabel(level?: string): string {
  switch (level) {
    case 'NASIONAL':
      return 'Nasional';
    case 'PROVINSI':
      return 'Provinsi';
    case 'KABUPATEN':
      return 'Kabupaten/Kota';
    default:
      return level || '-';
  }
}

export default function PengurusDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<PengurusDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('profil');

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [jabatanAll, setJabatanAll] = useState<Jabatan[]>([]);
  const [skTargets, setSkTargets] = useState<SKListItem[]>([]);

  // Activity
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Panel aksi (inline)
  const [statusOpen, setStatusOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<PengurusStatus>('Demisioner');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [jabatanOpen, setJabatanOpen] = useState(false);
  const [newJabatanId, setNewJabatanId] = useState('');
  const [pawOpen, setPawOpen] = useState(false);
  const [pawAksi, setPawAksi] = useState<PengurusPAWAksi>('DEMISIONER');
  const [pawKeterangan, setPawKeterangan] = useState('');
  const [mutasiOpen, setMutasiOpen] = useState(false);
  const [mutasiSKId, setMutasiSKId] = useState('');
  const [mutasiJabatanId, setMutasiJabatanId] = useState('');
  const [mutasiTanggal, setMutasiTanggal] = useState('');
  const [mutasiKeterangan, setMutasiKeterangan] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetPengurus(Number(id));
      setData(res);
      if (res.anggota?.foto_key) {
        presignView(res.anggota.foto_key).then((r) => setFotoUrl(r.view_url)).catch(() => setFotoUrl(null));
      } else {
        setFotoUrl(null);
      }
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat detail pengurus');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const pengurus = data?.pengurus;
  const anggota = data?.anggota;
  const canManage = canManagePengurusForLevel(user?.role, pengurus?.level);

  useEffect(() => {
    if (!canManage) return;
    void (async () => {
      try {
        const [jab, sk] = await Promise.all([adminListJabatan(false), adminListSK({ page: 1, limit: 100 })]);
        setJabatanAll(jab);
        setSkTargets(sk.data.filter((s) => s.status === 'Aktif' && s.approval_status !== 'DISETUJUI'));
      } catch {
        // dropdown tetap tampil bila list gagal
      }
    })();
  }, [canManage]);

  useEffect(() => {
    if (tab !== 'activity' || !anggota || activity.length > 0) return;
    setActivityLoading(true);
    adminAnggotaActivity(anggota.id)
      .then(setActivity)
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  }, [tab, anggota, activity.length]);

  async function run(fn: () => Promise<unknown>, sukses: () => void): Promise<void> {
    setBusy(true);
    setAksiError(null);
    try {
      await fn();
      sukses();
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Aksi gagal diproses');
    } finally {
      setBusy(false);
    }
  }

  async function lihatDokumen(key: string): Promise<void> {
    try {
      const res = await presignView(key);
      window.open(res.view_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal membuka dokumen');
    }
  }

  if (loading) return <Loading />;
  if (!pengurus) return <ErrorBox message={error ?? 'Data tidak ditemukan'} />;

  const wilayah = pengurus.level === 'NASIONAL'
    ? 'Nasional'
    : (pengurus.kabupaten_nama || pengurus.provinsi_nama || '-');

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin/pengurus" className="text-sm font-semibold text-kipan-blue hover:underline">← Kembali ke daftar pengurus</Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-kipan-navy to-kipan-blue p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {fotoUrl ? (
            <img src={fotoUrl} alt={pengurus.nama_lengkap} className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white/30 object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white/30 bg-white/10 text-2xl font-bold">
              {(pengurus.nama_lengkap || '?').charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-xs">{pengurus.nia}</span>
              <StatusBadge status={pengurus.status} />
              <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">{levelLabel(pengurus.level)}</span>
            </div>
            <h1 className="text-2xl font-bold">{pengurus.nama_lengkap}</h1>
            <p className="mt-1 text-sm text-white/80">
              {pengurus.jabatan}{pengurus.is_inti ? ' (inti)' : ''} · {wilayah}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/90">
              <span>SK: {pengurus.nomor_sk || '-'}</span>
              {anggota?.email && <span>✉ {anggota.email}</span>}
              {anggota?.whatsapp && <span>☎ {anggota.whatsapp}</span>}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline-navy" onClick={() => { setStatusOpen((v) => !v); setEditStatus(pengurus.status === 'Aktif' ? 'Demisioner' : 'Aktif'); setEditKeterangan(''); }}>Ubah Status</Button>
            <Button variant="outline-navy" onClick={() => { setJabatanOpen((v) => !v); setNewJabatanId(String(pengurus.jabatan_id)); }}>Ganti Jabatan</Button>
            {pengurus.status === 'Aktif' && (
              <>
                <Button variant="outline-navy" onClick={() => { setPawOpen((v) => !v); setPawAksi('DEMISIONER'); setPawKeterangan(''); }}>PAW</Button>
                <Button variant="outline-navy" onClick={() => { setMutasiOpen((v) => !v); setMutasiJabatanId(String(pengurus.jabatan_id)); setMutasiSKId(''); setMutasiTanggal(''); setMutasiKeterangan(''); }}>Mutasi</Button>
              </>
            )}
            {anggota && <Button variant="primary" onClick={() => setShowForm(true)}>Edit Biodata</Button>}
          </div>
        )}
      </div>

      {error && <div className="mt-4"><ErrorBox message={error} /></div>}
      {aksiError && <div className="mt-4"><Alert kind="error">{aksiError}</Alert></div>}

      {/* Panel aksi */}
      {canManage && (statusOpen || jabatanOpen || pawOpen || mutasiOpen) && (
        <Card className="mt-4">
          {statusOpen && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-kipan-text-dark">Ubah Status Pengurus</p>
              <SelectInput value={editStatus} onChange={(v) => setEditStatus(v as PengurusStatus)} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} placeholder="Pilih status" id="pd-status" />
              {editStatus !== 'Aktif' && <TextInput value={editKeterangan} onChange={setEditKeterangan} placeholder="Keterangan (wajib)" id="pd-status-ket" />}
              <div className="flex gap-2">
                <Button variant="primary" disabled={busy} onClick={() => void run(
                  () => {
                    if (editStatus !== 'Aktif' && !editKeterangan.trim()) return Promise.reject(new Error('Keterangan wajib diisi'));
                    return adminUpdatePengurusStatus(pengurus.id, editStatus, editKeterangan.trim());
                  },
                  () => setStatusOpen(false),
                )}>Simpan</Button>
                <Button variant="ghost" onClick={() => setStatusOpen(false)}>Batal</Button>
              </div>
            </div>
          )}
          {jabatanOpen && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-kipan-text-dark">Ganti Jabatan</p>
              <SelectInput value={newJabatanId} onChange={setNewJabatanId} options={jabatanAll.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))} placeholder="Pilih jabatan baru" id="pd-jab" />
              <div className="flex gap-2">
                <Button variant="primary" disabled={busy} onClick={() => void run(() => adminUpdatePengurusJabatan(pengurus.id, Number(newJabatanId)), () => setJabatanOpen(false))}>Simpan Jabatan</Button>
                <Button variant="ghost" onClick={() => setJabatanOpen(false)}>Batal</Button>
              </div>
            </div>
          )}
          {pawOpen && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-kipan-text-dark">Aksi PAW</p>
              <SelectInput value={pawAksi} onChange={(v) => setPawAksi(v as PengurusPAWAksi)} options={PAW_OPTIONS} placeholder="Pilih aksi" id="pd-paw" />
              <TextInput value={pawKeterangan} onChange={setPawKeterangan} placeholder="Keterangan (wajib)" id="pd-paw-ket" />
              <div className="flex gap-2">
                <Button variant="primary" disabled={busy} onClick={() => void run(
                  () => pawKeterangan.trim() ? adminPaws(pengurus.id, pawAksi, pawKeterangan.trim()) : Promise.reject(new Error('Keterangan wajib diisi')),
                  () => setPawOpen(false),
                )}>Proses PAW</Button>
                <Button variant="ghost" onClick={() => setPawOpen(false)}>Batal</Button>
              </div>
            </div>
          )}
          {mutasiOpen && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-kipan-text-dark">Mutasi ke SK Lain</p>
              <SelectInput value={mutasiSKId} onChange={setMutasiSKId} options={skTargets.filter((s) => s.id !== pengurus.surat_keputusan_id).map((s) => ({ value: String(s.id), label: `${s.nomor_sk} · ${s.judul}` }))} placeholder="Pilih SK tujuan" id="pd-mut-sk" />
              <SelectInput value={mutasiJabatanId} onChange={setMutasiJabatanId} options={jabatanAll.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))} placeholder="Pilih jabatan tujuan" id="pd-mut-jab" />
              <TextInput value={mutasiTanggal} onChange={setMutasiTanggal} placeholder="Tanggal mulai (YYYY-MM-DD, opsional)" id="pd-mut-tgl" />
              <TextInput value={mutasiKeterangan} onChange={setMutasiKeterangan} placeholder="Keterangan (opsional)" id="pd-mut-ket" />
              <div className="flex gap-2">
                <Button variant="primary" disabled={busy} onClick={() => void run(
                  () => {
                    if (!mutasiSKId || !mutasiJabatanId) return Promise.reject(new Error('SK tujuan & jabatan wajib dipilih'));
                    return adminMutasi(pengurus.id, { sk_id: Number(mutasiSKId), jabatan_id: Number(mutasiJabatanId), tanggal_mulai: mutasiTanggal || undefined, keterangan: mutasiKeterangan.trim() || undefined });
                  },
                  () => setMutasiOpen(false),
                )}>Proses Mutasi</Button>
                <Button variant="ghost" onClick={() => setMutasiOpen(false)}>Batal</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto border-b border-kipan-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab === t.key ? 'border-kipan-blue text-kipan-blue' : 'border-transparent text-kipan-text-muted hover:text-kipan-blue'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'profil' && (
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Biodata</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <InfoRow label="NIA" value={pengurus.nia} />
                <InfoRow label="Nama Lengkap" value={pengurus.nama_lengkap} />
                <InfoRow label="Tempat Lahir" value={anggota?.tempat_lahir} />
                <InfoRow label="Tanggal Lahir" value={formatTanggal(anggota?.tanggal_lahir)} />
                <InfoRow label="Jenis Kelamin" value={anggota ? (anggota.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan') : undefined} />
                <InfoRow label="Agama" value={anggota?.agama} />
                <InfoRow label="Pendidikan" value={anggota?.pendidikan} />
                <InfoRow label="Pekerjaan" value={anggota?.pekerjaan} />
                <InfoRow label="Angkatan" value={anggota?.angkatan} />
              </dl>
              <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Alamat</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2"><InfoRow label="Alamat" value={anggota?.alamat} /></div>
                <InfoRow label="Kecamatan" value={anggota?.kecamatan} />
                <InfoRow label="Desa/Kelurahan" value={anggota?.desa} />
                <InfoRow label="Kabupaten/Kota" value={anggota?.kabupaten_nama} />
                <InfoRow label="Provinsi" value={anggota?.provinsi_nama} />
                <InfoRow label="Kode Pos" value={anggota?.kode_pos} />
              </dl>
            </Card>
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Kontak</h2>
              <dl className="mt-4 grid gap-y-3 text-sm">
                <InfoRow label="Email" value={anggota?.email} />
                <InfoRow label="WhatsApp" value={anggota?.whatsapp} />
                <InfoRow label="Tanggal Daftar" value={formatTanggal(anggota?.tanggal_daftar)} />
                <InfoRow label="Tanggal Angkat" value={formatTanggal(anggota?.tanggal_angkat)} />
                <InfoRow label="Riwayat Kepengurusan" value={anggota?.riwayat} />
              </dl>
              {anggota && (
                <div className="mt-4">
                  <Link to={`/admin/anggota/${anggota.id}`} className="text-sm font-semibold text-kipan-blue hover:underline">
                    Lihat profil anggota lengkap →
                  </Link>
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'kepengurusan' && (
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Kepengurusan</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <InfoRow label="Level" value={levelLabel(pengurus.level)} />
              <InfoRow label="Wilayah" value={wilayah} />
              <InfoRow label="Jabatan" value={`${pengurus.jabatan}${pengurus.is_inti ? ' (inti)' : ''}`} />
              <InfoRow label="Status Jabatan" value={pengurus.status} />
              <InfoRow label="Nomor SK" value={<Link to={`/admin/sk/${pengurus.surat_keputusan_id}`} className="font-mono text-kipan-blue hover:underline">{pengurus.nomor_sk || '-'}</Link>} />
              <InfoRow label="Mulai Menjabat" value={formatTanggal(pengurus.tanggal_mulai)} />
              <InfoRow label="Berakhir" value={pengurus.tanggal_selesai ? formatTanggal(pengurus.tanggal_selesai) : (pengurus.sk_tanggal_berakhir ? `SK s/d ${formatTanggal(pengurus.sk_tanggal_berakhir)}` : 'Sampai sekarang')} />
            </dl>
            {pengurus.status !== 'Aktif' && pengurus.keterangan_status && (
              <div className="mt-4 rounded-lg border border-kipan-border bg-kipan-soft-gray p-3">
                <div className="text-xs text-kipan-text-muted">Keterangan / Alasan Status</div>
                <div className="text-sm font-medium text-kipan-text-dark">{pengurus.keterangan_status}</div>
              </div>
            )}
          </Card>
        )}

        {tab === 'riwayat' && (
          <Card>
            {(data?.riwayat ?? []).length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada riwayat kepengurusan.</p>
            ) : (
              <ol className="space-y-4">
                {(data?.riwayat ?? []).map((r) => (
                  <li key={r.id} className="flex items-start gap-3">
                    <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-violet-100" />
                    <div>
                      <div className="text-sm font-semibold text-kipan-text-dark">
                        {r.jabatan}{r.is_inti ? ' (inti)' : ''} · {levelLabel(r.level)}
                      </div>
                      <div className="text-xs text-kipan-text-muted">
                        {r.nomor_sk} · {formatTanggal(r.tanggal_mulai)} – {r.tanggal_selesai ? formatTanggal(r.tanggal_selesai) : 'sekarang'}
                      </div>
                      <div className="mt-0.5 text-xs">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}

        {tab === 'dokumen' && (
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Dokumen</h2>
            {!anggota ? (
              <p className="mt-3 text-sm text-kipan-text-muted">Data anggota tertaut tidak tersedia.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {DOC_FIELDS.map((d) => {
                  const key = anggota[d.field];
                  const ada = typeof key === 'string' && key !== '';
                  return (
                    <li key={d.field} className="flex items-center justify-between gap-3 rounded-lg border border-kipan-border px-3 py-2">
                      <span className="text-kipan-text-dark">{d.label}</span>
                      {ada ? (
                        <button type="button" onClick={() => void lihatDokumen(key as string)} className="font-semibold text-kipan-blue hover:underline">Lihat</button>
                      ) : (
                        <span className="text-xs text-kipan-text-muted">Belum diunggah</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        {tab === 'activity' && (
          <Card>
            {!anggota ? (
              <p className="text-sm text-kipan-text-muted">Data anggota tertaut tidak tersedia.</p>
            ) : activityLoading ? (
              <Loading />
            ) : activity.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada aktivitas.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 border-b border-kipan-border pb-2 text-sm">
                    <div>
                      <span className="mr-2 rounded bg-kipan-soft-blue px-2 py-0.5 text-xs font-bold text-kipan-navy">{a.action}</span>
                      <span className="text-kipan-text-dark">{a.actor_name} ({a.actor_role})</span>
                    </div>
                    <span className="shrink-0 text-xs text-kipan-text-muted">{new Date(a.created_at).toLocaleString('id-ID')}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'kartu' && (
          <div>
            <KtaCardPreview
              data={{
                nia: pengurus.nia,
                namaLengkap: pengurus.nama_lengkap,
                status: pengurus.status,
                tipe: pengurus.level === 'NASIONAL' ? 'PENGURUS NASIONAL' : 'PENGURUS',
                jabatan: `${pengurus.jabatan}${pengurus.is_inti ? ' (inti)' : ''}`,
                provinsiNama: pengurus.provinsi_nama,
                kabupatenNama: pengurus.kabupaten_nama,
                tanggalAngkat: pengurus.tanggal_mulai,
                email: anggota?.email,
                whatsapp: anggota?.whatsapp,
              }}
              fotoUrl={fotoUrl}
            />
          </div>
        )}
      </div>

      {anggota && (
        <AnggotaFormModal open={showForm} member={anggota} onClose={() => setShowForm(false)} onDone={load} />
      )}
    </div>
  );
}
