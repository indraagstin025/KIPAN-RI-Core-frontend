import Button from '@/components/ui/button';
import { Alert } from '@/components/ui/fields';
import { Overlay } from '@/components/ui/loading';
import { Card, PageHeader } from '@/components/ui/stateful';
import WilayahDetailModal from '../components/WilayahDetailModal';
import WilayahTabel from '../components/WilayahTabel';
import WilayahTambahModal from '../components/WilayahTambahModal';
import { useWilayahAdmin } from '../hooks/useWilayahAdmin';
import { useWilayahDetail } from '../hooks/useWilayahDetail';

export default function WilayahPage() {
  const admin = useWilayahAdmin();
  const detail = useWilayahDetail(admin.setAksiError);

  return (
    <div>
      <PageHeader
        title="Master Wilayah"
        desc="Kelola provinsi & kabupaten/kota (Aktif/Nonaktif)."
        action={<Button variant="primary" onClick={admin.bukaTambah}>+ Tambah dari Master</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs text-kipan-text-muted">Total Provinsi</p><p className="text-2xl font-bold text-kipan-text-dark">{admin.cards.total_provinsi}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Total Kabupaten/Kota</p><p className="text-2xl font-bold text-kipan-text-dark">{admin.cards.total_kabupaten}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Total Pengurus</p><p className="text-2xl font-bold text-kipan-text-dark">{admin.cards.total_pengurus}</p></Card>
      </div>

      {admin.aksiError && <div className="mb-4"><Alert kind="error">{admin.aksiError}</Alert></div>}

      <WilayahTabel admin={admin} onDetail={(it) => void detail.bukaDetail(admin.type, it)} />

      <WilayahDetailModal detail={detail} />

      <WilayahTambahModal admin={admin} />

      {admin.submitting && <Overlay label="Menyimpan wilayah..." />}
    </div>
  );
}
