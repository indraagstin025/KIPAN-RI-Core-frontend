import { useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert, Field, SelectInput, TextInput } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import { Modal } from '@/components/ui/modal';
import { useWilayah } from '@/features/pendaftaran/hooks/useWilayah';
import { ApiError } from '@/services/apiClient';
import { adminCreateAnggota, adminUpdateAnggota } from '../api/anggotaService';
import type { AnggotaCreateInput, AnggotaDetail, AnggotaUpdateInput } from '../types';

interface Props {
  open: boolean;
  member?: AnggotaDetail | null; // null/kosong = tambah
  onClose: () => void;
  onDone: () => void;
}

const STATUS_OPTIONS = ['AKTIF', 'NONAKTIF', 'DEMISIONER', 'DIBERHENTIKAN', 'MENINGGAL'];
const JK_OPTIONS = [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }];

interface FormState {
  nama_lengkap: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string; // YYYY-MM-DD
  jenis_kelamin: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  alamat: string;
  provinsi_id: string;
  kabupaten_id: string;
  kecamatan: string;
  desa: string;
  kode_pos: string;
  email: string;
  whatsapp: string;
  angkatan: string;
  status: string;
}

const EMPTY: FormState = {
  nama_lengkap: '', nik: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: 'L',
  agama: '', pendidikan: '', pekerjaan: '', alamat: '', provinsi_id: '', kabupaten_id: '',
  kecamatan: '', desa: '', kode_pos: '', email: '', whatsapp: '', angkatan: '', status: 'AKTIF',
};

