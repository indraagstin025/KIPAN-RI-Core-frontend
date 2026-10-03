import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/apiClient';
import { checkHealth } from '@/features/system/api/systemService';
import { getDashboard } from '../api/dashboardService';
import type { DashboardData } from '../types';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draf',
  DIAJUKAN: 'Diajukan',
  DIVERIFIKASI: 'Diverifikasi',
  PERBAIKAN: 'Perbaikan',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
  KEDALUWARSA: 'Kedaluwarsa',
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-kipan-border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-kipan-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-kipan-text-dark">{value}</p>
      {sub && <p className="mt-1 text-xs text-kipan-text-muted">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="truncate pr-2 text-kipan-text-dark">{label}</span>
        <span className="font-semibold text-kipan-text-muted">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-kipan-soft-gray">
        <div className="h-full rounded-full bg-kipan-blue" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState('memeriksa...');

  useEffect(() => {
    void (async () => {
      try {
        setData(await getDashboard());
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : 'Gagal memuat dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const h = await checkHealth();
        setHealth(h.status === 'ok' ? 'Online' : h.status);
      } catch {
        setHealth('Tidak dapat dijangkau');
      }
    })();
  }, []);

  if (loading) return <Loading label="Memuat dashboard..." />;
  if (!data) return <ErrorBox message={error ?? 'Data dashboard tidak tersedia'} />;

  const s = data.summary;
  const isNasional = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const isProvinsiOrAbove = isNasional || user?.role === 'ADMIN_PROVINSI';
  const maxTrend = Math.max(1, ...data.trend.map((t) => t.jumlah));
  const maxWilayah = Math.max(1, ...data.wilayah_distribusi.map((w) => w.jumlah));

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${user?.name ?? 'Admin'}`}
        desc="Ringkasan keanggotaan dan antrean verifikasi sesuai cakupan wilayah Anda."
      />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      {/* Kartu statistik utama */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Anggota" value={s.total_anggota} sub={`${s.anggota_aktif} aktif`} />
        <StatCard label="Anggota Aktif" value={s.anggota_aktif} />
        <StatCard label="Menunggu Verifikasi" value={s.menunggu_verifikasi} sub="Perlu tindakan" />
        <StatCard label="Anggota Baru Bulan Ini" value={s.anggota_baru_bulan_ini} />
      </div>

      {/* Kartu wilayah + pengurus */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Pengurus" value={s.total_pengurus} />
        {isNasional && <StatCard label="Provinsi Terdaftar" value={`${s.total_provinsi}`} sub="dari 38 provinsi" />}
        {isProvinsiOrAbove && <StatCard label="Kabupaten/Kota" value={`${s.total_kabupaten}`} sub="dari 514 kab/kota" />}
        <StatCard label="Status Layanan" value={health} />
      </div>

      {/* Aksi cepat */}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/admin/pendaftaran" className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">
          Antrean Pendaftaran {s.menunggu_verifikasi > 0 ? `(${s.menunggu_verifikasi})` : ''}
        </Link>
        <Link to="/admin/anggota" className="rounded-lg border border-kipan-border bg-white px-5 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-gray">Data Anggota</Link>
        <Link to="/admin/sk" className="rounded-lg border border-kipan-border bg-white px-5 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-gray">Surat Keputusan</Link>
        <Link to="/admin/pengurus" className="rounded-lg border border-kipan-border bg-white px-5 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-gray">Pengurus</Link>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Distribusi pendaftaran per status */}
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Pendaftaran per Status</h2>
          <div className="mt-4 space-y-3">
            {data.pendaftaran_by_status.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada pendaftaran.</p>
            ) : (
              data.pendaftaran_by_status.map((row) => (
                <Bar key={row.status} label={STATUS_LABEL[row.status] ?? row.status} value={row.jumlah} max={Math.max(1, ...data.pendaftaran_by_status.map((r) => r.jumlah))} />
              ))
            )}
          </div>
        </Card>

        {/* Tren bulanan */}
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Tren Pendaftaran (7 Bulan)</h2>
          <div className="mt-4 space-y-3">
            {data.trend.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada data tren.</p>
            ) : (
              data.trend.map((row) => <Bar key={row.bulan} label={row.bulan} value={row.jumlah} max={maxTrend} />)
            )}
          </div>
        </Card>

        {/* Distribusi wilayah */}
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Distribusi Anggota — {data.wilayah_label}</h2>
          <div className="mt-4 space-y-3">
            {data.wilayah_distribusi.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada anggota.</p>
            ) : (
              data.wilayah_distribusi.map((row) => <Bar key={row.nama} label={row.nama} value={row.jumlah} max={maxWilayah} />)
            )}
          </div>
        </Card>

        {/* Pendaftaran terbaru */}
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Pendaftaran Terbaru</h2>
          {data.recent.length === 0 ? (
            <p className="mt-4 text-sm text-kipan-text-muted">Belum ada pendaftaran.</p>
          ) : (
            <ul className="mt-3 divide-y divide-kipan-border">
              {data.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-kipan-text-dark">{r.nama}</p>
                    <p className="text-xs text-kipan-text-muted">
                      {r.kabupaten ?? '-'} · {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={r.status} label={STATUS_LABEL[r.status] ?? r.status} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link to="/admin/pendaftaran" className="text-sm font-semibold text-kipan-blue hover:underline">Lihat semua antrean →</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
