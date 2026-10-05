import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Overlay } from '@/components/ui/loading';
import { ErrorBox, Loading, PageHeader, Pagination, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import FilterSk from '../components/FilterSk';
import FormBuatSk from '../components/FormBuatSk';
import { useSkCreateForm } from '../hooks/useSkCreateForm';
import { useSkList } from '../hooks/useSkList';
import { APPROVAL_LABEL, tanggalPendek, wilayahNama } from '../lib/skList';
import { canCreateSK } from '../roles';

export default function SkListPage() {
  const { user } = useAuth();
  const list = useSkList();
  const create = useSkCreateForm(async () => {
    list.setPage(1);
    await list.load();
  });

  return (
    <div>
      <PageHeader
        title="Surat Keputusan"
        desc={`${list.total} SK sesuai cakupan wilayah Anda.`}
        action={canCreateSK(user?.role) ? (
          <Button variant="primary" onClick={() => create.bukaForm()}>
            {create.showForm ? 'Tutup Formulir' : '+ Buat SK'}
          </Button>
        ) : undefined}
      />

      {create.showForm && <FormBuatSk form={create} />}

      <FilterSk list={list} />

      {list.error && <ErrorBox message={list.error} />}
      {list.loading ? (
        <Loading />
      ) : list.items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Belum ada Surat Keputusan.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">Nomor SK</th>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">Persetujuan</th>
                <th className="px-4 py-3">Status SK</th>
                <th className="px-4 py-3">Masa Berlaku</th>
                <th className="px-4 py-3">Pengurus</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.items.map((s) => (
                <tr key={s.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-kipan-navy">{s.nomor_sk}</td>
                  <td className="px-4 py-3 font-semibold text-kipan-text-dark">{s.judul}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{s.level}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{wilayahNama(s)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.approval_status} label={APPROVAL_LABEL[s.approval_status] ?? s.approval_status} />
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-xs text-kipan-text-muted">{tanggalPendek(s.tanggal_terbit)} – {tanggalPendek(s.tanggal_berakhir)}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{s.jumlah_pengurus}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/sk/${s.id}`} className="font-semibold text-kipan-blue hover:underline">Detail →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
      {create.busy && <Overlay label="Mengunggah, menyimpan SK & mengangkat kader..." />}
    </div>
  );
}
