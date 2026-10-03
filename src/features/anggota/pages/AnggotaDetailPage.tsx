import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Card, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { useAuth } from '@/context/AuthContext';
import PromotePengurusWizard from '@/features/kepengurusan/components/PromotePengurusWizard';
import { canPromotePengurus } from '@/features/kepengurusan/roles';
import { presignView } from '@/features/storage/api/storageService';
import { ApiError } from '@/services/apiClient';
import { adminGetAnggota, adminKtaUrl, resetMemberPassword } from '../api/anggotaService';
import type { AnggotaDetail } from '../types';

const DOC_FIELDS: Array<{ field: keyof AnggotaDetail; label: string }> = [
  { field: 'foto_key', label: 'Pas Foto' },
  { field: 'ktp_key', label: 'KTP' },
  { field: 'cv_key', label: 'CV / Resume' },
  { field: 'sk_key', label: 'Surat Keputusan (SK)' },
  { field: 'surat_pernyataan_key', label: 'Surat Pernyataan' },
  { field: 'surat_sehat_key', label: 'Surat Sehat' },
];

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

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setItem(await adminGetAnggota(Number(id)));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat detail anggota');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (loading) return <Loading />;
  if (!item) return <ErrorBox message={error ?? 'Data tidak ditemukan'} />;

  return (
    <div>
      <PageHeader
        title={item.nama_lengkap}
        desc={`${item.nia} · ${item.tipe}`}
        action={(
          <div className="flex items-center gap-3">
            <StatusBadge status={item.status} />
            {item.tipe === 'KADER' && canPromotePengurus(user?.role) && (
              <Button variant="primary" onClick={() => setShowWizard(true)}>Jadikan Pengurus</Button>
            )}
          </div>
        )}
      />
      <div className="mb-4">
        <Link to="/admin/anggota" className="text-sm font-semibold text-kipan-blue hover:underline">← Kembali ke data anggota</Link>
      </div>
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      {resetMsg && (
        <div className="mb-4 rounded-lg border border-kipan-green/40 bg-emerald-50 p-4 text-sm">
          <p className="font-bold text-kipan-green">Berhasil</p>
          <p className="mt-1 text-kipan-text-dark">{resetMsg}</p>
          <p className="mt-2 text-xs text-kipan-text-muted">Seluruh sesi lama anggota sudah dicabut. Aksi ini tercatat di audit.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Profil Anggota</h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Row label="Tempat, Tanggal Lahir">{item.tempat_lahir}, {new Date(item.tanggal_lahir).toLocaleDateString('id-ID')}</Row>
            <Row label="Jenis Kelamin">{item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</Row>
            <Row label="Agama">{item.agama}</Row>
            <Row label="Pendidikan">{item.pendidikan}</Row>
            <Row label="Pekerjaan">{item.pekerjaan}</Row>
            <Row label="Angkatan">{item.angkatan}</Row>
            <Row label="Alamat" className="sm:col-span-2">{item.alamat}, {item.kecamatan}, {item.desa} {item.kode_pos}</Row>
            <Row label="Email">{item.email}</Row>
            <Row label="WhatsApp">{item.whatsapp}</Row>
            <Row label="Tanggal Angkat">{new Date(item.tanggal_angkat).toLocaleDateString('id-ID')}</Row>
          </dl>
        </Card>
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Dokumen</h2>
          <button
            type="button"
            onClick={() => void unduhKta()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-kipan-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-kipan-blue"
          >
            {unduh ? (<><Spinner size={14} light /> Menyiapkan...</>) : 'Unduh PDF KTA'}
          </button>
          {item.user_id && (
            <button
              type="button"
              onClick={() => void resetPassword()}
              disabled={resetting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-kipan-red/40 px-4 py-2.5 text-sm font-semibold text-kipan-red hover:bg-red-50 disabled:opacity-60"
            >
              {resetting ? (<><Spinner size={14} /> Mereset...</>) : 'Reset Password Akun'}
            </button>
          )}
          <ul className="mt-4 space-y-2 text-sm">
            {DOC_FIELDS.map((d) => {
              const key = item[d.field];
              const ada = typeof key === 'string' && key !== '';
              return (
                <li key={d.field} className="flex items-center justify-between gap-3">
                  <span className="text-kipan-text-dark">{d.label}</span>
                  {ada ? (
                    <button type="button" onClick={() => void lihatDokumen(key as string)} className="font-semibold text-kipan-blue hover:underline">Lihat</button>
                  ) : (
                    <span className="text-xs text-kipan-text-muted">—</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <PromotePengurusWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onDone={() => { setShowWizard(false); void load(); }}
        actorRole={user?.role}
        presetAnggota={item}
      />
    </div>
  );
}

function Row({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-kipan-text-muted">{label}</dt>
      <dd className="font-semibold text-kipan-text-dark">{children}</dd>
    </div>
  );
}