export default function AnggotaFormModal({ open, member, onClose, onDone }: Props) {
  const wilayah = useWilayah();
  const isEdit = Boolean(member);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (member) {
      setForm({
        nama_lengkap: member.nama_lengkap,
        nik: '',
        tempat_lahir: member.tempat_lahir,
        tanggal_lahir: (member.tanggal_lahir ?? '').slice(0, 10),
        jenis_kelamin: member.jenis_kelamin || 'L',
        agama: member.agama ?? '',
        pendidikan: member.pendidikan ?? '',
        pekerjaan: member.pekerjaan ?? '',
        alamat: member.alamat ?? '',
        provinsi_id: String(member.provinsi_id),
        kabupaten_id: String(member.kabupaten_id),
        kecamatan: member.kecamatan ?? '',
        desa: member.desa ?? '',
        kode_pos: member.kode_pos ?? '',
        email: member.email ?? '',
        whatsapp: member.whatsapp ?? '',
        angkatan: member.angkatan ?? '',
        status: member.status,
      });
      void wilayah.pilihProvinsi(member.provinsi_id);
    } else {
      setForm(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  function set<K extends keyof FormState>(key: K, value: string): void {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function pilihProvinsi(v: string): void {
    set('provinsi_id', v);
    set('kabupaten_id', '');
    if (v) void wilayah.pilihProvinsi(Number(v));
  }

  async function simpan(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (form.nama_lengkap.trim().length < 3) { setError('Nama lengkap minimal 3 karakter.'); return; }
    if (!form.tempat_lahir.trim() || !form.tanggal_lahir) { setError('Tempat & tanggal lahir wajib diisi.'); return; }
    if (!form.provinsi_id || !form.kabupaten_id) { setError('Provinsi & kabupaten wajib dipilih.'); return; }
    if (!form.alamat.trim() || form.alamat.trim().length < 5) { setError('Alamat minimal 5 karakter.'); return; }
    if (!isEdit && !/^\d{16}$/.test(form.nik.trim())) { setError('NIK harus 16 digit angka.'); return; }

    setBusy(true);
    try {
      const base = {
        nama_lengkap: form.nama_lengkap.trim(),
        tempat_lahir: form.tempat_lahir.trim(),
        tanggal_lahir: `${form.tanggal_lahir}T00:00:00Z`,
        jenis_kelamin: form.jenis_kelamin,
        agama: form.agama.trim(),
        pendidikan: form.pendidikan.trim(),
        pekerjaan: form.pekerjaan.trim(),
        alamat: form.alamat.trim(),
        provinsi_id: Number(form.provinsi_id),
        kabupaten_id: Number(form.kabupaten_id),
        kecamatan: form.kecamatan.trim(),
        desa: form.desa.trim(),
        kode_pos: form.kode_pos.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        angkatan: form.angkatan.trim(),
      };
      if (isEdit && member) {
        await adminUpdateAnggota(member.id, { ...base, status: form.status } as AnggotaUpdateInput);
      } else {
        await adminCreateAnggota({ ...base, nik: form.nik.trim(), status: form.status } as AnggotaCreateInput);
      }
      onDone();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan anggota');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Modal title={isEdit ? `Edit Anggota — ${member?.nama_lengkap ?? ''}` : 'Tambah Anggota'} onClose={onClose}>
      <form onSubmit={simpan} className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap" required>
            <TextInput value={form.nama_lengkap} onChange={(v) => set('nama_lengkap', v)} maxLength={150} id="ag-nama" />
          </Field>
          {!isEdit && (
            <Field label="NIK (16 digit)" required>
              <TextInput value={form.nik} onChange={(v) => set('nik', v.replace(/\D/g, ''))} inputMode="numeric" maxLength={16} id="ag-nik" />
            </Field>
          )}
          <Field label="Tempat Lahir" required>
            <TextInput value={form.tempat_lahir} onChange={(v) => set('tempat_lahir', v)} maxLength={100} id="ag-tempat" />
          </Field>
          <Field label="Tanggal Lahir" required>
            <input type="date" value={form.tanggal_lahir} onChange={(e) => set('tanggal_lahir', e.target.value)} id="ag-tgl"
              className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20" />
          </Field>
          <Field label="Jenis Kelamin" required>
            <SelectInput value={form.jenis_kelamin} onChange={(v) => set('jenis_kelamin', v)} options={JK_OPTIONS} placeholder="Pilih" id="ag-jk" />
          </Field>
          <Field label="Agama">
            <TextInput value={form.agama} onChange={(v) => set('agama', v)} maxLength={30} id="ag-agama" />
          </Field>
          <Field label="Pendidikan">
            <TextInput value={form.pendidikan} onChange={(v) => set('pendidikan', v)} maxLength={50} id="ag-pend" />
          </Field>
          <Field label="Pekerjaan">
            <TextInput value={form.pekerjaan} onChange={(v) => set('pekerjaan', v)} maxLength={100} id="ag-kerja" />
          </Field>
          <Field label="Provinsi" required>
            <SelectInput value={form.provinsi_id} onChange={pilihProvinsi} placeholder="Pilih provinsi" id="ag-prov"
              options={wilayah.provinsi.map((p) => ({ value: String(p.id), label: p.nama }))} />
          </Field>
          <Field label="Kabupaten/Kota" required>
            <SelectInput value={form.kabupaten_id} onChange={(v) => set('kabupaten_id', v)} placeholder="Pilih kabupaten/kota" id="ag-kab"
              options={wilayah.kabupaten.map((k) => ({ value: String(k.id), label: k.nama }))} />
          </Field>
          <Field label="Kecamatan">
            <TextInput value={form.kecamatan} onChange={(v) => set('kecamatan', v)} maxLength={100} id="ag-kec" />
          </Field>
          <Field label="Desa/Kelurahan">
            <TextInput value={form.desa} onChange={(v) => set('desa', v)} maxLength={100} id="ag-desa" />
          </Field>
          <Field label="Kode Pos">
            <TextInput value={form.kode_pos} onChange={(v) => set('kode_pos', v.replace(/\D/g, ''))} inputMode="numeric" maxLength={5} id="ag-kp" />
          </Field>
          <Field label="Angkatan">
            <TextInput value={form.angkatan} onChange={(v) => set('angkatan', v)} maxLength={20} id="ag-angk" />
          </Field>
          <Field label="Email">
            <TextInput value={form.email} onChange={(v) => set('email', v)} maxLength={255} id="ag-email" />
          </Field>
          <Field label="WhatsApp">
            <TextInput value={form.whatsapp} onChange={(v) => set('whatsapp', v)} maxLength={25} id="ag-wa" />
          </Field>
          {isEdit && (
            <Field label="Status">
              <SelectInput value={form.status} onChange={(v) => set('status', v)} placeholder="Status"
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} id="ag-status" />
            </Field>
          )}
        </div>

        <Field label="Alamat" required>
          <TextInput value={form.alamat} onChange={(v) => set('alamat', v)} maxLength={255} id="ag-alamat" />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Menyimpan...</span> : isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
