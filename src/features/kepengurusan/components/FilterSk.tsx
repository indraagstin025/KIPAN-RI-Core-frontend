import type { SkListApi } from '../hooks/useSkList';
import { APPROVALS, APPROVAL_LABEL, LEVELS, SK_STATUSES } from '../lib/skList';

export default function FilterSk({ list }: { list: SkListApi }) {
  const { level, setLevel, status, setStatus, approval, setApproval, search, setSearch, setPage, load } = list;

  return (
    <form onSubmit={(e) => { e.preventDefault(); setPage(1); void load(); }} className="mb-4 flex flex-wrap items-center gap-3">
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Cari nomor atau judul"
        className="w-full max-w-xs rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
      />
      <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
        {LEVELS.map((l) => <option key={l} value={l}>{l === '' ? 'Semua level' : l}</option>)}
      </select>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
        {SK_STATUSES.map((s) => <option key={s} value={s}>{s === '' ? 'Semua status SK' : s}</option>)}
      </select>
      <select value={approval} onChange={(e) => { setApproval(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
        {APPROVALS.map((a) => <option key={a} value={a}>{a === '' ? 'Semua persetujuan' : APPROVAL_LABEL[a]}</option>)}
      </select>
      <button type="submit" className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">Cari</button>
    </form>
  );
}
