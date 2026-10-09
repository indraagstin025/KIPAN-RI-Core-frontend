import { useEffect, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChartIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClipboardIcon,
  ClockIcon,
  FileTextIcon,
  GlobeIcon,
  GroupIcon,
  HomeIcon,
  InfoCircledIcon,
  PersonIcon,
  PieChartIcon,
} from '@radix-ui/react-icons';
import { ErrorBox, Loading, PageHeader, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/apiClient';
import { checkHealth } from '@/features/system/api/systemService';
import { getDashboard } from '../api/dashboardService';
import { initials, pct, shortBulan, trendPoints } from '../lib/statFormat';
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

// Total wilayah Indonesia (cermin subsistem yang dipakai halaman ini).
const TOTAL_PROVINSI = 38;
const TOTAL_KAB = 514;

type IconType = ComponentType<{ className?: string }>;

const PILL_TONE: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-kipan-soft-blue text-kipan-blue',
  amber: 'bg-amber-100 text-amber-700',
};

function StatCard({ icon: Icon, label, value, sub, pill, pillTone = 'blue' }: {
  icon: IconType; label: string; value: number | string; sub?: string; pill?: string; pillTone?: keyof typeof PILL_TONE;
}) {
  return (
    <div className="rounded-xl border border-kipan-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-kipan-soft-blue text-kipan-blue">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="truncate text-sm font-semibold text-kipan-text-dark">{label}</p>
        </div>
        {pill && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${PILL_TONE[pillTone]}`}>{pill}</span>}
      </div>
      <p className="mt-3 text-3xl font-extrabold text-kipan-text-dark">{value}</p>
      {sub && <p className="mt-1 text-xs text-kipan-text-muted">{sub}</p>}
    </div>
  );
}

function PanelTitle({ icon: Icon, title, action }: { icon: IconType; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kipan-soft-blue text-kipan-blue">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="truncate text-sm font-bold text-kipan-text-dark">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const p = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate pr-2 text-kipan-text-dark">{label}</span>
        <span className="shrink-0 font-semibold text-kipan-text-muted">{value} ({p}%)</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-kipan-soft-gray">
        <div className="h-full rounded-full bg-kipan-blue" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function TrendChart({ values, labels }: { values: number[]; labels: string[] }) {
  const W = 420;
  const H = 170;
  const padL = 26;
  const padB = 24;
  const padT = 16;
  const { points, yMax } = trendPoints(values, W, H, padL, padB, padT);
  const step = yMax > 20 ? 10 : yMax > 10 ? 5 : 2;
  const gridlines: Array<{ v: number; y: number }> = [];
  for (let v = 0; v <= yMax; v += step) {
    gridlines.push({ v, y: padT + (H - padT - padB) - (v / yMax) * (H - padT - padB) });
  }
  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik tren pendaftaran">
      {gridlines.map((g) => (
        <g key={g.v}>
          <line x1={padL} x2={W - 8} y1={g.y} y2={g.y} stroke="#e5e7eb" strokeWidth="1" />
          <text x={padL - 5} y={g.y + 3.5} textAnchor="end" fontSize="9" fill="#667085">{g.v}</text>
        </g>
      ))}
      {points.length > 1 && (
        <polyline points={line} fill="none" stroke="#0e6cac" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#0e6cac" stroke="#fff" strokeWidth="1.5" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#172033">{values[i]}</text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#667085">{labels[i]}</text>
      ))}
    </svg>
  );
}

const AVATAR_TONE = ['bg-kipan-navy text-white', 'bg-kipan-blue text-white', 'bg-kipan-green text-white', 'bg-kipan-soft-blue text-kipan-navy'];

function avatarTone(nama: string): string {
  let h = 0;
  for (const ch of nama) h = (h + ch.charCodeAt(0)) % 997;
  return AVATAR_TONE[h % AVATAR_TONE.length];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState('memeriksa...');
  const [rentang, setRentang] = useState<3 | 7>(7);
  const [sekarang, setSekarang] = useState(() => new Date());

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

  // Jam kartu tanggal (mockup): segarkan tiap 30 detik.
  useEffect(() => {
    const t = window.setInterval(() => setSekarang(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  if (loading) return <Loading label="Memuat dashboard..." />;
  if (!data) return <ErrorBox message={error ?? 'Data dashboard tidak tersedia'} />;

  const s = data.summary;
  const isNasional = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const isProvinsiOrAbove = isNasional || user?.role === 'ADMIN_PROVINSI';
  const online = health === 'Online';
  const maxWilayah = Math.max(1, ...data.wilayah_distribusi.map((w) => w.jumlah));
  const tren = data.trend.slice(-rentang);
  const totalStatus = data.pendaftaran_by_status.reduce((a, r) => a + r.jumlah, 0);
  const tanggalStr = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(sekarang);
  const jamStr = `${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(sekarang).replace(':', '.')} WIB`;

  return (
    // Skala konten dashboard 90% dari shell (total ~81%): kartu terasa
    // padat tanpa mengecilkan sidebar/navbar. Inline style (bukan utilitas)
    // karena Tailwind tak punya utilitas zoom.
    <div style={{ zoom: 0.9 }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="border-l-4 border-kipan-yellow pl-4">
          <PageHeader
            title={`Selamat datang, ${user?.name ?? 'Admin'}`}
            desc="Ringkasan keanggotaan dan antrean verifikasi sesuai cakupan wilayah Anda."
          />
        </div>
        <div className="hidden items-center gap-2.5 rounded-xl border border-kipan-border bg-white px-4 py-2.5 shadow-sm md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kipan-soft-blue text-kipan-blue">
            <CalendarIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-bold text-kipan-text-dark">{tanggalStr}</span>
            <span className="block text-[11px] text-kipan-text-muted">{jamStr}</span>
          </span>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      {/* Kartu statistik utama */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={PersonIcon} label="Total Anggota" value={s.total_anggota} sub={`${s.total_anggota} anggota terdaftar`} />
        <StatCard icon={CheckCircledIcon} label="Anggota Aktif" value={s.anggota_aktif} pill={`${pct(s.anggota_aktif, s.total_anggota)}%`} pillTone="green" sub="dari total" />
        <StatCard icon={ClockIcon} label="Menunggu Verifikasi" value={s.menunggu_verifikasi} sub="Perlu tindakan" />
        <StatCard icon={CalendarIcon} label="Anggota Baru Bulan Ini" value={s.anggota_baru_bulan_ini} sub="Pendaftaran bulan ini" />
      </div>

      {/* Kartu wilayah + pengurus */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={GroupIcon} label="Total Pengurus" value={s.total_pengurus} sub={s.total_pengurus === 0 ? 'Belum ada data pengurus' : undefined} />
        {isNasional && <StatCard icon={GlobeIcon} label="Provinsi Terdaftar" value={s.total_provinsi} pill={`${pct(s.total_provinsi, TOTAL_PROVINSI)}%`} pillTone="blue" sub="terdaftar" />}
        {isProvinsiOrAbove && <StatCard icon={HomeIcon} label="Kabupaten/Kota" value={s.total_kabupaten} pill={`${pct(s.total_kabupaten, TOTAL_KAB)}%`} pillTone="blue" sub="terdaftar" />}
        <StatCard
          icon={InfoCircledIcon}
          label="Status Layanan"
          value={online ? 'Online' : health}
          sub={online ? 'Sistem berjalan normal' : undefined}
        />
      </div>

      {/* Aksi cepat */}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/admin/pendaftaran" className="inline-flex items-center gap-2 rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">
          <ClipboardIcon className="h-4 w-4" aria-hidden="true" /> Antrean Pendaftaran {s.menunggu_verifikasi > 0 ? `(${s.menunggu_verifikasi})` : ''}
        </Link>
        <Link to="/admin/anggota" className="inline-flex items-center gap-2 rounded-lg border border-kipan-border bg-white px-5 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-gray">
          <PersonIcon className="h-4 w-4" aria-hidden="true" /> Data Anggota
        </Link>
        <Link to="/admin/sk" className="inline-flex items-center gap-2 rounded-lg border border-kipan-border bg-white px-5 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-gray">
          <FileTextIcon className="h-4 w-4" aria-hidden="true" /> Surat Keputusan
        </Link>
        <Link to="/admin/pengurus" className="inline-flex items-center gap-2 rounded-lg border border-kipan-border bg-white px-5 py-2.5 text-sm font-semibold text-kipan-navy hover:bg-kipan-soft-gray">
          <GroupIcon className="h-4 w-4" aria-hidden="true" /> Pengurus
        </Link>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 3xl:grid-cols-4">
        {/* Distribusi pendaftaran per status */}
        <div className="rounded-xl border border-kipan-border bg-white p-5 shadow-sm">
          <PanelTitle icon={BarChartIcon} title="Pendaftaran per Status" />
          <div className="space-y-3">
            {data.pendaftaran_by_status.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada pendaftaran.</p>
            ) : (
              data.pendaftaran_by_status.map((row) => (
                <Bar key={row.status} label={STATUS_LABEL[row.status] ?? row.status} value={row.jumlah} max={Math.max(1, ...data.pendaftaran_by_status.map((r) => r.jumlah))} />
              ))
            )}
          </div>
          <p className="mt-3 text-right text-[11px] text-kipan-text-muted">Total {totalStatus} pendaftaran</p>
        </div>

        {/* Tren bulanan */}
        <div className="rounded-xl border border-kipan-border bg-white p-5 shadow-sm">
          <PanelTitle
            icon={PieChartIcon}
            title={`Tren Pendaftaran (${rentang} Bulan)`}
            action={(
              <select
                value={rentang}
                onChange={(e) => setRentang(Number(e.target.value) === 3 ? 3 : 7)}
                aria-label="Rentang tren"
                className="rounded-lg border border-kipan-border bg-white px-2.5 py-1.5 text-xs font-semibold text-kipan-text-dark"
              >
                <option value={7}>7 bulan terakhir</option>
                <option value={3}>3 bulan terakhir</option>
              </select>
            )}
          />
          {tren.length === 0 ? (
            <p className="text-sm text-kipan-text-muted">Belum ada data tren.</p>
          ) : (
            <TrendChart values={tren.map((t) => t.jumlah)} labels={tren.map((t) => shortBulan(t.bulan))} />
          )}
        </div>

        {/* Distribusi wilayah */}
        <div className="rounded-xl border border-kipan-border bg-white p-5 shadow-sm">
          <PanelTitle icon={GlobeIcon} title={`Distribusi Anggota — ${data.wilayah_label}`} />
          <div className="space-y-3">
            {data.wilayah_distribusi.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada anggota.</p>
            ) : (
              data.wilayah_distribusi.map((row, i) => (
                <div key={row.nama}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate pr-2 text-kipan-text-dark"><span className="mr-1.5 font-bold text-kipan-text-muted">{i + 1}.</span>{row.nama}</span>
                    <span className="shrink-0 font-semibold text-kipan-text-muted">{row.jumlah}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-kipan-soft-gray">
                    <div className="h-full rounded-full bg-kipan-blue" style={{ width: `${maxWilayah > 0 ? Math.round((row.jumlah / maxWilayah) * 100) : 0}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pendaftaran terbaru */}
        <div className="rounded-xl border border-kipan-border bg-white p-5 shadow-sm">
          <PanelTitle
            icon={ClipboardIcon}
            title="Pendaftaran Terbaru"
            action={(
              <Link to="/admin/pendaftaran" className="rounded-lg border border-kipan-border px-2.5 py-1.5 text-xs font-semibold text-kipan-blue hover:underline">Lihat Semua →</Link>
            )}
          />
          {data.recent.length === 0 ? (
            <p className="text-sm text-kipan-text-muted">Belum ada pendaftaran.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-kipan-text-muted">
                    <th className="py-2 pr-3 font-semibold">Nama</th>
                    <th className="py-2 pr-3 font-semibold">Tanggal</th>
                    <th className="py-2 pr-3 font-semibold">Lokasi</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2" aria-label="Buka" />
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.id} className="border-t border-kipan-border">
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarTone(r.nama)}`} aria-hidden="true">
                            {initials(r.nama)}
                          </span>
                          <span className="truncate font-semibold text-kipan-text-dark">{r.nama}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-kipan-text-muted">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="max-w-[140px] truncate py-2.5 pr-3 text-xs text-kipan-text-muted">{r.kabupaten ?? '-'}</td>
                      <td className="py-2.5 pr-3"><StatusBadge status={r.status} label={STATUS_LABEL[r.status] ?? r.status} /></td>
                      <td className="py-2.5 text-right">
                        <Link to={`/admin/pendaftaran/${r.id}`} aria-label={`Periksa ${r.nama}`} className="font-bold text-kipan-blue hover:underline">›</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
