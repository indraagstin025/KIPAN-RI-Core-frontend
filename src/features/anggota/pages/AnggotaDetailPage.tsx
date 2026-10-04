import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Card, ErrorBox, Loading, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import PromotePengurusWizard from '@/features/kepengurusan/components/PromotePengurusWizard';
import { canPromotePengurus } from '@/features/kepengurusan/roles';
import { presignView } from '@/features/storage/api/storageService';
import type { ActivityLog } from '@/features/audit/types';
import { ApiError } from '@/services/apiClient';
import {
  adminAnggotaActivity,
  adminAnggotaRiwayat,
  adminDeactivateAnggota,
  adminGetAnggota,
  adminKtaUrl,
  resetMemberPassword,
} from '../api/anggotaService';
import AnggotaFormModal from '../components/AnggotaFormModal';
import type { AnggotaDetail, AnggotaRiwayatItem } from '../types';

const DOC_FIELDS: Array<{ field: keyof AnggotaDetail; label: string }> = [
  { field: 'foto_key', label: 'Pas Foto' },
  { field: 'ktp_key', label: 'KTP' },
  { field: 'cv_key', label: 'CV / Resume' },
  { field: 'surat_pernyataan_key', label: 'Surat Pernyataan' },
  { field: 'surat_sehat_key', label: 'Surat Sehat' },
];

type TabKey = 'kartu' | 'profil' | 'dokumen' | 'riwayat' | 'activity';
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'profil', label: 'Profil' },
  { key: 'dokumen', label: 'Dokumen' },
  { key: 'riwayat', label: 'Riwayat' },
  { key: 'activity', label: 'Activity' },
  { key: 'kartu', label: 'Kartu Anggota' },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-kipan-text-muted">{label}</div>
      <div className="text-sm font-medium text-kipan-text-dark">{value || '-'}</div>
    </div>
  );
}

