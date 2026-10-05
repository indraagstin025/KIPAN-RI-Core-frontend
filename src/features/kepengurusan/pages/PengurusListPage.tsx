import { useState } from 'react';
import Button from '@/components/ui/button';
import { Alert } from '@/components/ui/fields';
import { Card, ErrorBox, Loading, PageHeader, Pagination } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import FilterPengurus from '../components/FilterPengurus';
import PengurusRow from '../components/PengurusRow';
import PromotePengurusWizard from '../components/PromotePengurusWizard';
import { usePengurusAksi } from '../hooks/usePengurusAksi';
import { usePengurusList } from '../hooks/usePengurusList';

export default function PengurusListPage() {
  const { user } = useAuth();
  const list = usePengurusList();
  const aksi = usePengurusAksi(list.load);

  // Wizard pengangkatan terpadu (SK → Anggota → Jabatan → Konfirmasi).
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div>
      <PageHeader
        title="Pengurus"
        desc={`${list.total} pengurus sesuai cakupan wilayah Anda.`}
        action={(
          <div className="flex gap-2">
            <Button variant="outline-navy" onClick={() => window.print()}>Cetak / PDF</Button>
            <Button variant="primary" onClick={() => setShowWizard(true)}>+ Tambah Pengurus</Button>
          </div>
        )}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card><p className="text-xs text-kipan-text-muted">Total Pengurus</p><p className="text-2xl font-bold text-kipan-text-dark">{list.stats.total}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Nasional</p><p className="text-2xl font-bold text-kipan-text-dark">{list.stats.nasional}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Provinsi</p><p className="text-2xl font-bold text-kipan-text-dark">{list.stats.provinsi}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Kabupaten/Kota</p><p className="text-2xl font-bold text-kipan-text-dark">{list.stats.kabupaten}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Masa Jabatan Akan Berakhir</p><p className="text-2xl font-bold text-amber-600">{list.stats.akan_berakhir}</p></Card>
      </div>

      {aksi.aksiError && <div className="mb-4"><Alert kind="error">{aksi.aksiError}</Alert></div>}

      <FilterPengurus list={list} />

      {list.error && <ErrorBox message={list.error} />}
      {list.loading ? (
        <Loading />
      ) : list.items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Belum ada pengurus.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama / NIA</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">SK</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Masa Jabatan</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.items.map((p, idx) => (
                <PengurusRow key={p.id} p={p} idx={idx} page={list.page} aksi={aksi} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />

      <PromotePengurusWizard open={showWizard} onClose={() => setShowWizard(false)} onDone={list.load} actorRole={user?.role} />
    </div>
  );
}
