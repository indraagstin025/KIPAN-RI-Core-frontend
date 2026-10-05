import Button from '@/components/ui/button';
import { TextInput } from '@/components/ui/fields';
import { Skeleton, Spinner } from '@/components/ui/loading';
import { EmptyState, ErrorBox, Pagination, StatusBadge } from '@/components/ui/stateful';
import type { WilayahAdminApi } from '../hooks/useWilayahAdmin';
import type { WilayahAdminItem, WilayahType } from '../types';

const PAGE_SIZE = 25;
const SKELETON_ROWS = 8;

export default function WilayahTabel({ admin, onDetail }: {
  admin: WilayahAdminApi;
  onDetail: (it: WilayahAdminItem) => void;
}) {
  const {
    type, gantiType, search, setSearch, status, setStatus, provFilter, setProvFilter,
    items, page, setPage, total, totalPages, loading, error,
    togglingId, toggleStatus, load, provinsiMaster,
  } = admin;

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['provinsi', 'kabupaten'] as WilayahType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => gantiType(t)}
            aria-pressed={type === t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === t ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy hover:bg-kipan-soft-gray'}`}
          >
            {t === 'provinsi' ? 'Provinsi' : 'Kabupaten/Kota'}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="mb-4 flex flex-wrap items-center gap-3">
        <TextInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari kode atau nama" id="wil-search" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          <option value="">Semua status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        {type === 'kabupaten' && (
          <select value={provFilter} onChange={(e) => { setProvFilter(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
            <option value="">Semua provinsi</option>
            {provinsiMaster.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
        )}
        <button type="submit" className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">Cari</button>
      </form>

      <p className="mb-2 text-xs font-semibold text-kipan-text-muted">
        Menampilkan {items.length} dari {total} {type === 'provinsi' ? 'provinsi' : 'kabupaten/kota'}.
      </p>

      {error && !loading ? (
        <div className="space-y-3">
          <ErrorBox message={error} />
          <Button variant="outline-navy" onClick={() => void load()}>Coba lagi</Button>
        </div>
      ) : loading ? (
        <div className="overflow-hidden rounded-2xl border border-kipan-border bg-white" aria-busy="true" role="status" aria-label="Memuat daftar wilayah">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">No</th><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">{type === 'provinsi' ? 'Jml Kab/Kota' : 'Provinsi'}</th>
                <th className="px-4 py-3">Jml Pengurus</th><th className="px-4 py-3">Ketua</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} className="border-t border-kipan-border">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white">
          <EmptyState title="Tidak ada wilayah" desc="Tidak ada provinsi/kabupaten pada filter ini." />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">{type === 'provinsi' ? 'Jml Kab/Kota' : 'Provinsi'}</th>
                  <th className="px-4 py-3">Jml Pengurus</th>
                  <th className="px-4 py-3">Ketua</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                    <td className="px-4 py-3 text-kipan-text-muted">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-kipan-navy">{it.kode}</td>
                    <td className="px-4 py-3 font-semibold text-kipan-text-dark">{it.nama}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{type === 'provinsi' ? it.jml_kabupaten : (it.provinsi_nama ?? '-')}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{it.jml_pengurus}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{it.ketua ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={it.is_active ? 'Aktif' : 'Nonaktif'} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => void onDetail(it)} className="font-semibold text-kipan-blue hover:underline">Detail</button>
                        <button
                          type="button"
                          disabled={togglingId === it.id}
                          onClick={() => void toggleStatus(it)}
                          className="inline-flex items-center gap-1.5 font-semibold text-kipan-red hover:underline disabled:opacity-50"
                        >
                          {togglingId === it.id && <Spinner size={13} />}
                          {it.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
