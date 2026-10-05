import { useAuth } from '@/context/AuthContext';
import type { PengurusListApi } from '../hooks/usePengurusList';
import { MASA_OPTIONS, STATUS_OPTIONS } from '../lib/pengurusList';

export default function FilterPengurus({ list }: { list: PengurusListApi }) {
  const { user } = useAuth();
  const isNational = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const { stats, level, setLevel, status, setStatus, masa, setMasa, provFilter, kabFilter, setKabFilter, search, setSearch, setPage, wilayah, pilihProvinsi, load } = list;

  const tabs: { value: string; label: string; count: number }[] = [
    { value: '', label: 'Semua', count: stats.total },
    { value: 'NASIONAL', label: 'Nasional', count: stats.nasional },
    { value: 'PROVINSI', label: 'Provinsi', count: stats.provinsi },
    { value: 'KABUPATEN', label: 'Kabupaten/Kota', count: stats.kabupaten },
  ];

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => { setLevel(t.value); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${level === t.value ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy hover:bg-kipan-soft-gray'}`}
          >
            {t.label} <span className="opacity-75">({t.count})</span>
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); void load(); }} className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari nama atau NIA"
          className="w-full max-w-xs rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          <option value="">Semua status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={masa} onChange={(e) => { setMasa(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          {MASA_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {isNational && (
          <>
            <select value={provFilter} onChange={(e) => pilihProvinsi(e.target.value)} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
              <option value="">Semua provinsi</option>
              {wilayah.provinsi.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            <select value={kabFilter} onChange={(e) => { setKabFilter(e.target.value); setPage(1); }} disabled={!provFilter} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20 disabled:bg-kipan-soft-gray">
              <option value="">Semua kabupaten/kota</option>
              {wilayah.kabupaten.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </>
        )}
        <button type="submit" className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">Cari</button>
      </form>
    </>
  );
}
