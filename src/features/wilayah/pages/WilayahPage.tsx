import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert, Field, SelectInput, TextInput } from '@/components/ui/fields';
import { Overlay, Skeleton, Spinner } from '@/components/ui/loading';
import { Modal } from '@/components/ui/modal';
import { Card, EmptyState, ErrorBox, PageHeader, Pagination, StatusBadge } from '@/components/ui/stateful';
import { listKabupaten, listProvinsi } from '@/features/pendaftaran/api/wilayahService';
import type { WilayahKabupaten, WilayahProvinsi } from '@/features/pendaftaran/types';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { wilayahAdd, wilayahCards, wilayahDetail, wilayahList, wilayahPengurus, wilayahSetStatus } from '../api/wilayahAdminService';
import type { PengurusDetail } from '@/features/kepengurusan/types';
import type { WilayahAdminItem, WilayahCards, WilayahDetail, WilayahType } from '../types';

const EMPTY_CARDS: WilayahCards = { total_provinsi: 0, total_kabupaten: 0, total_pengurus: 0 };
const PAGE_SIZE = 25;
const SKELETON_ROWS = 8;

export default function WilayahPage() {
  const [cards, setCards] = useState<WilayahCards>(EMPTY_CARDS);
  const [type, setType] = useState<WilayahType>('provinsi');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [provFilter, setProvFilter] = useState('');

  const [items, setItems] = useState<WilayahAdminItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [provinsiMaster, setProvinsiMaster] = useState<WilayahProvinsi[]>([]);

  const [detail, setDetail] = useState<WilayahDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'pengurus' | 'statistik' | 'activity'>('info');
  const [pengurusList, setPengurusList] = useState<PengurusDetail[]>([]);
  const [pengurusAll, setPengurusAll] = useState(false);
  const [pengurusLoading, setPengurusLoading] = useState(false);
  const [pengurusError, setPengurusError] = useState<string | null>(null);

  const [showTambah, setShowTambah] = useState(false);
  const [tambahProv, setTambahProv] = useState('');
  const [tambahKab, setTambahKab] = useState('');
  const [tambahKabList, setTambahKabList] = useState<WilayahKabupaten[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [c, p] = await Promise.all([wilayahCards(), listProvinsi()]);
        setCards(c);
        setProvinsiMaster(p);
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : 'Gagal memuat ringkasan wilayah');
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wilayahList({
        type,
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status || undefined,
        provinsi_id: type === 'kabupaten' && provFilter ? Number(provFilter) : undefined,
      });
      setItems(res.data);
      setTotal(res.meta.total);
      setTotalPages(Math.max(1, res.meta.total_pages));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar wilayah');
    } finally {
      setLoading(false);
    }
  }, [type, page, debouncedSearch, status, provFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function gantiType(t: WilayahType): void {
    setType(t);
    setProvFilter('');
    setPage(1);
  }

  async function toggleStatus(it: WilayahAdminItem): Promise<void> {
    setAksiError(null);
    setTogglingId(it.id);
    try {
      await wilayahSetStatus(type, it.id, !it.is_active);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal mengubah status wilayah');
    } finally {
      setTogglingId(null);
    }
  }

  // Tab Pengurus memakai endpoint khusus (filter Aktif/Semua) — bukan data
  // ringkas dari /detail.
  const loadPengurus = useCallback(async () => {
    if (detailTab !== 'pengurus' || !detail) return;
    setPengurusLoading(true);
    setPengurusError(null);
    try {
      setPengurusList(await wilayahPengurus(detail.type as WilayahType, detail.id, pengurusAll));
    } catch (e: unknown) {
      setPengurusError(e instanceof ApiError ? e.message : 'Gagal memuat pengurus wilayah');
    } finally {
      setPengurusLoading(false);
    }
  }, [detailTab, detail, pengurusAll]);

  useEffect(() => {
    void loadPengurus();
  }, [loadPengurus]);

  async function bukaDetail(it: WilayahAdminItem): Promise<void> {
    setAksiError(null);
    setDetailTab('info');
    setDetail(null);
    setPengurusAll(false);
    setPengurusList([]);
    setDetailLoading(true);
    try {
      setDetail(await wilayahDetail(type, it.id));
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal memuat detail wilayah');
    } finally {
      setDetailLoading(false);
    }
  }

  function bukaTambah(): void {
    setAksiError(null);
    setTambahProv('');
    setTambahKab('');
    setTambahKabList([]);
    setShowTambah(true);
  }

  async function pilihTambahProv(v: string): Promise<void> {
    setTambahProv(v);
    setTambahKab('');
    setTambahKabList([]);
    if (v) {
      try {
        setTambahKabList(await listKabupaten(Number(v)));
      } catch {
        setTambahKabList([]);
      }
    }
  }

  async function submitTambah(): Promise<void> {
    setAksiError(null);
    if (!tambahProv) {
      setAksiError('Pilih provinsi terlebih dahulu.');
      return;
    }
    if (type === 'kabupaten' && !tambahKab) {
      setAksiError('Pilih kabupaten/kota terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      await wilayahAdd(type, Number(tambahProv), type === 'kabupaten' ? Number(tambahKab) : 0);
      setShowTambah(false);
      await load();
    } catch (e: unknown) {
      setAksiError(e instanceof ApiError ? e.message : 'Gagal menambah wilayah');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Master Wilayah"
        desc="Kelola provinsi & kabupaten/kota (Aktif/Nonaktif)."
        action={<Button variant="primary" onClick={bukaTambah}>+ Tambah dari Master</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs text-kipan-text-muted">Total Provinsi</p><p className="text-2xl font-bold text-kipan-text-dark">{cards.total_provinsi}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Total Kabupaten/Kota</p><p className="text-2xl font-bold text-kipan-text-dark">{cards.total_kabupaten}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Total Pengurus</p><p className="text-2xl font-bold text-kipan-text-dark">{cards.total_pengurus}</p></Card>
      </div>

      {aksiError && <div className="mb-4"><Alert kind="error">{aksiError}</Alert></div>}

      <div className="mb-3 flex flex-wrap gap-2">
        {(['provinsi', 'kabupaten'] as WilayahType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => gantiType(t)}
            aria-pressed={type === t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === t ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy hover:bg-kipan-soft-gray'}`}
          >
            {t === 'provinsi' ? 'Provinsi' : 'Kabupaten/Kota'}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="mb-4 flex flex-wrap items-center gap-3">
        <TextInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari kode atau nama" id="wil-search" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
          <option value="">Semua status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        {type === 'kabupaten' && (
          <select value={provFilter} onChange={(e) => { setProvFilter(e.target.value); setPage(1); }} className="rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kipan-blue/20">
            <option value="">Semua provinsi</option>
            {provinsiMaster.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
        )}
        <button type="submit" className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">Cari</button>
      </form>

      <p className="mb-2 text-xs font-semibold text-kipan-text-muted">
        Menampilkan {items.length} dari {total} {type === 'provinsi' ? 'provinsi' : 'kabupaten/kota'}.
      </p>

      {error && !loading ? (
        <div className="space-y-3">
          <ErrorBox message={error} />
          <Button variant="outline-navy" onClick={() => void load()}>Coba lagi</Button>
        </div>
      ) : loading ? (
        <div className="overflow-hidden rounded-2xl border border-kipan-border bg-white" aria-busy="true" role="status" aria-label="Memuat daftar wilayah">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">No</th><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">{type === 'provinsi' ? 'Jml Kab/Kota' : 'Provinsi'}</th>
                <th className="px-4 py-3">Jml Pengurus</th><th className="px-4 py-3">Ketua</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} className="border-t border-kipan-border">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white">
          <EmptyState title="Tidak ada wilayah" desc="Tidak ada provinsi/kabupaten pada filter ini." />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">{type === 'provinsi' ? 'Jml Kab/Kota' : 'Provinsi'}</th>
                  <th className="px-4 py-3">Jml Pengurus</th>
                  <th className="px-4 py-3">Ketua</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                    <td className="px-4 py-3 text-kipan-text-muted">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-kipan-navy">{it.kode}</td>
                    <td className="px-4 py-3 font-semibold text-kipan-text-dark">{it.nama}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{type === 'provinsi' ? it.jml_kabupaten : (it.provinsi_nama ?? '-')}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{it.jml_pengurus}</td>
                    <td className="px-4 py-3 text-kipan-text-muted">{it.ketua ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={it.is_active ? 'Aktif' : 'Nonaktif'} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => void bukaDetail(it)} className="font-semibold text-kipan-blue hover:underline">Detail</button>
                        <button
                          type="button"
                          disabled={togglingId === it.id}
                          onClick={() => void toggleStatus(it)}
                          className="inline-flex items-center gap-1.5 font-semibold text-kipan-red hover:underline disabled:opacity-50"
                        >
                          {togglingId === it.id && <Spinner size={13} />}
                          {it.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {(detailLoading || detail) && (
        <Modal title={detail ? `${detail.nama} (${detail.kode})` : 'Memuat detail...'} onClose={() => { setDetail(null); setDetailLoading(false); }}>
          {detailLoading || !detail ? (
            <div className="space-y-3" aria-busy="true" role="status" aria-label="Memuat detail wilayah">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {(['info', 'pengurus', 'statistik', 'activity'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDetailTab(t)}
                    aria-pressed={detailTab === t}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${detailTab === t ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-blue text-kipan-navy'}`}
                  >
                    {t === 'activity' ? 'Activity' : t}
                  </button>
                ))}
              </div>

              {detailTab === 'info' && (
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-kipan-text-muted">Tipe</dt><dd className="font-semibold capitalize">{detail.type}</dd></div>
                  <div><dt className="text-kipan-text-muted">Kode</dt><dd className="font-semibold">{detail.kode}</dd></div>
                  {detail.provinsi_nama && <div><dt className="text-kipan-text-muted">Provinsi</dt><dd className="font-semibold">{detail.provinsi_nama}</dd></div>}
                  <div><dt className="text-kipan-text-muted">Status</dt><dd><StatusBadge status={detail.is_active ? 'Aktif' : 'Nonaktif'} /></dd></div>
                </dl>
              )}

              {detailTab === 'pengurus' && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-kipan-text-muted">Daftar pengurus wilayah ini.</p>
                    <label className="flex items-center gap-2 text-xs font-semibold text-kipan-text-dark">
                      <input type="checkbox" checked={pengurusAll} onChange={(e) => setPengurusAll(e.target.checked)} className="h-4 w-4 accent-kipan-navy" />
                      Tampilkan non-aktif
                    </label>
                  </div>
                  {pengurusError && <div className="mb-3"><ErrorBox message={pengurusError} /></div>}
                  {pengurusLoading ? (
                    <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24 w-full" /></div>
                  ) : pengurusList.length === 0 ? (
                    <p className="text-sm text-kipan-text-muted">Belum ada pengurus.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-kipan-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
                          <tr><th className="px-4 py-2">NIA</th><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Jabatan</th><th className="px-4 py-2">Status</th></tr>
                        </thead>
                        <tbody>
                          {pengurusList.map((p) => (
                            <tr key={p.id} className="border-t border-kipan-border">
                              <td className="px-4 py-2 font-mono text-xs text-kipan-navy">{p.nia}</td>
                              <td className="px-4 py-2 font-semibold text-kipan-text-dark">{p.nama_lengkap}</td>
                              <td className="px-4 py-2 text-kipan-text-muted">{p.jabatan}</td>
                              <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'statistik' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card><p className="text-xs text-kipan-text-muted">Total Pengurus</p><p className="text-xl font-bold">{detail.statistik.total_pengurus}</p></Card>
                    <Card><p className="text-xs text-kipan-text-muted">Pengurus Aktif</p><p className="text-xl font-bold">{detail.statistik.pengurus_aktif}</p></Card>
                    <Card><p className="text-xs text-kipan-text-muted">Total Kab/Kota</p><p className="text-xl font-bold">{detail.statistik.total_kabupaten}</p></Card>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-kipan-text-dark">Tren Pengurus (6 bulan)</p>
                    {detail.statistik.tren.length === 0 ? (
                      <p className="text-xs text-kipan-text-muted">Belum ada data tren.</p>
                    ) : (
                      <div className="flex items-end gap-3">
                        {detail.statistik.tren.map((t) => (
                          <div key={t.bulan} className="flex flex-1 flex-col items-center">
                            <span className="text-xs font-semibold text-kipan-text-dark">{t.jumlah}</span>
                            <span className="w-full rounded-t bg-kipan-blue" style={{ height: `${Math.min(t.jumlah * 8 + 4, 80)}px` }} />
                            <span className="mt-1 text-[10px] text-kipan-text-muted">{t.bulan}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'activity' && (
                detail.activity.length === 0 ? (
                  <p className="text-sm text-kipan-text-muted">Belum ada aktivitas.</p>
                ) : (
                  <ul className="divide-y divide-kipan-border">
                    {detail.activity.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="text-kipan-text-dark"><span className="font-semibold">{a.actor_name}</span> · {a.action}</span>
                        <span className="text-xs text-kipan-text-muted">{new Date(a.created_at).toLocaleString('id-ID')}</span>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </>
          )}
        </Modal>
      )}

      {showTambah && (
        <Modal title="Tambah dari Master" onClose={() => setShowTambah(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipe Wilayah" required>
              <SelectInput value={type} onChange={(v) => gantiType(v as WilayahType)} placeholder="Pilih tipe" id="tw-type" options={[{ value: 'provinsi', label: 'Provinsi' }, { value: 'kabupaten', label: 'Kabupaten/Kota' }]} />
            </Field>
            <Field label="Provinsi" required>
              <SelectInput value={tambahProv} onChange={(v) => void pilihTambahProv(v)} placeholder="Pilih provinsi" id="tw-prov" options={provinsiMaster.map((p) => ({ value: String(p.id), label: p.nama }))} />
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
      )}

      {submitting && <Overlay label="Menyimpan wilayah..." />}
    </div>
  );
}
