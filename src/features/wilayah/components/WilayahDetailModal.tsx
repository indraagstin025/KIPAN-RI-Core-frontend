import { Skeleton } from '@/components/ui/loading';
import { Modal } from '@/components/ui/modal';
import { Card, ErrorBox, StatusBadge } from '@/components/ui/stateful';
import type { DetailTab, WilayahDetailApi } from '../hooks/useWilayahDetail';

const TABS: DetailTab[] = ['info', 'pengurus', 'statistik', 'activity'];

export default function WilayahDetailModal({ detail }: { detail: WilayahDetailApi }) {
  const {
    detail: d, detailLoading, detailTab, setDetailTab,
    pengurusList, pengurusAll, setPengurusAll, pengurusLoading, pengurusError,
    tutupDetail,
  } = detail;

  if (!detailLoading && !d) return null;

  return (
    <Modal title={d ? `${d.nama} (${d.kode})` : 'Memuat detail...'} onClose={tutupDetail}>
      {detailLoading || !d ? (
        <div className="space-y-3" aria-busy="true" role="status" aria-label="Memuat detail wilayah">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDetailTab(t)}
                aria-pressed={detailTab === t}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${detailTab === t ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy'}`}
              >
                {t === 'activity' ? 'Activity' : t}
              </button>
            ))}
          </div>

          {detailTab === 'info' && (
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-kipan-text-muted">Tipe</dt><dd className="font-semibold capitalize">{d.type}</dd></div>
              <div><dt className="text-kipan-text-muted">Kode</dt><dd className="font-semibold">{d.kode}</dd></div>
              {d.provinsi_nama && <div><dt className="text-kipan-text-muted">Provinsi</dt><dd className="font-semibold">{d.provinsi_nama}</dd></div>}
              <div><dt className="text-kipan-text-muted">Status</dt><dd><StatusBadge status={d.is_active ? 'Aktif' : 'Nonaktif'} /></dd></div>
            </dl>
          )}

          {detailTab === 'pengurus' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-kipan-text-muted">Daftar pengurus wilayah ini.</p>
                <label className="flex items-center gap-2 text-xs font-semibold text-kipan-text-dark">
                  <input type="checkbox" checked={pengurusAll} onChange={(e) => setPengurusAll(e.target.checked)} className="h-4 w-4 accent-kipan-navy" />
                  Tampilkan non-aktif
                </label>
              </div>
              {pengurusError && <div className="mb-3"><ErrorBox message={pengurusError} /></div>}
              {pengurusLoading ? (
                <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24 w-full" /></div>
              ) : pengurusList.length === 0 ? (
                <p className="text-sm text-kipan-text-muted">Belum ada pengurus.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-kipan-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
                      <tr><th className="px-4 py-2">NIA</th><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Jabatan</th><th className="px-4 py-2">Status</th></tr>
                    </thead>
                    <tbody>
                      {pengurusList.map((p) => (
                        <tr key={p.id} className="border-t border-kipan-border">
                          <td className="px-4 py-2 font-mono text-xs text-kipan-navy">{p.nia}</td>
                          <td className="px-4 py-2 font-semibold text-kipan-text-dark">{p.nama_lengkap}</td>
                          <td className="px-4 py-2 text-kipan-text-muted">{p.jabatan}</td>
                          <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {detailTab === 'statistik' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card><p className="text-xs text-kipan-text-muted">Total Pengurus</p><p className="text-xl font-bold">{d.statistik.total_pengurus}</p></Card>
                <Card><p className="text-xs text-kipan-text-muted">Pengurus Aktif</p><p className="text-xl font-bold">{d.statistik.pengurus_aktif}</p></Card>
                <Card><p className="text-xs text-kipan-text-muted">Total Kab/Kota</p><p className="text-xl font-bold">{d.statistik.total_kabupaten}</p></Card>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-kipan-text-dark">Tren Pengurus (6 bulan)</p>
                {d.statistik.tren.length === 0 ? (
                  <p className="text-xs text-kipan-text-muted">Belum ada data tren.</p>
                ) : (
                  <div className="flex items-end gap-3">
                    {d.statistik.tren.map((t) => (
                      <div key={t.bulan} className="flex flex-1 flex-col items-center">
                        <span className="text-xs font-semibold text-kipan-text-dark">{t.jumlah}</span>
                        <span className="w-full rounded-t bg-kipan-blue" style={{ height: `${Math.min(t.jumlah * 8 + 4, 80)}px` }} />
                        <span className="mt-1 text-[10px] text-kipan-text-muted">{t.bulan}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {detailTab === 'activity' && (
            d.activity.length === 0 ? (
              <p className="text-sm text-kipan-text-muted">Belum ada aktivitas.</p>
            ) : (
              <ul className="divide-y divide-kipan-border">
                {d.activity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="text-kipan-text-dark"><span className="font-semibold">{a.actor_name}</span> · {a.action}</span>
                    <span className="text-xs text-kipan-text-muted">{new Date(a.created_at).toLocaleString('id-ID')}</span>
                  </li>
                ))}
              </ul>
            )
          )}
        </>
      )}
    </Modal>
  );
}
