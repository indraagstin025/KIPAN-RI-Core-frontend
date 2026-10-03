import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Button from '@/components/ui/button';
import { Alert, Field, SelectInput, TextInput } from '@/components/ui/fields';
import { Overlay, Spinner } from '@/components/ui/loading';
import { Card, ErrorBox, Loading, PageHeader, Pagination, StatusBadge } from '@/components/ui/stateful';
import { listKabupaten, listProvinsi } from '@/features/pendaftaran/api/wilayahService';
import type { WilayahKabupaten, WilayahProvinsi } from '@/features/pendaftaran/types';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { adminCreateUser, adminDeleteUser, adminListUsers, adminUpdateUser, adminUserCounts } from '../api/userAdminService';
import type { AdminUser, AdminUserCounts } from '../types';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_NASIONAL: 'Admin Nasional',
  ADMIN_PROVINSI: 'Admin Provinsi',
  ADMIN_KABUPATEN: 'Admin Kabupaten/Kota',
};

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN_NASIONAL', label: 'Admin Nasional' },
  { value: 'ADMIN_PROVINSI', label: 'Admin Provinsi' },
  { value: 'ADMIN_KABUPATEN', label: 'Admin Kabupaten/Kota' },
];

const EMPTY_COUNTS: AdminUserCounts = { total: 0, super: 0, nasional: 0, provinsi: 0, kabupaten: 0 };

interface FormState {
  id: string | null;
  name: string;
  email: string;
  role: string;
  provinsi: string;
  kabupaten: string;
  status: string;
  resetPassword: boolean;
}

