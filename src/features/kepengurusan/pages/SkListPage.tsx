import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Alert, Field, SelectInput, TextInput } from '@/components/ui/fields';
import { Overlay, Spinner } from '@/components/ui/loading';
import { ErrorBox, Loading, PageHeader, Pagination, StatusBadge } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { useWilayah } from '@/features/pendaftaran/hooks/useWilayah';
import { uploadDokumen } from '@/features/storage/api/storageService';
import { ApiError } from '@/services/apiClient';
import { adminCreateSK, adminListSK } from '../api/kepengurusanService';
import { canCreateSK } from '../roles';
import type { SKListItem } from '../types';

const LEVELS = ['', 'NASIONAL', 'PROVINSI', 'KABUPATEN'];
const SK_STATUSES = ['', 'Aktif', 'TidakAktif', 'Digantikan'];
const APPROVALS = ['', 'DRAFT', 'MENUNGGU_PROVINSI', 'MENUNGGU_NASIONAL', 'DISETUJUI', 'DITOLAK'];

const FORM_LEVELS = [
  { value: 'NASIONAL', label: 'Nasional' },
  { value: 'PROVINSI', label: 'Provinsi' },
  { value: 'KABUPATEN', label: 'Kabupaten/Kota' },
];

const APPROVAL_LABEL: Record<string, string> = {
  DRAFT: 'Draf',
  MENUNGGU_PROVINSI: 'Menunggu Provinsi',
  MENUNGGU_NASIONAL: 'Menunggu Nasional',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
};