export default function AnggotaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState<AnggotaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [unduh, setUnduh] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('profil');

  const [riwayat, setRiwayat] = useState<AnggotaRiwayatItem[]>([]);
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [riwayatError, setRiwayatError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await adminGetAnggota(Number(id));
      setItem(detail);
      setError(null);
      if (detail.foto_key) {
        presignView(detail.foto_key).then((r) => setFotoUrl(r.view_url)).catch(() => setFotoUrl(null));
      } else {
        setFotoUrl(null);
      }
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat detail anggota');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!item || tab !== 'riwayat' || riwayat.length > 0) return;
    setRiwayatLoading(true);
    setRiwayatError(null);
    adminAnggotaRiwayat(item.id)
      .then(setRiwayat)
      .catch((e: unknown) => setRiwayatError(e instanceof ApiError ? e.message : 'Gagal memuat riwayat'))
      .finally(() => setRiwayatLoading(false));
  }, [item, tab, riwayat.length]);

  useEffect(() => {
    if (!item || tab !== 'activity' || activity.length > 0) return;
    setActivityLoading(true);
    setActivityError(null);
    adminAnggotaActivity(item.id)
      .then(setActivity)
      .catch((e: unknown) => setActivityError(e instanceof ApiError ? e.message : 'Gagal memuat aktivitas'))
      .finally(() => setActivityLoading(false));
  }, [item, tab, activity.length]);

  async function lihatDokumen(key: string): Promise<void> {
    try {
      const res = await presignView(key);
      window.open(res.view_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal membuka dokumen');
    }
  }

  async function unduhKta(): Promise<void> {
    if (!item) return;
    setUnduh(true);
    try {
      const res = await adminKtaUrl(item.id);
      window.open(res.download_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Dokumen KTA belum tersedia');
    } finally {
      setUnduh(false);
    }
  }

  async function resetPassword(): Promise<void> {
    if (!item) return;
    if (!window.confirm('Reset password akun anggota ini? Tautan buat kata sandi akan dikirim ke email anggota dan seluruh sesi lama dihentikan.')) return;
    setResetting(true);
    setError(null);
    setResetMsg(null);
    try {
      await resetMemberPassword(item.id);
      setResetMsg('Tautan buat kata sandi telah dikirim ke email anggota melalui antrian (outbox).');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mereset password anggota');
    } finally {
      setResetting(false);
    }
  }

  async function nonaktifkan(): Promise<void> {
    if (!item) return;
    if (!window.confirm(`Nonaktifkan anggota ${item.nama_lengkap}?`)) return;
    try {
      await adminDeactivateAnggota(item.id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal menonaktifkan anggota');
    }
  }

  if (loading) return <Loading />;
  if (!item) return <ErrorBox message={error ?? 'Data tidak ditemukan'} />;

  const formatTanggal = (d?: string): string => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin/anggota" className="text-sm font-semibold text-kipan-blue hover:underline">← Kembali ke data anggota</Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-kipan-navy to-kipan-blue p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {fotoUrl ? (
            <img src={fotoUrl} alt={item.nama_lengkap} className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white/30 object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white/30 bg-white/10 text-2xl font-bold">{(item.nama_lengkap || '?').charAt(0)}</div>
          )}
          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-xs">{item.nia}</span>
              <StatusBadge status={item.status} />
              <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">{item.tipe}</span>
            </div>
            <h1 className="text-2xl font-bold">{item.nama_lengkap}</h1>
            <p className="mt-1 text-sm text-white/80">Anggota KIPAN</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/90">
              <span>📍 {item.kabupaten_nama || item.provinsi_nama || '-'}</span>
              <span>✉️ {item.email || '-'}</span>
              <span>📞 {item.whatsapp || '-'}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline-navy" onClick={() => void unduhKta()} disabled={unduh}>{unduh ? 'Menyiapkan...' : 'Unduh PDF KTA'}</Button>
          <Button variant="outline-navy" onClick={() => setShowForm(true)}>Edit</Button>
          {item.status !== 'NONAKTIF' && <Button variant="outline-navy" onClick={() => void nonaktifkan()}>Nonaktifkan</Button>}
          {item.user_id && (
            <Button variant="outline-navy" onClick={() => void resetPassword()} disabled={resetting}>{resetting ? 'Mereset...' : 'Reset Password'}</Button>
          )}
          {item.tipe === 'KADER' && canPromotePengurus(user?.role) && (
            <Button variant="primary" onClick={() => setShowWizard(true)}>Jadikan Pengurus</Button>
          )}
        </div>
      </div>

      {error && <div className="mt-4"><ErrorBox message={error} /></div>}
      {resetMsg && (
        <div className="mt-4 rounded-lg border border-kipan-green/40 bg-emerald-50 p-4 text-sm">
          <p className="font-bold text-kipan-green">Berhasil</p>
          <p className="mt-1 text-kipan-text-dark">{resetMsg}</p>
        </div>
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
                <InfoRow label="NIA" value={item.nia} />
                <InfoRow label="Nama Lengkap" value={item.nama_lengkap} />
                <InfoRow label="Tempat Lahir" value={item.tempat_lahir} />
                <InfoRow label="Tanggal Lahir" value={formatTanggal(item.tanggal_lahir)} />
                <InfoRow label="Jenis Kelamin" value={item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                <InfoRow label="Agama" value={item.agama} />
                <InfoRow label="Pendidikan" value={item.pendidikan} />
                <InfoRow label="Pekerjaan" value={item.pekerjaan} />
                <InfoRow label="Angkatan" value={item.angkatan} />
              </dl>
              <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Alamat</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2"><InfoRow label="Alamat" value={item.alamat} /></div>
                <InfoRow label="Kecamatan" value={item.kecamatan} />
                <InfoRow label="Desa/Kelurahan" value={item.desa} />
                <InfoRow label="Kabupaten/Kota" value={item.kabupaten_nama} />
                <InfoRow label="Provinsi" value={item.provinsi_nama} />
                <InfoRow label="Kode Pos" value={item.kode_pos} />
              </dl>
            </Card>
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Kontak & Keanggotaan</h2>
              <dl className="mt-4 grid gap-y-3 text-sm">
                <InfoRow label="Email" value={item.email} />
                <InfoRow label="WhatsApp" value={item.whatsapp} />
                <InfoRow label="Tanggal Daftar" value={formatTanggal(item.tanggal_daftar)} />
                <InfoRow label="Tanggal Angkat" value={formatTanggal(item.tanggal_angkat)} />
                <div>
                  <div className="text-xs text-kipan-text-muted">Riwayat Kepengurusan</div>
                  <div className="text-sm font-medium text-kipan-text-dark">{item.riwayat || '-'}</div>
                </div>
              </dl>
            </Card>
          </div>
        )}

        {tab === 'dokumen' && (
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Dokumen</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {DOC_FIELDS.map((d) => {
                const key = item[d.field];
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
          </Card>
        )}

        {tab === 'riwayat' && (
          <Card>
            {riwayatError && <ErrorBox message={riwayatError} />}
            {riwayatLoading ? (
              <Loading />
            ) : riwayat.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada riwayat.</p>
            ) : (
              <ol className="space-y-4">
                {riwayat.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 h-8 w-8 shrink-0 rounded-full ${r.sumber === 'KEPENGURUSAN' ? 'bg-violet-100' : 'bg-kipan-soft-blue'}`} />
                    <div>
                      <div className="text-sm font-semibold text-kipan-text-dark">{r.label}</div>
                      <div className="text-xs text-kipan-text-muted">{new Date(r.waktu).toLocaleString('id-ID')} · oleh {r.oleh}</div>
                      {r.keterangan && <div className="mt-0.5 text-xs text-kipan-text-dark">{r.keterangan}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}

        {tab === 'activity' && (
          <Card>
            {activityError && <ErrorBox message={activityError} />}
            {activityLoading ? (
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
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Kartu Anggota (KTA)</h2>
            <p className="mt-3 text-sm text-kipan-text-muted">Preview kartu sedang disiapkan. Sementara, gunakan tombol <b>Unduh PDF KTA</b> di atas.</p>
          </Card>
        )}
      </div>

      <PromotePengurusWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onDone={() => { setShowWizard(false); void load(); }}
        actorRole={user?.role}
        presetAnggota={item}
      />

      <AnggotaFormModal open={showForm} member={item} onClose={() => setShowForm(false)} onDone={load} />
    </div>
  );
}
