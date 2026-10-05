import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { SelectInput, TextInput } from '@/components/ui/fields';
import { StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import type { PengurusAksiApi } from '../hooks/usePengurusAksi';
import { PAW_OPTIONS, STATUS_OPTIONS, masaJabatan, wilayahNama } from '../lib/pengurusList';
import { canManagePengurusForLevel } from '../roles';
import type { PengurusDetail, PengurusPAWAksi, PengurusStatus } from '../types';

// PengurusRow merender satu baris tabel: sel nama (+panel edit inline),
// sel aksi (Detail + tombol aksi + panel PAW/mutasi inline).
export default function PengurusRow({ p, idx, page, aksi }: {
  p: PengurusDetail;
  idx: number;
  page: number;
  aksi: PengurusAksiApi;
}) {
  const { user } = useAuth();
  const {
    editing, setEditing, editStatus, setEditStatus, editKeterangan, setEditKeterangan,
    editingJabatan, setEditingJabatan, newJabatanId, setNewJabatanId, jabatanAll,
    pawId, setPawId, pawAksi, setPawAksi, pawKeterangan, setPawKeterangan,
    mutasiId, setMutasiId, mutasiSKId, setMutasiSKId, mutasiJabatanId, setMutasiJabatanId,
    mutasiTanggal, setMutasiTanggal, mutasiKeterangan, setMutasiKeterangan, skTargets,
    mulaiUbah, mulaiGantiJabatan, simpanJabatan, simpanStatus,
    mulaiPaw, simpanPaw, mulaiMutasi, simpanMutasi,
  } = aksi;
  const mj = masaJabatan(p.sk_tanggal_berakhir);

  return (
    <tr key={p.id} className="border-t border-kipan-border align-top hover:bg-kipan-soft-gray/60">
      <td className="px-4 py-3 text-kipan-text-muted">{(page - 1) * 10 + idx + 1}</td>
      <td className="px-4 py-3">
        <div className="font-semibold text-kipan-text-dark">{p.nama_lengkap}</div>
        <div className="font-mono text-xs text-kipan-navy">{p.nia}</div>
        {editing === p.id && (
          <div className="mt-2 space-y-2">
            <SelectInput
              value={editStatus}
              onChange={(v) => setEditStatus(v as PengurusStatus)}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              placeholder="Pilih status"
              id={`pst-${p.id}`}
            />
            {editStatus !== 'Aktif' && (
              <TextInput value={editKeterangan} onChange={setEditKeterangan} placeholder="Keterangan (wajib)" id={`pket-${p.id}`} />
            )}
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void simpanStatus(p.id)}>Simpan</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Batal</Button>
            </div>
          </div>
        )}
        {editingJabatan === p.id && (
          <div className="mt-2 space-y-2">
            <SelectInput
              value={newJabatanId}
              onChange={setNewJabatanId}
              options={jabatanAll.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))}
              placeholder="Pilih jabatan baru"
              id={`pjab-${p.id}`}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void simpanJabatan(p.id)}>Simpan Jabatan</Button>
              <Button variant="ghost" onClick={() => setEditingJabatan(null)}>Batal</Button>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-kipan-text-muted">{p.jabatan}{p.is_inti ? ' (inti)' : ''}</td>
      <td className="px-4 py-3 text-kipan-text-muted">{p.level}</td>
      <td className="px-4 py-3 text-kipan-text-muted">{wilayahNama(p)}</td>
      <td className="px-4 py-3">
        <Link to={`/admin/sk/${p.surat_keputusan_id}`} className="font-mono text-xs font-semibold text-kipan-blue hover:underline">{p.nomor_sk}</Link>
      </td>
      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
      <td className={`px-4 py-3 text-xs font-semibold ${mj.cls}`}>{mj.text}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          <Link to={`/admin/pengurus/${p.id}`} className="font-semibold text-kipan-blue hover:underline">Detail →</Link>
          {canManagePengurusForLevel(user?.role, p.level) &&
            editing !== p.id && editingJabatan !== p.id && pawId !== p.id && mutasiId !== p.id && (
            <>
              <button type="button" onClick={() => mulaiUbah(p)} className="font-semibold text-kipan-blue hover:underline">Ubah Status</button>
              <button type="button" onClick={() => mulaiGantiJabatan(p)} className="font-semibold text-kipan-blue hover:underline">Ganti Jabatan</button>
              {p.status === 'Aktif' && (
                <>
                  <button type="button" onClick={() => mulaiPaw(p)} className="font-semibold text-kipan-red hover:underline">PAW</button>
                  <button type="button" onClick={() => mulaiMutasi(p)} className="font-semibold text-kipan-blue hover:underline">Mutasi</button>
                </>
              )}
            </>
          )}
        </div>
        {pawId === p.id && (
          <div className="mt-2 space-y-2 text-left">
            <p className="text-xs font-bold text-kipan-text-dark">Aksi PAW</p>
            <SelectInput
              value={pawAksi}
              onChange={(v) => setPawAksi(v as PengurusPAWAksi)}
              options={PAW_OPTIONS}
              placeholder="Pilih aksi"
              id={`paw-${p.id}`}
            />
            <TextInput value={pawKeterangan} onChange={setPawKeterangan} placeholder="Keterangan (wajib)" id={`pawk-${p.id}`} />
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void simpanPaw(p.id)}>Proses PAW</Button>
              <Button variant="ghost" onClick={() => setPawId(null)}>Batal</Button>
            </div>
          </div>
        )}
        {mutasiId === p.id && (
          <div className="mt-2 space-y-2 text-left">
            <p className="text-xs font-bold text-kipan-text-dark">Mutasi ke SK Lain</p>
            <SelectInput
              value={mutasiSKId}
              onChange={setMutasiSKId}
              options={skTargets
                .filter((s) => s.id !== p.surat_keputusan_id)
                .map((s) => ({ value: String(s.id), label: `${s.nomor_sk} · ${s.judul}` }))}
              placeholder="Pilih SK tujuan"
              id={`mut-${p.id}`}
            />
            <SelectInput
              value={mutasiJabatanId}
              onChange={setMutasiJabatanId}
              options={jabatanAll.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))}
              placeholder="Pilih jabatan tujuan"
              id={`mutj-${p.id}`}
            />
            <TextInput value={mutasiTanggal} onChange={setMutasiTanggal} placeholder="Tanggal mulai (YYYY-MM-DD, opsional)" id={`mutt-${p.id}`} />
            <TextInput value={mutasiKeterangan} onChange={setMutasiKeterangan} placeholder="Keterangan (opsional)" id={`mutk-${p.id}`} />
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void simpanMutasi(p.id)}>Proses Mutasi</Button>
              <Button variant="ghost" onClick={() => setMutasiId(null)}>Batal</Button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