function tanggalPendek(s?: string): string {
  if (!s) return '-';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function wilayahNama(s: SKListItem): string {
  if (s.level === 'NASIONAL') return 'Nasional';
  if (s.level === 'PROVINSI') return s.provinsi_nama ?? '-';
  return s.kabupaten_nama ?? '-';
}

export default function SkListPage() {
  const { user } = useAuth();
  const isNational = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_NASIONAL';
  const wilayah = useWilayah();

  const [items, setItems] = useState<SKListItem[]>([]);
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [approval, setApproval] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [nomor, setNomor] = useState('');
  const [judul, setJudul] = useState('');
  const [fLevel, setFLevel] = useState('NASIONAL');
  const [fProvinsi, setFProvinsi] = useState('');
  const [fKabupaten, setFKabupaten] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [berakhir, setBerakhir] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListSK({
        page, limit: 10,
        level: level || undefined,
        status: status || undefined,
        approval: approval || undefined,
        search: debouncedSearch || undefined,
      });
      setItems(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar SK');
    } finally {
      setLoading(false);
    }
  }, [page, level, status, approval, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm(): void {
    setNomor('');
    setJudul('');
    setFLevel('NASIONAL');
    setFProvinsi('');
    setFKabupaten('');
    setTanggal('');
    setBerakhir('');
    setFile(null);
    setFormError(null);
  }

  function ubahProvinsi(v: string): void {
    setFProvinsi(v);
    setFKabupaten('');
    if (v) void wilayah.pilihProvinsi(Number(v));
  }

  async function simpan(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    if (!nomor.trim() || !judul.trim() || !tanggal || !berakhir) {
      setFormError('Nomor, judul, tanggal terbit, dan tanggal berakhir wajib diisi.');
      return;
    }
    if (new Date(`${berakhir}T00:00:00Z`) <= new Date(`${tanggal}T00:00:00Z`)) {
      setFormError('Tanggal berakhir harus setelah tanggal terbit.');
      return;
    }
    if (!file) {
      setFormError('File SK wajib diunggah.');
      return;
    }
    if (isNational) {
      if ((fLevel === 'PROVINSI' || fLevel === 'KABUPATEN') && !fProvinsi) {
        setFormError('Provinsi wajib dipilih.');
        return;
      }
      if (fLevel === 'KABUPATEN' && !fKabupaten) {
        setFormError('Kabupaten/Kota wajib dipilih.');
        return;
      }
    }
    setBusy(true);
    try {
      const key = await uploadDokumen('sk', file);
      await adminCreateSK({
        nomor_sk: nomor.trim(),
        judul: judul.trim(),
        level: isNational ? fLevel : undefined,
        provinsi_id: isNational && fLevel !== 'NASIONAL' ? Number(fProvinsi) : undefined,
        kabupaten_id: isNational && fLevel === 'KABUPATEN' ? Number(fKabupaten) : undefined,
        tanggal_terbit: new Date(`${tanggal}T00:00:00Z`).toISOString(),
        tanggal_berakhir: new Date(`${berakhir}T00:00:00Z`).toISOString(),
        file_sk_key: key,
      });
      setShowForm(false);
      resetForm();
      setPage(1);
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal membuat SK');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Surat Keputusan"
        desc={`${total} SK sesuai cakupan wilayah Anda.`}
        action={canCreateSK(user?.role) ? (
          <Button variant="primary" onClick={() => { setShowForm((v) => !v); resetForm(); }}>
            {showForm ? 'Tutup Formulir' : '+ Buat SK'}
          </Button>
        ) : undefined}
      />

      {showForm && (
        <form onSubmit={simpan} className="mb-5 rounded-2xl border border-kipan-border bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-2 text-base font-bold text-kipan-text-dark">Buat Surat Keputusan</p>
          <div className="mb-4">
            <Alert kind="warning">
              Penting (Aturan SK Tunggal): mengajukan &amp; menyetujui SK baru otomatis menonaktifkan SK lama selevel &amp; wilayah beserta pengurusnya (Demisioner).
            </Alert>
          </div>
          {formError && <div className="mb-4"><Alert kind="error">{formError}</Alert></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor SK" required>
              <TextInput value={nomor} onChange={setNomor} maxLength={100} id="sk-nomor" />
            </Field>
            <Field label="Tanggal Terbit" required>
              <input
                type="date"
                id="sk-tanggal"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
              />
            </Field>
            <Field label="Tanggal Berakhir" required>
              <input
                type="date"
                id="sk-berakhir"
                value={berakhir}
                onChange={(e) => setBerakhir(e.target.value)}
                className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Judul SK" required>
                <TextInput value={judul} onChange={setJudul} maxLength={255} id="sk-judul" />
              </Field>
            </div>

            {isNational ? (
              <>
                <Field label="Level" required>
                  <SelectInput value={fLevel} onChange={setFLevel} id="sk-level" placeholder="Pilih level" options={FORM_LEVELS} />
                </Field>
                <div className="hidden sm:block" />
                {fLevel !== 'NASIONAL' && (
                  <Field label="Provinsi" required>
                    <SelectInput
                      value={fProvinsi}
                      onChange={ubahProvinsi}
                      id="sk-provinsi"
                      placeholder="Pilih provinsi"
                      options={wilayah.provinsi.map((p) => ({ value: String(p.id), label: p.nama }))}
                    />
                  </Field>
                )}
                {fLevel === 'KABUPATEN' && (
                  <Field label="Kabupaten/Kota" required>
                    <SelectInput
                      value={fKabupaten}
                      onChange={setFKabupaten}
                      id="sk-kabupaten"
                      placeholder={wilayah.loadingKab ? 'Memuat...' : 'Pilih kabupaten/kota'}
                      options={wilayah.kabupaten.map((k) => ({ value: String(k.id), label: k.nama }))}
                    />
                  </Field>
                )}
              </>
            ) : (
              <div className="sm:col-span-2 rounded-lg border border-kipan-border bg-kipan-soft-gray px-3.5 py-2.5 text-sm text-kipan-text-muted">
                Level &amp; wilayah SK terkunci ke wilayah akun Anda.
              </div>
            )}

            <div className="sm:col-span-2">
              <Field label="File SK (PDF, maks 5 MB)" required>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-kipan-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-kipan-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-kipan-blue"
                />
              </Field>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="accent" type="submit" disabled={busy}>
              {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Menyimpan...</span> : 'Simpan SK'}
            </Button>
          </div>
        </form>
      )}

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

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
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
              {items.map((s) => (
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
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      {busy && <Overlay label="Mengunggah & menyimpan SK..." />}
    </div>
  );
}
