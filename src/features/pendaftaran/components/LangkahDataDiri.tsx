import { AGAMA_OPTIONS, PENDIDIKAN_OPTIONS } from '../constants/pilihan';
import type { DaftarForm } from '../hooks/useDaftarForm';
import { Field, SelectInput, TextArea, TextInput } from './fields';

export default function LangkahDataDiri({ form }: { form: DaftarForm }) {
  const {
    nama, setNama, nik, setNik, tempat, setTempat, tanggal, setTanggal,
    jk, setJk, agama, setAgama, pendidikan, setPendidikan, pekerjaan, setPekerjaan,
    alamat, setAlamat, prov, setProv, kab, setKab, kec, setKec, desa, setDesa,
    kodepos, setKodepos, bindText, markTouched, visibleError, isInvalid,
    provinsi, kabupaten, kecamatan, desaList, kodeposList,
    loadingKab, loadingKec, loadingDesa, loadingKodepos, pilihProvinsi,
  } = form;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Nama Lengkap" required error={visibleError('nama')}>
          <TextInput value={nama} {...bindText('nama', setNama)} placeholder="Sesuai KTP" maxLength={150} id="f-nama" invalid={isInvalid('nama')} />
        </Field>
      </div>
      <Field label="NIK" required error={visibleError('nik')} hint="16 digit angka">
        <TextInput value={nik} onChange={(v) => setNik(v.replace(/\D/g, '').slice(0, 16))} onBlur={() => markTouched('nik')} inputMode="numeric" maxLength={16} id="f-nik" invalid={isInvalid('nik')} />
      </Field>
      <Field label="Tempat Lahir" required error={visibleError('tempat')}>
        <TextInput value={tempat} {...bindText('tempat', setTempat)} maxLength={100} id="f-tempat" invalid={isInvalid('tempat')} />
      </Field>
      <Field label="Tanggal Lahir" required error={visibleError('tanggal')} hint="Usia 16-30 tahun">
        <input
          type="date"
          id="f-tanggal"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          onBlur={() => markTouched('tanggal')}
          aria-invalid={isInvalid('tanggal') || undefined}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-kipan-text-dark focus:outline-none focus:ring-2 ${isInvalid('tanggal') ? 'border-kipan-red focus:border-kipan-red focus:ring-kipan-red/20' : 'border-kipan-border focus:border-kipan-blue focus:ring-kipan-blue/20'}`}
        />
      </Field>
      <Field label="Jenis Kelamin" required error={visibleError('jk')}>
        <SelectInput
          value={jk}
          onChange={(v) => setJk(v)}
          onBlur={() => markTouched('jk')}
          id="f-jk"
          invalid={isInvalid('jk')}
          placeholder="Pilih"
          options={[
            { value: 'L', label: 'Laki-laki' },
            { value: 'P', label: 'Perempuan' },
          ]}
        />
      </Field>
      <Field label="Agama" required error={visibleError('agama')}>
        <SelectInput
          value={agama}
          onChange={(v) => setAgama(v)}
          onBlur={() => markTouched('agama')}
          id="f-agama"
          invalid={isInvalid('agama')}
          placeholder="Pilih agama"
          options={AGAMA_OPTIONS}
        />
      </Field>
      <Field label="Pendidikan Terakhir" required error={visibleError('pendidikan')}>
        <SelectInput
          value={pendidikan}
          onChange={(v) => setPendidikan(v)}
          onBlur={() => markTouched('pendidikan')}
          id="f-pendidikan"
          invalid={isInvalid('pendidikan')}
          placeholder="Pilih pendidikan"
          options={PENDIDIKAN_OPTIONS}
        />
      </Field>
      <Field label="Pekerjaan" required error={visibleError('pekerjaan')}>
        <TextInput value={pekerjaan} {...bindText('pekerjaan', setPekerjaan)} maxLength={100} id="f-pekerjaan" invalid={isInvalid('pekerjaan')} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Alamat Lengkap (Sesuai KTP)" required error={visibleError('alamat')}>
          <TextArea value={alamat} {...bindText('alamat', setAlamat)} placeholder="Jalan, nomor rumah, RT/RW" id="f-alamat" invalid={isInvalid('alamat')} />
        </Field>
      </div>
      <Field label="Provinsi" required error={visibleError('prov')}>
        <SelectInput
          value={prov}
          onChange={(v) => {
            setProv(v);
            setKab('');
            setKec('');
            setDesa('');
            setKodepos('');
            void pilihProvinsi(Number(v));
          }}
          onBlur={() => markTouched('prov')}
          id="f-prov"
          invalid={isInvalid('prov')}
          placeholder="Pilih provinsi"
          options={provinsi.map((p) => ({ value: String(p.id), label: p.nama }))}
        />
      </Field>
      <Field label="Kota / Kabupaten" required error={visibleError('kab')}>
        <SelectInput
          value={kab}
          onChange={(v) => {
            setKab(v);
            setKec('');
            setDesa('');
            setKodepos('');
          }}
          onBlur={() => markTouched('kab')}
          id="f-kab"
          invalid={isInvalid('kab')}
          placeholder={loadingKab ? 'Memuat...' : 'Pilih kabupaten/kota'}
          disabled={!prov || loadingKab}
          options={kabupaten.map((k) => ({ value: String(k.id), label: k.nama }))}
        />
      </Field>
      <Field label="Kecamatan" required error={visibleError('kec')}>
        {(() => {
          const opts = kecamatan.map((k) => ({ value: k.nama, label: k.nama }));
          const cocok = kec === '' || opts.some((o) => o.value === kec);
          if (kecamatan.length > 0 && cocok) {
            return (
              <SelectInput
                value={kec}
                onChange={(v) => setKec(v)}
                onBlur={() => markTouched('kec')}
                id="f-kec"
                invalid={isInvalid('kec')}
                placeholder={loadingKec ? 'Memuat...' : 'Pilih kecamatan'}
                disabled={!kab || loadingKec}
                options={opts}
              />
            );
          }
          return <TextInput value={kec} {...bindText('kec', setKec)} maxLength={100} id="f-kec" invalid={isInvalid('kec')} />;
        })()}
      </Field>
      <Field label="Desa / Kelurahan" required error={visibleError('desa')}>
        {(() => {
          const opts = desaList.map((d) => ({ value: d.nama, label: d.nama }));
          const cocok = desa === '' || opts.some((o) => o.value === desa);
          if (desaList.length > 0 && cocok) {
            return (
              <SelectInput
                value={desa}
                onChange={(v) => setDesa(v)}
                onBlur={() => markTouched('desa')}
                id="f-desa"
                invalid={isInvalid('desa')}
                placeholder={loadingDesa ? 'Memuat...' : 'Pilih desa/kelurahan'}
                disabled={!kec || loadingDesa}
                options={opts}
              />
            );
          }
          return <TextInput value={desa} {...bindText('desa', setDesa)} maxLength={100} id="f-desa" invalid={isInvalid('desa')} />;
        })()}
      </Field>
      <Field label="Kode Pos" required error={visibleError('kodepos')} hint="5 digit angka">
        {(() => {
          const opts = kodeposList.map((k) => ({ value: k.kode_pos, label: k.kode_pos }));
          const cocok = kodepos === '' || opts.some((o) => o.value === kodepos);
          if (kodeposList.length > 0 && cocok) {
            return (
              <SelectInput
                value={kodepos}
                onChange={(v) => setKodepos(v)}
                onBlur={() => markTouched('kodepos')}
                id="f-kodepos"
                invalid={isInvalid('kodepos')}
                placeholder={loadingKodepos ? 'Memuat...' : 'Pilih kode pos'}
                disabled={!desa || loadingKodepos}
                options={opts}
              />
            );
          }
          return <TextInput value={kodepos} onChange={(v) => setKodepos(v.replace(/\D/g, '').slice(0, 5))} onBlur={() => markTouched('kodepos')} inputMode="numeric" maxLength={5} id="f-kodepos" invalid={isInvalid('kodepos')} />;
        })()}
      </Field>
    </div>
  );
}