const EMPTY_FORM: FormState = { id: null, name: '', email: '', role: 'ADMIN_KABUPATEN', provinsi: '', kabupaten: '', status: 'Aktif', resetPassword: false };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-kipan-border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-kipan-border px-5 py-3">
          <p className="text-base font-bold text-kipan-text-dark">{title}</p>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-kipan-text-muted hover:bg-kipan-soft-gray" aria-label="Tutup">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const [counts, setCounts] = useState<AdminUserCounts>(EMPTY_COUNTS);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [provinsiMaster, setProvinsiMaster] = useState<WilayahProvinsi[]>([]);
  const [kabList, setKabList] = useState<WilayahKabupaten[]>([]);

  useEffect(() => {
    void listProvinsi().then(setProvinsiMaster).catch(() => setProvinsiMaster([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, c] = await Promise.all([
        adminListUsers({ page, limit: 10, role: role || undefined, status: status || undefined, search: debouncedSearch || undefined }),
        adminUserCounts(),
      ]);
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setCounts(c);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  }, [page, role, status, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function openForm(u: AdminUser | null): void {
    setAksiError(null);
    setGenerated(null);
    if (u) {
      setForm({
        id: u.id, name: u.name, email: u.email, role: u.role,
        provinsi: u.provinsi_id ? String(u.provinsi_id) : '',
        kabupaten: u.kabupaten_id ? String(u.kabupaten_id) : '',
        status: u.status, resetPassword: false,
      });
      if (u.provinsi_id) void listKabupaten(u.provinsi_id).then(setKabList).catch(() => setKabList([]));
    } else {
      setForm(EMPTY_FORM);
      setKabList([]);
    }
    setShowForm(true);
  }

  async function pilihProvinsi(v: string): Promise<void> {
    setForm((f) => ({ ...f, provinsi: v, kabupaten: '' }));
    setKabList([]);
    if (v) void listKabupaten(Number(v)).then(setKabList).catch(() => setKabList([]));
  }

  function rolePerluProvinsi(r: string): boolean {
    return r === 'ADMIN_PROVINSI' || r === 'ADMIN_KABUPATEN';
  }

  async function submit(): Promise<void> {
    setAksiError(null);
    if (form.name.trim().length < 2) {
      setAksiError('Nama wajib diisi (min. 2 karakter).');
      return;
    }
    if (!form.email.includes('@')) {
      setAksiError('Format email tidak valid.');
      return;
    }
    if (rolePerluProvinsi(form.role) && !form.provinsi) {
      setAksiError('Provinsi wajib dipilih untuk role ini.');
      return;
    }
    if (form.role === 'ADMIN_KABUPATEN' && !form.kabupaten) {
      setAksiError('Kabupaten/Kota wajib dipilih untuk role ini.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        provinsi_id: rolePerluProvinsi(form.role) ? Number(form.provinsi) : undefined,
        kabupaten_id: form.role === 'ADMIN_KABUPATEN' ? Number(form.kabupaten) : undefined,
        status: form.status,
      };
      const res = form.id
        ? await adminUpdateUser(form.id, { ...payload, reset_password: form.resetPassword })
        : await adminCreateUser(payload);
      setShowForm(false);
      if (res.password) setGenerated(res.password);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal menyimpan pengguna');
    } finally {
      setBusy(false);
    }
  }

  async function hapus(u: AdminUser): Promise<void> {
    if (!window.confirm(`Hapus akun ${u.name} (${u.email})? Akun dinonaktifkan (soft delete).`)) return;
    setAksiError(null);
    setBusy(true);
    try {
      await adminDeleteUser(u.id);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal menghapus pengguna');
    } finally {
      setBusy(false);
    }
  }

  function cakupan(u: AdminUser): string {
    if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN_NASIONAL') return 'Nasional';
    if (u.role === 'ADMIN_PROVINSI') return u.provinsi_nama ?? '-';
    return u.kabupaten_nama ?? '-';
  }

  const tabs = [
    { value: '', label: 'Semua', count: counts.total },
    { value: 'SUPER_ADMIN', label: 'Super', count: counts.super },
    { value: 'ADMIN_NASIONAL', label: 'Nasional', count: counts.nasional },
    { value: 'ADMIN_PROVINSI', label: 'Provinsi', count: counts.provinsi },
    { value: 'ADMIN_KABUPATEN', label: 'Kabupaten/Kota', count: counts.kabupaten },
  ];

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        desc="Kelola akun admin (Super/Nasional/Provinsi/Kabupaten-Kota)."
        action={<Button variant="primary" onClick={() => openForm(null)}>+ Tambah Pengguna</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card><p className="text-xs text-kipan-text-muted">Total Pengguna</p><p className="text-2xl font-bold text-kipan-text-dark">{counts.total}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Super Admin</p><p className="text-2xl font-bold text-kipan-text-dark">{counts.super}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Admin Nasional</p><p className="text-2xl font-bold text-kipan-text-dark">{counts.nasional}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Admin Provinsi</p><p className="text-2xl font-bold text-kipan-text-dark">{counts.provinsi}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Admin Kab/Kota</p><p className="text-2xl font-bold text-kipan-text-dark">{counts.kabupaten}</p></Card>
      </div>

      {aksiError && <div className="mb-4"><Alert kind="error">{aksiError}</Alert></div>}
      {generated && (
        <div className="mb-4">
          <Alert kind="info">
            Kata sandi (tampil SEKALI, salin sekarang): <span className="ml-1 rounded bg-kipan-navy px-2 py-1 font-mono text-xs text-white">{generated}</span>
            <button type="button" onClick={() => setGenerated(null)} className="ml-3 text-xs font-bold underline">Tutup</button>
          </Alert>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            onClick={() => { setRole(t.value); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${role === t.value ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy hover:bg-kipan-soft-gray'}`}
          >
            {t.label} <span className="opacity-75">({t.count})</span>
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); void load(); }} className="mb-4 flex flex-wrap items-center gap-3">
        <TextInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari nama atau email" id="us-search" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          <option value="">Semua status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        <button type="submit" className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">Cari</button>
      </form>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Tidak ada pengguna pada filter ini.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">Nama &amp; Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Cakupan Wilayah</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terdaftar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-kipan-text-dark">{u.name}</div>
                    <div className="text-xs text-kipan-text-muted">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-kipan-text-muted">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="px-4 py-3 text-kipan-text-muted">{cakupan(u)}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 text-xs text-kipan-text-muted">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => openForm(u)} className="font-semibold text-kipan-blue hover:underline">Ubah</button>
                      <button type="button" onClick={() => void hapus(u)} className="font-semibold text-kipan-red hover:underline">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {showForm && (
        <Modal title={form.id ? 'Ubah Pengguna' : 'Tambah Pengguna'} onClose={() => setShowForm(false)}>
          {aksiError && <div className="mb-4"><Alert kind="error">{aksiError}</Alert></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" required>
              <TextInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} maxLength={150} id="uf-nama" />
            </Field>
            <Field label="Email" required>
              <TextInput value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} inputMode="email" maxLength={255} id="uf-email" />
            </Field>
            <Field label="Role" required>
              <SelectInput value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v, provinsi: '', kabupaten: '' }))} placeholder="Pilih role" id="uf-role" options={ROLE_OPTIONS} />
            </Field>
            <Field label="Status" required>
              <SelectInput value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} placeholder="Status" id="uf-status" options={[{ value: 'Aktif', label: 'Aktif' }, { value: 'Nonaktif', label: 'Nonaktif' }]} />
            </Field>
            {rolePerluProvinsi(form.role) && (
              <Field label="Provinsi" required>
                <SelectInput value={form.provinsi} onChange={(v) => void pilihProvinsi(v)} placeholder="Pilih provinsi" id="uf-prov" options={provinsiMaster.map((p) => ({ value: String(p.id), label: p.nama }))} />
              </Field>
            )}
            {form.role === 'ADMIN_KABUPATEN' && (
              <Field label="Kabupaten/Kota" required>
                <SelectInput value={form.kabupaten} onChange={(v) => setForm((f) => ({ ...f, kabupaten: v }))} placeholder="Pilih kabupaten/kota" id="uf-kab" options={kabList.map((k) => ({ value: String(k.id), label: k.nama }))} />
              </Field>
            )}
          </div>
          {form.id ? (
            <label className="mt-4 flex items-center gap-2 text-sm text-kipan-text-dark">
              <input type="checkbox" checked={form.resetPassword} onChange={(e) => setForm((f) => ({ ...f, resetPassword: e.target.checked }))} className="h-4 w-4 accent-kipan-navy" />
              Reset kata sandi (auto-generate, tampil sekali; sesi lama dicabut)
            </label>
          ) : (
            <p className="mt-4 text-xs text-kipan-text-muted">Kata sandi dibuat otomatis & ditampilkan sekali setelah simpan.</p>
          )}
          <div className="mt-4">
            <Button variant="accent" onClick={() => void submit()} disabled={busy}>
              {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Menyimpan...</span> : 'Simpan'}
            </Button>
          </div>
        </Modal>
      )}

      {busy && !showForm && <Overlay label="Memproses..." />}
    </div>
  );
}
