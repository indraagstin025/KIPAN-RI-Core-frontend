import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert, Field, TextInput } from '@/components/ui/fields';
import { Overlay, Spinner } from '@/components/ui/loading';
import { ErrorBox, Loading, PageHeader } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/apiClient';
import { adminCreateJabatan, adminListJabatan, adminUpdateJabatan } from '../api/kepengurusanService';
import { canCreateJabatan, canManageJabatan } from '../roles';
import type { Jabatan } from '../types';

interface FormState {
  id: number | null;
  nama: string;
  is_ketua_umum: boolean;
  is_inti: boolean;
  is_active: boolean;
  urutan: number;
}

const EMPTY: FormState = { id: null, nama: '', is_ketua_umum: false, is_inti: false, is_active: true, urutan: 0 };

export default function JabatanPage() {
  const { user } = useAuth();
  // Tambah: semua admin (TDD D14). Ubah: Super/Nasional.
  const bolehTambah = canCreateJabatan(user?.role);
  const bolehUbah = canManageJabatan(user?.role);
  const [items, setItems] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await adminListJabatan(true));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar jabatan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function pilih(j: Jabatan): void {
    setForm({
      id: j.id,
      nama: j.nama,
      is_ketua_umum: j.is_ketua_umum,
      is_inti: j.is_inti,
      is_active: j.is_active,
      urutan: j.urutan,
    });
    setFormError(null);
  }

  async function simpan(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    if (form.nama.trim().length < 2) {
      setFormError('Nama jabatan wajib diisi (min. 2 karakter).');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        is_ketua_umum: form.is_ketua_umum,
        is_inti: form.is_inti,
        is_active: form.is_active,
        urutan: form.urutan,
      };
      if (form.id) {
        await adminUpdateJabatan(form.id, payload);
      } else {
        await adminCreateJabatan(payload);
      }
      setForm(EMPTY);
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan jabatan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Master Jabatan" desc="Referensi jabatan struktural kepengurusan KIPAN (tanpa level — tingkat mengikuti SK)." />

      {error && <ErrorBox message={error} />}

      {bolehTambah && (
        <form onSubmit={simpan} className="mb-5 rounded-2xl border border-kipan-border bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-base font-bold text-kipan-text-dark">{form.id ? 'Ubah Jabatan' : 'Tambah Jabatan'}</p>
          {formError && <div className="mb-4"><Alert kind="error">{formError}</Alert></div>}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Nama Jabatan" required>
                <TextInput value={form.nama} onChange={(v) => setForm((f) => ({ ...f, nama: v }))} maxLength={100} id="jab-nama" />
              </Field>
            </div>
            <Field label="Urutan">
              <TextInput value={String(form.urutan)} onChange={(v) => setForm((f) => ({ ...f, urutan: Number(v.replace(/\D/g, '')) || 0 }))} inputMode="numeric" maxLength={4} id="jab-urutan" />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2 font-medium text-kipan-text-dark">
              <input type="checkbox" checked={form.is_ketua_umum} onChange={(e) => setForm((f) => ({ ...f, is_ketua_umum: e.target.checked }))} className="h-4 w-4 accent-kipan-navy" />
              Ketua Umum (etalase pimpinan publik)
            </label>
            <label className="flex items-center gap-2 font-medium text-kipan-text-dark">
              <input type="checkbox" checked={form.is_inti} onChange={(e) => setForm((f) => ({ ...f, is_inti: e.target.checked }))} className="h-4 w-4 accent-kipan-navy" />
              Jabatan inti (satu pemegang per SK)
            </label>
            <label className="flex items-center gap-2 font-medium text-kipan-text-dark">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 accent-kipan-navy" />
              Aktif
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="accent" type="submit" disabled={busy}>
              {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Menyimpan...</span> : form.id ? 'Simpan Perubahan' : 'Tambah'}
            </Button>
            {form.id && <Button variant="ghost" onClick={() => setForm(EMPTY)}>Batal</Button>}
          </div>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">Urutan</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Penanda</th>
                <th className="px-4 py-3">Status</th>
                {bolehUbah && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {items.map((j) => (
                <tr key={j.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3 text-kipan-text-muted">{j.urutan}</td>
                  <td className="px-4 py-3 font-semibold text-kipan-text-dark">{j.nama}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {j.is_ketua_umum && <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Ketua Umum</span>}
                      {j.is_inti && <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-kipan-blue">Inti</span>}
                      {!j.is_ketua_umum && !j.is_inti && <span className="text-kipan-text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${j.is_active ? 'bg-emerald-100 text-kipan-green' : 'bg-gray-100 text-gray-600'}`}>
                      {j.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {bolehUbah && (
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => pilih(j)} className="font-semibold text-kipan-blue hover:underline">Ubah</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {busy && <Overlay label="Menyimpan jabatan..." />}
    </div>
  );
}
