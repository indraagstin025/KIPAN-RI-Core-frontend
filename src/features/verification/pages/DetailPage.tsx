import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/fields';
import { Overlay, Spinner } from '@/components/ui/loading';
import { Card, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { presignView } from '@/features/storage/api/storageService';
import { ApiError } from '@/services/apiClient';
import { getDetail, processApproval, revealNik } from '../api/verificationService';
import type { ApprovalAction, PendaftaranDetail } from '../types';

const DOC_FIELDS: Array<{ field: keyof PendaftaranDetail; label: string }> = [
  { field: 'foto_key', label: 'Pas Foto' },
  { field: 'ktp_key', label: 'KTP' },
  { field: 'cv_key', label: 'CV / Resume' },
  { field: 'sk_key', label: 'Surat Keputusan (SK)' },
  { field: 'surat_pernyataan_key', label: 'Surat Pernyataan' },
  { field: 'surat_sehat_key', label: 'Surat Sehat' },
];

const ACTION_LABEL: Record<ApprovalAction, string> = {
  verifikasi: 'Verifikasi',
  perbaikan: 'Minta Perbaikan',
  tolak: 'Tolak',
  setujui: 'Setujui',
};

function actionsFor(status: string): ApprovalAction[] {
  switch (status) {
    case 'DRAFT':
      return ['verifikasi', 'tolak'];
    case 'PERBAIKAN':
      return ['verifikasi', 'tolak'];
    case 'DIVERIFIKASI':
      return ['perbaikan', 'tolak', 'setujui'];
    default:
      return [];
  }
}

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<PendaftaranDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [proses, setProses] = useState<ApprovalAction | null>(null);
  const [nik, setNik] = useState<string | null>(null);
  const [hasil, setHasil] = useState<{ nia?: string } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setItem(await getDetail(Number(id)));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat detail');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function lihatDokumen(key: string): Promise<void> {
    setError(null);
    try {
      const res = await presignView(key);
      window.open(res.view_url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal membuka dokumen');
    }
  }

  async function bukaNik(): Promise<void> {
    if (!item) return;
    setError(null);
    try {
      setNik((await revealNik(item.id)).nik);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal membuka NIK');
    }
  }

  async function jalankan(action: ApprovalAction): Promise<void> {
    if (!item) return;
    if ((action === 'perbaikan' || action === 'tolak') && !catatan.trim()) {
      setError('Catatan wajib diisi untuk aksi perbaikan/penolakan.');
      return;
    }
    setProses(action);
    setError(null);
    try {
      const res = await processApproval(item.id, action, catatan.trim());
      if (action === 'setujui') {
        setHasil({ nia: res.nia });
        setItem((p) => (p ? { ...p, status: 'DISETUJUI' } : p));
      } else {
        navigate('/admin/pendaftaran');
      }
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Aksi gagal diproses');
    } finally {
      setProses(null);
    }
  }

  if (loading) return <Loading />;
  if (!item) return <ErrorBox message={error ?? 'Data tidak ditemukan'} />;

  // Admin Provinsi hanya MELIHAT (verifikasi = wewenang Kab/Kota + Nasional/Super).
  const canVerify = user?.role !== 'ADMIN_PROVINSI';
  const actions = canVerify ? actionsFor(item.status) : [];

  return (
    <div>
      <PageHeader
        title={item.nama_lengkap}
        desc={`${item.nomor_pendaftaran} · Jalur ${item.tipe_pendaftaran}`}
        action={<StatusBadge status={item.status} />}
      />

      <div className="mb-4">
        <Link to="/admin/pendaftaran" className="text-sm font-semibold text-kipan-blue hover:underline">← Kembali ke antrean</Link>
      </div>

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      {hasil && (
        <div className="mb-4">
          <Alert kind="success">
            <p className="font-bold">Pendaftaran disetujui. NIA: {hasil.nia}</p>
            <p className="mt-2 text-sm">Tautan <b>buat kata sandi</b> telah dikirim ke email anggota melalui antrian (outbox).</p>
          </Alert>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Data Diri</h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Row label="NIK">
              {nik ? (
                <span className="font-mono font-semibold">{nik}</span>
              ) : (
                <button type="button" onClick={() => void bukaNik()} className="font-semibold text-kipan-blue hover:underline">
                  Buka NIK (tercatat audit)
                </button>
              )}
            </Row>
            <Row label="Tempat, Tanggal Lahir">{item.tempat_lahir}, {new Date(item.tanggal_lahir).toLocaleDateString('id-ID')}</Row>
            <Row label="Jenis Kelamin">{item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</Row>
            <Row label="Agama">{item.agama}</Row>
            <Row label="Pendidikan">{item.pendidikan}</Row>
            <Row label="Pekerjaan">{item.pekerjaan}</Row>
            <Row label="Alamat" className="sm:col-span-2">{item.alamat}, {item.kecamatan}, {item.desa} {item.kode_pos}</Row>
            {item.provinsi_nama && <Row label="Provinsi">{item.provinsi_nama}</Row>}
            {item.kabupaten_nama && <Row label="Kabupaten/Kota">{item.kabupaten_nama}</Row>}
            <Row label="Email">{item.email}</Row>
            <Row label="WhatsApp">{item.whatsapp}</Row>
            <Row label="Motivasi" className="sm:col-span-2">{item.motivasi}</Row>
            {item.status_pribadi && <Row label="Status Pribadi">{item.status_pribadi}</Row>}
            {item.persyaratan_checklist && <ChecklistRow raw={item.persyaratan_checklist} />}
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Dokumen</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {DOC_FIELDS.map((d) => {
              const key = item[d.field];
              const ada = typeof key === 'string' && key !== '';
              return (
                <li key={d.field} className="flex items-center justify-between gap-3">
                  <span className="text-kipan-text-dark">{d.label}</span>
                  {ada ? (
                    <button type="button" onClick={() => void lihatDokumen(key as string)} className="font-semibold text-kipan-blue hover:underline">
                      Lihat
                    </button>
                  ) : (
                    <span className="text-xs text-kipan-text-muted">— tidak ada</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {actions.length > 0 && (
        <Card className="mt-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Aksi Verifikasi</h2>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan (wajib untuk perbaikan/penolakan)"
            rows={3}
            className="mt-3 w-full rounded-lg border border-kipan-border px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {actions.map((a) => (
              <button
                key={a}
                type="button"
                disabled={proses !== null}
                onClick={() => void jalankan(a)}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                  a === 'setujui' ? 'bg-kipan-green hover:brightness-95' : a === 'tolak' ? 'bg-kipan-red hover:brightness-95' : 'bg-kipan-blue hover:bg-kipan-navy'
                }`}
              >
                {proses === a ? (<><Spinner size={14} light /> Memproses...</>) : ACTION_LABEL[a]}
              </button>
            ))}
          </div>
        </Card>
      )}
      {!canVerify && (
        <Card className="mt-5">
          <Alert kind="info">
            Mode lihat saja. Verifikasi pendaftaran adalah wewenang Admin Kabupaten/Kota (dan Nasional/Super).
          </Alert>
        </Card>
      )}
      {proses !== null && <Overlay label="Memproses verifikasi... mohon tunggu." />}
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

function parseChecklist(raw: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  } catch {
    return null;
  }
}

function ChecklistRow({ raw }: { raw: string }) {
  const items = parseChecklist(raw);
  return (
    <div className="sm:col-span-2">
      <dt className="text-kipan-text-muted">Checklist Persyaratan</dt>
      <dd className="font-semibold text-kipan-text-dark">
        {items === null || items.length === 0 ? (
          <span className="font-normal text-kipan-text-muted">—</span>
        ) : (
          <ul className="mt-1 list-inside list-disc space-y-0.5 font-normal">
            {items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}
