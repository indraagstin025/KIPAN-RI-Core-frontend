import Button from '@/components/ui/button';
import { Alert, Field, SelectInput, TextInput } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import type { SkCreateFormApi } from '../hooks/useSkCreateForm';

// FormBuatSk adalah formulir Buat SK + langkah "Kader yang diangkat".
// SK tersimpan sebagai Draf & kader langsung diangkat; ajukan SK dari halaman detail.
export default function FormBuatSk({ form }: { form: SkCreateFormApi }) {
  const {
    nomor, setNomor, judul, setJudul, fLevel, setFLevel, fProvinsi, fKabupaten, setFKabupaten,
    tanggal, setTanggal, berakhir, setBerakhir, setFile, busy, formError,
    jabatanList, fJabatanId, setFJabatanId, fTanggalMulai, setFTanggalMulai,
    fAnggotaSearch, setFAnggotaSearch, fMode, setFMode, fHasilAnggota, fLoadingAnggota,
    fAnggotaTerpilih, setFAnggotaTerpilih, fKonfirmasi, setFKonfirmasi,
    isNational, effLevel, formLevels,
    wilayahProvinsi, wilayahKabupaten, loadingKabWilayah, ubahProvinsi, simpan,
  } = form;

  return (
    <form onSubmit={simpan} className="mb-5 rounded-2xl border border-kipan-border bg-white p-5 shadow-sm sm:p-6">
      <p className="mb-2 text-base font-bold text-kipan-text-dark">Buat Surat Keputusan</p>
      <div className="mb-4">
        <Alert kind="warning">
          Alur SK: <b>Buat (Draf)</b> → <b>Susun Pengurus</b> → <b>Ajukan</b> → sahkan (final &amp; terkunci). Aturan SK Tunggal:
          mengajukan &amp; menyetujui SK baru otomatis menonaktifkan SK lama selevel &amp; wilayah beserta pengurusnya (Demisioner).
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
            onChange={(e) => { setTanggal(e.target.value); if (!fTanggalMulai) setFTanggalMulai(e.target.value); }}
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
              <SelectInput value={fLevel} onChange={setFLevel} id="sk-level" placeholder="Pilih level" options={formLevels} />
            </Field>
            <div className="hidden sm:block" />
            {fLevel !== 'NASIONAL' && (
              <Field label="Provinsi" required>
                <SelectInput
                  value={fProvinsi}
                  onChange={ubahProvinsi}
                  id="sk-provinsi"
                  placeholder="Pilih provinsi"
                  options={wilayahProvinsi.map((p) => ({ value: String(p.id), label: p.nama }))}
                />
              </Field>
            )}
            {fLevel === 'KABUPATEN' && (
              <Field label="Kabupaten/Kota" required>
                <SelectInput
                  value={fKabupaten}
                  onChange={setFKabupaten}
                  id="sk-kabupaten"
                  placeholder={loadingKabWilayah ? 'Memuat...' : 'Pilih kabupaten/kota'}
                  options={wilayahKabupaten.map((k) => ({ value: String(k.id), label: k.nama }))}
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

        <div className="sm:col-span-2 mt-2 rounded-xl border border-kipan-border bg-kipan-soft-gray p-4">
          <p className="text-sm font-bold text-kipan-text-dark">Kader yang diangkat</p>
          <p className="mt-1 text-xs text-kipan-text-muted">
            Pilih kader + jabatan. SK tersimpan sebagai <b>Draf</b> &amp; kader langsung diangkat; ajukan SK dari halaman detail.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Jabatan" required hint={`Level ${effLevel || '-'}`}>
              <SelectInput value={fJabatanId} onChange={setFJabatanId} placeholder="Pilih jabatan" id="sk-jabatan" options={jabatanList.map((j) => ({ value: String(j.id), label: `${j.nama}${j.is_inti ? ' (inti)' : ''}` }))} />
            </Field>
            <Field label="Tanggal Mulai Jabatan" required>
              <input type="date" id="sk-mulai" value={fTanggalMulai} onChange={(e) => setFTanggalMulai(e.target.value)} className="w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20" />
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-2 flex rounded-lg bg-white p-1 text-xs font-semibold">
                <button type="button" onClick={() => setFMode('anggota')} className={`flex-1 rounded-md py-1.5 ${fMode === 'anggota' ? 'bg-kipan-navy text-white' : 'text-kipan-text-muted hover:bg-kipan-soft-blue'}`}>Dari Anggota (Baru)</button>
                <button type="button" onClick={() => setFMode('promosi')} className={`flex-1 rounded-md py-1.5 ${fMode === 'promosi' ? 'bg-kipan-navy text-white' : 'text-kipan-text-muted hover:bg-kipan-soft-blue'}`}>Promosi Pengurus</button>
              </div>
              <Field label="Cari Kader (nama / NIA)" required hint={fMode === 'anggota' ? 'Hanya anggota AKTIF di wilayah SK' : 'Anggota ber-riwayat pengurus yang tidak sedang aktif'}>
                <TextInput value={fAnggotaSearch} onChange={setFAnggotaSearch} placeholder="Ketik minimal 2 karakter" id="sk-cari-kader" />
              </Field>
              {fLoadingAnggota ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-kipan-text-muted"><Spinner size={15} /> Mencari...</div>
              ) : fHasilAnggota.length > 0 ? (
                <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-kipan-border bg-white">
                  {fHasilAnggota.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setFAnggotaTerpilih(a)}
                      className={`flex w-full flex-col items-start px-4 py-2.5 text-left text-sm hover:bg-kipan-soft-blue ${fAnggotaTerpilih?.id === a.id ? 'bg-kipan-soft-blue font-semibold' : ''}`}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span>{a.nama_lengkap}</span>
                        <span className="font-mono text-xs text-kipan-text-muted">{a.nia}</span>
                      </span>
                      {a.info && <span className="text-[10px] font-semibold text-amber-600">{a.info}</span>}
                    </button>
                  ))}
                </div>
              ) : null}
              {fAnggotaTerpilih && <p className="mt-2 text-xs font-semibold text-kipan-green">Terpilih: {fAnggotaTerpilih.nama_lengkap} ({fAnggotaTerpilih.nia})</p>}
            </div>
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm text-kipan-text-dark">
            <input type="checkbox" checked={fKonfirmasi} onChange={(e) => setFKonfirmasi(e.target.checked)} className="mt-0.5 h-4 w-4 accent-kipan-navy" />
            Saya mengonfirmasi kader ini layak diangkat (penilaian kelayakan di luar sistem).
          </label>
        </div>
      </div>
      <div className="mt-4">
        <Button variant="accent" type="submit" disabled={busy}>
          {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Menyimpan...</span> : 'Simpan SK'}
        </Button>
      </div>
    </form>
  );
}
