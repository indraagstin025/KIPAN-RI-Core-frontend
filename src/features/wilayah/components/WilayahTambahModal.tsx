import Button from '@/components/ui/button';
import { Field, SelectInput } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import { Modal } from '@/components/ui/modal';
import type { WilayahAdminApi } from '../hooks/useWilayahAdmin';
import type { WilayahType } from '../types';

export default function WilayahTambahModal({ admin }: { admin: WilayahAdminApi }) {
  const {
    type, gantiType, tambahProv, tambahKab, setTambahKab, tambahKabList,
    provinsiMaster, submitTambah, submitting, showTambah, setShowTambah,
  } = admin;

  if (!showTambah) return null;

  return (
    <Modal title="Tambah dari Master" onClose={() => setShowTambah(false)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipe Wilayah" required>
          <SelectInput value={type} onChange={(v) => gantiType(v as WilayahType)} placeholder="Pilih tipe" id="tw-type" options={[{ value: 'provinsi', label: 'Provinsi' }, { value: 'kabupaten', label: 'Kabupaten/Kota' }]} />
        </Field>
        <Field label="Provinsi" required>
          <SelectInput value={tambahProv} onChange={(v) => void admin.pilihTambahProv(v)} placeholder="Pilih provinsi" id="tw-prov" options={provinsiMaster.map((p) => ({ value: String(p.id), label: p.nama }))} />
        </Field>
        {type === 'kabupaten' && (
          <Field label="Kabupaten/Kota" required>
            <SelectInput value={tambahKab} onChange={setTambahKab} placeholder="Pilih kabupaten/kota" id="tw-kab" options={tambahKabList.map((k) => ({ value: String(k.id), label: k.nama }))} />
          </Field>
        )}
      </div>
      <p className="mt-3 text-xs text-kipan-text-muted">Kode & nama diambil otomatis dari master. Aksi ini mengaktifkan kembali wilayah yang berstatus Nonaktif.</p>
      <div className="mt-4">
        <Button variant="accent" onClick={() => void submitTambah()} disabled={submitting}>
          {submitting ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Menyimpan...</span> : 'Simpan'}
        </Button>
      </div>
    </Modal>
  );
}
