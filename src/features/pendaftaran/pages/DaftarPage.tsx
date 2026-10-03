import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '@/components/Layout/LandingLayout';
import Button from '@/components/ui/button';
import { Spinner, Overlay } from '@/components/ui/loading';
import { ApiError } from '@/services/apiClient';
import { DOKUMEN_LIST, isDokumenWajib } from '../constants/dokumen';
import { PERSYARATAN } from '../constants/persyaratan';
import { fileSig, pdfLocked } from '../hooks/useDokumenCheck';
import { submitPendaftaran } from '../api/pendaftaranService';
import { uploadDokumen } from '../api/storageService';
import { useOtp } from '../hooks/useOtp';
import { saveRegistration } from '@/features/tracking/lib/registrationHistory';
import { clearDraft, loadDraft, saveDraft, type RegDraft } from '../lib/draft';
import { ageOf, hasAngleBracket, isPlausibleNIKDate, validators } from '../hooks/useValidation';
import { useWilayah } from '../hooks/useWilayah';
import type { DokumenCategory, PendaftaranCreated } from '../types';
import { Alert, Field, SelectInput, Stepper, TextArea, TextInput } from '../components/fields';

// FIELD_MAP memetakan nama field backend (JSON Go) ke kunci error form,
// agar pesan validasi server (422 per-field) tampil di input yang tepat.
const FIELD_MAP: Record<string, string> = {
  nama_lengkap: 'nama',
  nik: 'nik',
  tempat_lahir: 'tempat',
  tanggal_lahir: 'tanggal',
  jenis_kelamin: 'jk',
  agama: 'agama',
  pendidikan: 'pendidikan',
  pekerjaan: 'pekerjaan',
  alamat: 'alamat',
  provinsi_id: 'prov',
  kabupaten_id: 'kab',
  kecamatan: 'kec',
  desa: 'desa',
  kode_pos: 'kodepos',
  email: 'email',
  whatsapp: 'wa',
  wa_otp_token: 'otp',
  motivation: 'motivasi',
  foto_key: 'foto',
  ktp_key: 'ktp',
  cv_key: 'cv',
  surat_pernyataan_key: 'surat_pernyataan',
  surat_sehat_key: 'surat_sehat',
};

function mapServerFields(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[FIELD_MAP[k] ?? k] = v;
  }
  return out;
}

  // stepForKey menentukan langkah wizard yang memuat field error server,
  // agar pengguna otomatis dibawa ke input yang bermasalah.
  const STEP1_KEYS = ['nama', 'nik', 'tempat', 'tanggal', 'jk', 'agama', 'pendidikan', 'pekerjaan', 'alamat', 'prov', 'kab', 'kec', 'desa', 'kodepos'];
  const STEP2_KEYS = ['email', 'wa', 'otp', 'motivasi'];
  const STEP3_KEYS = ['foto', 'ktp', 'cv', 'surat_pernyataan', 'surat_sehat'];
  const STEP4_KEYS = ['persyaratan'];

function stepForKey(key: string): number {
  if (STEP1_KEYS.includes(key)) return 0;
  if (STEP2_KEYS.includes(key)) return 1;
  if (STEP3_KEYS.includes(key)) return 2;
  if (STEP4_KEYS.includes(key)) return 3;
  return 4;
}

// draftHasContent: draf dianggap berisi bila ada satu saja isian/dokumen
// atau sudah melewati langkah awal — agar banner "melanjutkan" tidak muncul
// untuk kunjungan pertama yang belum mengisi apa pun.
function draftHasContent(d: RegDraft | null): boolean {
  if (!d) return false;
  if (d.step > 0) return true;
  const textKeys: Array<keyof Omit<RegDraft, 'step' | 'docs'>> = [
    'nama', 'nik', 'tempat', 'tanggal', 'jk', 'agama', 'pendidikan', 'pekerjaan',
    'alamat', 'prov', 'kab', 'kec', 'desa', 'kodepos', 'email', 'wa', 'motivasi',
  ];
  if (textKeys.some((k) => d[k] && String(d[k]).trim() !== '')) return true;
  if ((d.persyaratan ?? []).length > 0) return true;
  return Object.values(d.docs ?? {}).some((s) => s && s.key !== '');
}



const STEPS = ['Data Diri', 'Kontak & OTP', 'Dokumen', 'Persyaratan', 'Kirim'];

interface DocState {
  key: string;
  name: string;
  sig: string;
  uploading: boolean;
  error: string | null;
}

const emptyDocs = (): Record<DokumenCategory, DocState> => ({
  foto: { key: '', name: '', sig: '', uploading: false, error: null },
  ktp: { key: '', name: '', sig: '', uploading: false, error: null },
  cv: { key: '', name: '', sig: '', uploading: false, error: null },
  sk: { key: '', name: '', sig: '', uploading: false, error: null },
  surat_pernyataan: { key: '', name: '', sig: '', uploading: false, error: null },
  surat_sehat: { key: '', name: '', sig: '', uploading: false, error: null },
});

export default function DaftarPage() {
  // Draf dari localStorage (bila ada) untuk memulihkan progres saat refresh.
  const [draft] = useState(() => loadDraft());
  // Dipulihkan ke langkah TERAKHIR draf. Token OTP tidak dipersist, jadi saat
  // Kirim pengguna diminta verifikasi OTP ulang (submit mengembalikan ke
  // langkah Kontak & OTP bila token hilang).
  const initStep = draft ? Math.max(0, Math.min(draft.step, STEPS.length - 1)) : 0;

  const [step, setStep] = useState(initStep);
  const [nama, setNama] = useState(draft?.nama ?? '');
  const [nik, setNik] = useState(draft?.nik ?? '');
  const [tempat, setTempat] = useState(draft?.tempat ?? '');
  const [tanggal, setTanggal] = useState(draft?.tanggal ?? '');
  const [jk, setJk] = useState(draft?.jk ?? '');
  const [agama, setAgama] = useState(draft?.agama ?? '');
  const [pendidikan, setPendidikan] = useState(draft?.pendidikan ?? '');
  const [pekerjaan, setPekerjaan] = useState(draft?.pekerjaan ?? '');
  const [alamat, setAlamat] = useState(draft?.alamat ?? '');
  const [prov, setProv] = useState(draft?.prov ?? '');
  const [kab, setKab] = useState(draft?.kab ?? '');
  const [kec, setKec] = useState(draft?.kec ?? '');
  const [desa, setDesa] = useState(draft?.desa ?? '');
  const [kodepos, setKodepos] = useState(draft?.kodepos ?? '');
  const [email, setEmail] = useState(draft?.email ?? '');
  const [wa, setWa] = useState(draft?.wa ?? '');
  const [kode, setKode] = useState('');
  const [motivasi, setMotivasi] = useState(draft?.motivasi ?? '');
  const [persyaratan, setPersyaratan] = useState<string[]>(draft?.persyaratan ?? []);
  const [docs, setDocs] = useState<Record<DokumenCategory, DocState>>(() => {
    const base = emptyDocs();
    if (draft?.docs) {
      for (const cat of Object.keys(base) as DokumenCategory[]) {
        const saved = draft.docs[cat];
        if (saved?.key) base[cat] = { key: saved.key, name: saved.name, sig: '', uploading: false, error: null };
      }
    }
    return base;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // touched: field yang sudah disentuh pengguna. Error hanya ditampilkan
  // bila field touched ATAU form sudah pernah disubmit (submitted).
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  function markTouched(key: string): void {
    setTouched((p) => (p[key] ? p : { ...p, [key]: true }));
  }

  function touchStep(s: number): void {
    const keys: string[] = s === 0 ? STEP1_KEYS : s === 1 ? STEP2_KEYS : s === 2 ? STEP3_KEYS : s === 3 ? STEP4_KEYS : [];
    setTouched((p) => {
      const next: Record<string, boolean> = { ...p };
      for (const k of keys) next[k] = true;
      return next;
    });
  }

  function touchAll(): void {
    setSubmitted(true);
    setTouched((p) => {
      const next: Record<string, boolean> = { ...p };
      for (const k of [...STEP1_KEYS, ...STEP2_KEYS, ...STEP3_KEYS, ...STEP4_KEYS]) next[k] = true;
      return next;
    });
  }

  function visibleError(key: string): string | undefined {
    const e = errors[key];
    if (!e) return undefined;
    return submitted || touched[key] ? e : undefined;
  }

  function isInvalid(key: string): boolean {
    return visibleError(key) !== undefined;
  }


  // bindText: onChange murni (setter) + onBlur menandai touched.
  // Validasi live ditangani SATU useEffect terpusat (state fresh) agar tidak
  // membaca state basi dalam handler yang sama.
  function bindText(key: string, setter: (v: string) => void): {
    onChange: (v: string) => void;
    onBlur: () => void;
  } {
    return {
      onChange: (v: string) => {
        setter(v);
      },
      onBlur: () => {
        markTouched(key);
      },
    };
  }

  const { provinsi, kabupaten, kecamatan, desaList, kodeposList, loadingKab, loadingKec, loadingDesa, loadingKodepos, error: wilayahError, pilihProvinsi, loadKecamatan, loadDesa, loadKodepos } = useWilayah();
  const otp = useOtp();

  // Live validation terpusat: berjalan setiap nilai berubah (atau touched /
  // submitted berubah), memvalidasi langkah AKTIF dengan state terbaru.
  // Tidak loop: deps adalah values, bukan errors hasil setErrors.
  const liveValues = [
    nama, nik, tempat, tanggal, jk, agama, pendidikan, pekerjaan, alamat,
    prov, kab, kec, desa, kodepos, email, wa, motivasi, step, submitted,
    otp.verifiedToken ?? '', JSON.stringify(Object.keys(docs).map((c) => docs[c as DokumenCategory].key)),
    JSON.stringify(persyaratan),
    JSON.stringify(touched),
  ].join('|');
  useEffect(() => {
    if (!submitted && Object.keys(touched).length === 0) return;
    if (step === 0) validDataDiri();
    else if (step === 1) validKontak();
    else if (step === 2) validDokumen();
    else if (step === 3) validPersyaratan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveValues]);
  const [umum, setUmum] = useState<string | null>(null);
  const [kirim, setKirim] = useState(false);
  const [hasil, setHasil] = useState<PendaftaranCreated | null>(null);

  // Muat ulang kabupaten bila provinsi dipulihkan dari draf.
  useEffect(() => {
    if (draft?.prov) void pilihProvinsi(Number(draft.prov));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Muat saran kecamatan setiap kabupaten terpilih (termasuk pulihan draf).
  // Kode BPS diambil dari daftar kabupaten yang sudah dimuat; kosong/tak
  // ketemu = daftar dikosongkan (form fallback ke ketik manual).
  useEffect(() => {
    const kode = kab ? (kabupaten.find((k) => String(k.id) === kab)?.kode ?? '') : '';
    void loadKecamatan(kode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kab, kabupaten]);

  // Muat saran desa setiap kecamatan terpilih. Nilai desa lama dibuang saat
  // kecamatan berganti (desa milik kecamatan lain = basi).
  const prevKec = useRef(kec);
  useEffect(() => {
    if (prevKec.current !== kec) {
      prevKec.current = kec;
      setDesa('');
    }
    const kode = kec ? (kecamatan.find((k) => k.nama === kec)?.kode ?? '') : '';
    void loadDesa(kode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kec, kecamatan]);

  // Muat saran kode pos setiap desa terpilih. Nilai kode pos lama dibuang
  // saat desa berganti. Nama kabupaten diambil dari daftar yang dimuat.
  const prevDesa = useRef(desa);
  useEffect(() => {
    if (prevDesa.current !== desa) {
      prevDesa.current = desa;
      setKodepos('');
    }
    const kabNama = kab ? (kabupaten.find((k) => String(k.id) === kab)?.nama ?? '') : '';
    void loadKodepos(desa, kec, kabNama);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desa, kec, kabupaten]);

  // Simpan draf setiap perubahan agar refresh tidak menghilangkan progres.
  useEffect(() => {
    if (hasil) return;
    const draftDocs = Object.fromEntries(
      (Object.keys(docs) as DokumenCategory[]).map((c) => [c, { key: docs[c].key, name: docs[c].name }]),
    ) as RegDraft['docs'];
    saveDraft({
      step, nama, nik, tempat, tanggal, jk, agama, pendidikan, pekerjaan, alamat,
      prov, kab, kec, desa, kodepos, email, wa, motivasi, persyaratan, docs: draftDocs,
    });
  }, [step, nama, nik, tempat, tanggal, jk, agama, pendidikan, pekerjaan, alamat,
    prov, kab, kec, desa, kodepos, email, wa, motivasi, persyaratan, docs, hasil]);

  function validDataDiri(): boolean {
    const e: Record<string, string> = {};
    if (nama.trim().length < 3 || nama.trim().length > 150) e.nama = 'Nama lengkap wajib 3-150 karakter';
    else if (hasAngleBracket(nama)) e.nama = 'Nama tidak boleh mengandung < atau >';
    const n = nik.trim();
    if (!validators.NIK_RE.test(n)) e.nik = 'NIK harus 16 digit angka';
    else if (!isPlausibleNIKDate(n)) e.nik = 'Segmen tanggal lahir pada NIK tidak valid';
    if (!tempat.trim() || tempat.trim().length > 100) e.tempat = 'Tempat lahir wajib diisi (maks 100)';
    const age = tanggal ? ageOf(`${tanggal}T00:00:00`) : null;
    if (age === null) e.tanggal = 'Tanggal lahir wajib diisi';
    else if (age < 16 || age > 30) e.tanggal = 'Usia pendaftar harus 16-30 tahun';
    if (jk !== 'L' && jk !== 'P') e.jk = 'Pilih jenis kelamin';
    for (const [k, v, label] of [['agama', agama, 'Agama'], ['pendidikan', pendidikan, 'Pendidikan'], ['pekerjaan', pekerjaan, 'Pekerjaan']] as const) {
      if (!v.trim()) e[k] = `${label} wajib diisi`;
      else if (v.trim().length > 100) e[k] = `${label} melebihi batas karakter`;
      else if (hasAngleBracket(v)) e[k] = `${label} tidak boleh mengandung < atau >`;
    }
    const al = alamat.trim();
    if (al.length < 10 || al.length > 2000) e.alamat = 'Alamat wajib 10-2000 karakter';
    if (!prov) e.prov = 'Pilih provinsi';
    if (!kab) e.kab = 'Pilih kabupaten/kota';
    if (!kec.trim() || kec.trim().length > 100) e.kec = 'Kecamatan wajib diisi (maks 100)';
    if (!desa.trim() || desa.trim().length > 100) e.desa = 'Desa wajib diisi (maks 100)';
    if (!validators.KODE_POS_RE.test(kodepos.trim())) e.kodepos = 'Kode pos wajib 5 digit angka';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validKontak(): boolean {
    const e: Record<string, string> = {};
    const em = email.trim();
    if (em.length < 5 || em.length > 255 || !validators.EMAIL_RE.test(em)) e.email = 'Format email tidak valid';
    if (!validators.WA_RE.test(wa.trim())) e.wa = 'Nomor WhatsApp tidak valid (contoh: 081234567890)';
    else if (!otp.verifiedToken || otp.verifiedToken === null) e.otp = 'Verifikasi OTP WhatsApp wajib diselesaikan';
    const m = motivasi.trim();
    if (m.length < 20 || m.length > 1000) e.motivasi = 'Motivasi wajib 20-1000 karakter';
    else if (hasAngleBracket(m)) e.motivasi = 'Motivasi tidak boleh mengandung < atau >';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validDokumen(): boolean {
    const e: Record<string, string> = {};
    for (const d of DOKUMEN_LIST) {
      if (!isDokumenWajib(d.category)) continue;
      const st = docs[d.category];
      // Slot yang masih mengunggah ikut diblokir agar Lanjut tak lolos prematur.
      if (st.uploading) {
        e[d.category] = `${d.label} masih mengunggah, tunggu hingga selesai`;
      } else if (!st.key) {
        e[d.category] = `${d.label} wajib diunggah`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validPersyaratan(): boolean {
    const e: Record<string, string> = {};
    if (persyaratan.length < PERSYARATAN.length) {
      e.persyaratan = 'Centang seluruh persyaratan untuk melanjutkan';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function togglePersyaratan(title: string): void {
    setPersyaratan((p) => (p.includes(title) ? p.filter((t) => t !== title) : [...p, title]));
    markTouched('persyaratan');
  }

  function lanjut(): void {
    setUmum(null);
    setSubmitted(true);
    touchStep(step);
    if (step === 0 && !validDataDiri()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (step === 1 && !validKontak()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (step === 2 && !validDokumen()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (step === 3 && !validPersyaratan()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function mundur(): void {
    setUmum(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function unggah(category: DokumenCategory, file: File): Promise<void> {
    const cfg = DOKUMEN_LIST.find((d) => d.category === category);
    if (!cfg) return;
    // File BARU membatalkan state lama slot ini seketika (key/nama/sig lama
    // dibuang), sehingga validasi gagal tidak pernah meninggalkan key basi
    // yang membuat Lanjut tetap lolos.
    setDocs((p) => ({ ...p, [category]: { key: '', name: file.name, sig: '', uploading: false, error: null } }));
    // L9: berkas yang sama (nama+ukuran+waktu) tidak boleh dipakai di 2 slot.
    const sig = fileSig(file);
    const dipakai = (Object.entries(docs) as Array<[DokumenCategory, DocState]>).find(
      ([cat, st]) => cat !== category && st.sig !== '' && st.sig === sig,
    );
    if (dipakai) {
      const label = DOKUMEN_LIST.find((d) => d.category === dipakai[0])?.label ?? dipakai[0];
      setDocs((p) => ({ ...p, [category]: { key: '', name: file.name, sig: '', error: `Berkas yang sama sudah dipakai di ${label}` } }));
      return;
    }
    // L9: PDF terkunci ditolak sebelum upload (server juga menolak — L8).
    if (file.type === 'application/pdf' && (await pdfLocked(file))) {
      setDocs((p) => ({ ...p, [category]: { key: '', name: file.name, sig: '', uploading: false, error: 'PDF terkunci password. Unggah versi tanpa password.' } }));
      return;
    }
    if (file.size > cfg.maxBytes) {
      setDocs((p) => ({ ...p, [category]: { key: '', name: file.name, sig: '', uploading: false, error: `Ukuran melebihi ${Math.round(cfg.maxBytes / 1048576)} MB` } }));
      return;
    }
    setDocs((p) => ({ ...p, [category]: { key: '', name: file.name, sig, uploading: true, error: null } }));
    try {
      const key = await uploadDokumen(category, file);
      setDocs((p) => ({ ...p, [category]: { key, name: file.name, sig, uploading: false, error: null } }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unggah gagal';
      setDocs((p) => ({
        ...p,
        [category]: { key: '', name: file.name, sig: '', uploading: false, error: msg },
      }));
    }
  }

  async function submit(): Promise<void> {
    setUmum(null);
    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    touchAll();

    // Validasi ulang SEMUA langkah sebelum kirim (defensif: data bisa saja
    // dipulihkan dari draf, atau pengguna melompat langkah). Berhenti di
    // langkah gagal pertama agar pesan error tepat terlihat.
    if (!validDataDiri()) {
      setStep(0);
      setUmum('Data Diri belum lengkap/valid. Periksa kolom yang ditandai merah.');
      scrollTop();
      return;
    }
    if (!validKontak()) {
      setStep(1);
      setUmum('Kontak & Verifikasi WhatsApp belum lengkap/valid. Periksa kolom yang ditandai merah.');
      scrollTop();
      return;
    }
    if (!validDokumen()) {
      setStep(2);
      setUmum('Masih ada dokumen wajib yang belum diunggah. Lengkapi berkas yang ditandai merah.');
      scrollTop();
      return;
    }
    if (!validPersyaratan()) {
      setStep(3);
      setUmum('Centang seluruh persyaratan untuk melanjutkan.');
      scrollTop();
      return;
    }
    if (!otp.verifiedToken) {
      setStep(1);
      setUmum('Sesi verifikasi WhatsApp hilang. Minta & masukkan ulang kode OTP.');
      scrollTop();
      return;
    }

    setKirim(true);
    try {
      const res = await submitPendaftaran({
        tipe_pendaftaran: 'KADER',
        nama_lengkap: nama.trim(),
        nik: nik.trim(),
        tempat_lahir: tempat.trim(),
        tanggal_lahir: new Date(`${tanggal}T00:00:00+07:00`).toISOString(),
        jenis_kelamin: jk as 'L' | 'P',
        agama: agama.trim(),
        pendidikan: pendidikan.trim(),
        pekerjaan: pekerjaan.trim(),
        alamat: alamat.trim(),
        provinsi_id: Number(prov),
        kabupaten_id: Number(kab),
        kecamatan: kec.trim(),
        desa: desa.trim(),
        kode_pos: kodepos.trim(),
        email: email.trim(),
        whatsapp: wa.trim(),
        wa_otp_token: otp.verifiedToken,
        motivation: motivasi.trim(),
        persyaratan,
        foto_key: docs.foto.key,
        ktp_key: docs.ktp.key,
        cv_key: docs.cv.key,
        surat_pernyataan_key: docs.surat_pernyataan.key,
        surat_sehat_key: docs.surat_sehat.key,
      });
      saveRegistration({
        nomor: res.nomor_pendaftaran,
        nama: nama.trim(),
        tipe: 'KADER',
        email: email.trim(),
        whatsapp: wa.trim(),
      });
      clearDraft();
      setHasil(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const mapped = mapServerFields(err.fields);
        const keys = Object.keys(mapped);
        // Jump ke langkah error pertama (bila ada error per-field).
        if (keys.length > 0) {
          setErrors(mapped);
          setStep(stepForKey(keys[0]));
          setUmum(`${err.message} Periksa kolom yang ditandai merah.`);
        } else {
          setUmum(err.message);
        }
      } else {
        setUmum(err instanceof Error ? err.message : 'Pengiriman gagal. Coba lagi.');
      }
      // Selalu tampilkan pesan di atas agar terlihat.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setKirim(false);
    }
  }

  if (hasil) {
    return (
      <LandingLayout>
        <section className="bg-kipan-soft-gray py-28 pt-36">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <div className="rounded-2xl border border-kipan-border bg-white p-8 shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kipan-green text-2xl text-white">✓</span>
              <h1 className="mt-4 font-serif text-2xl font-bold text-kipan-text-dark sm:text-3xl">Pendaftaran Terkirim</h1>
              <p className="mt-2 text-sm text-kipan-text-muted">Simpan nomor pendaftaran untuk pelacakan mandiri. Nomor ini juga dikirim ke WhatsApp Anda.</p>
              <p className="mx-auto mt-5 w-fit rounded-lg bg-kipan-navy px-6 py-3 font-mono text-lg font-bold tracking-wider text-white">
                {hasil.nomor_pendaftaran}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button to="/lacak" variant="primary">Lacak Status</Button>
                <Button to="/" variant="outline-navy">Kembali ke Beranda</Button>
              </div>
            </div>
          </div>
        </section>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <section className="bg-kipan-soft-gray py-14 pt-28 sm:pt-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-kipan-blue">Formulir Pendaftaran</p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-kipan-text-dark sm:text-4xl">
            Daftar sebagai Kader
          </h1>
          <div className="mt-8">
            <Stepper steps={STEPS} active={step} />
          </div>

          {draftHasContent(draft) && !hasil && (
            <div className="mt-4">
              <Alert kind="info">
                Melanjutkan isian yang tersimpan otomatis di perangkat ini.{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Hapus draf tersimpan dan mulai dari awal?')) {
                      clearDraft();
                      window.location.reload();
                    }
                  }}
                  className="font-bold underline hover:text-kipan-navy"
                >
                  Mulai dari awal
                </button>
              </Alert>
            </div>
          )}

          {umum && (
            <div className="mt-6">
              <Alert kind="error">{umum}</Alert>
            </div>
          )}
          {wilayahError && (
            <div className="mt-4">
              <Alert kind="error">{wilayahError}</Alert>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-kipan-border bg-white p-6 shadow-sm sm:p-8">
            {step === 0 && (
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
                  <TextInput value={agama} {...bindText('agama', setAgama)} maxLength={100} id="f-agama" invalid={isInvalid('agama')} />
                </Field>
                <Field label="Pendidikan Terakhir" required error={visibleError('pendidikan')}>
                  <TextInput value={pendidikan} {...bindText('pendidikan', setPendidikan)} placeholder="cth: SMA, S1" maxLength={100} id="f-pendidikan" invalid={isInvalid('pendidikan')} />
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
            )}

            {step === 1 && (
              <div className="grid gap-5">
                <Field label="Email" required error={visibleError('email')} hint="Untuk akun & reset password">
                  <TextInput value={email} {...bindText('email', setEmail)} inputMode="email" maxLength={255} id="f-email" invalid={isInvalid('email')} />
                </Field>
                <Field label="Nomor WhatsApp" required error={visibleError('wa')} hint="Contoh: 081234567890">
                  <TextInput value={wa} onChange={(v) => { setWa(v); otp.resetUntuk(v); }} onBlur={() => markTouched('wa')} inputMode="tel" maxLength={16} id="f-wa" invalid={isInvalid('wa')} />
                </Field>
                <div className="rounded-xl border border-kipan-border bg-kipan-soft-blue p-4">
                  <p className="text-sm font-bold text-kipan-navy">Verifikasi OTP WhatsApp</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline-navy" disabled={otp.sending || otp.cooldown > 0} onClick={() => void otp.kirim(wa)}>
                      {otp.sending ? (<span className="inline-flex items-center gap-2"><Spinner size={15} /> Mengirim...</span>) : otp.cooldown > 0 ? `Kirim ulang (${otp.cooldown}s)` : 'Kirim Kode OTP'}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={kode}
                      id="f-otp"
                      onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit kode"
                      inputMode="numeric"
                      maxLength={6}
                      aria-invalid={isInvalid('otp') || undefined}
                      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 sm:max-w-[220px] ${isInvalid('otp') ? 'border-kipan-red focus:border-kipan-red focus:ring-kipan-red/20' : 'border-kipan-border focus:border-kipan-blue focus:ring-kipan-blue/20'}`}
                    />
                    <Button variant="primary" disabled={otp.verifying || kode.length !== 6} onClick={() => void otp.verifikasi(wa, kode)}>
                      {otp.verifying ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memeriksa...</span>) : 'Verifikasi'}
                    </Button>
                  </div>
                  {otp.error && <p className="mt-2 text-xs font-medium text-kipan-red">{otp.error}</p>}
                  {otp.verifiedToken && <p className="mt-2 text-xs font-semibold text-kipan-green">✓ Nomor terverifikasi. Token berlaku 15 menit.</p>}
                  {visibleError('otp') && <p className="mt-2 text-xs font-medium text-kipan-red">{visibleError('otp')}</p>}
                </div>
                <Field label="Motivasi Bergabung dengan KIPAN" required error={visibleError('motivasi')} hint="20-1000 karakter">
                  <TextArea value={motivasi} {...bindText('motivasi', setMotivasi)} rows={5} id="f-motivasi" invalid={isInvalid('motivasi')} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5">
                {DOKUMEN_LIST.map((d) => (
                  <div key={d.category} className="rounded-xl border border-kipan-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-kipan-text-dark">
                          {d.label} <span className="text-kipan-red">*</span>
                        </p>
                        <p className="text-xs text-kipan-text-muted">{d.hint}</p>
                      </div>
                      {docs[d.category].key && <span className="text-lg text-kipan-green">✓</span>}
                    </div>
                    <input
                      type="file"
                      accept={d.accept}
                      disabled={docs[d.category].uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        // Reset value agar memilih berkas yang sama lagi tetap
                        // memicu onChange (mis. setelah gagal).
                        e.currentTarget.value = '';
                        if (f) void unggah(d.category, f);
                      }}
                      className="mt-3 block w-full text-sm text-kipan-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-kipan-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-kipan-blue disabled:opacity-60"
                    />
                    {docs[d.category].uploading && <p className="mt-2 inline-flex items-center gap-2 text-xs text-kipan-blue"><Spinner size={13} /> Mengunggah {docs[d.category].name}...</p>}
                    {docs[d.category].name && !docs[d.category].uploading && !docs[d.category].error && (
                      <p className="mt-2 truncate text-xs text-kipan-text-muted">{docs[d.category].name}</p>
                    )}
                    {(docs[d.category].error || errors[d.category]) && (
                      <p className="mt-2 text-xs font-medium text-kipan-red">{docs[d.category].error ?? errors[d.category]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-base font-bold text-kipan-text-dark">Persyaratan Keanggotaan</p>
                <p className="mt-1 text-sm text-kipan-text-muted">Centang seluruh persyaratan di bawah ini untuk melanjutkan.</p>
                <div className="mt-4 grid gap-3">
                  {PERSYARATAN.map((p) => {
                    const checked = persyaratan.includes(p.title);
                    return (
                      <label
                        key={p.title}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                          checked ? 'border-kipan-navy bg-kipan-soft-blue' : 'border-kipan-border hover:border-kipan-blue/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePersyaratan(p.title)}
                          className="mt-0.5 h-5 w-5 shrink-0 accent-kipan-navy"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-kipan-text-dark">{p.title}</span>
                          <span className="mt-0.5 block text-xs text-kipan-text-muted">{p.desc}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {visibleError('persyaratan') && (
                  <p className="mt-3 text-xs font-medium text-kipan-red">{visibleError('persyaratan')}</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <Alert kind="info">
                  Periksa kembali data. Dengan menekan Kirim, Anda menyatakan data benar dan dokumen asli.
                </Alert>
                <dl className="mt-5 grid gap-x-6 gap-y-3 rounded-xl border border-kipan-border bg-kipan-soft-gray p-5 text-sm sm:grid-cols-2">
                  <div><dt className="text-kipan-text-muted">Nama</dt><dd className="font-semibold">{nama}</dd></div>
                  <div><dt className="text-kipan-text-muted">NIK</dt><dd className="font-semibold">{nik}</dd></div>
                  <div><dt className="text-kipan-text-muted">TTL</dt><dd className="font-semibold">{tempat}, {tanggal}</dd></div>
                  <div><dt className="text-kipan-text-muted">Email</dt><dd className="font-semibold">{email}</dd></div>
                  <div><dt className="text-kipan-text-muted">WhatsApp</dt><dd className="font-semibold">{wa}</dd></div>
                  <div><dt className="text-kipan-text-muted">Wilayah</dt><dd className="font-semibold">{kec}, {desa}, {kodepos}</dd></div>
                  <div><dt className="text-kipan-text-muted">Dokumen</dt><dd className="font-semibold">{Object.values(docs).filter((d) => d.key).length} berkas terunggah</dd></div>
                </dl>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">
              <div>
                {step > 0 ? (
                  <Button variant="ghost" onClick={mundur}>← Kembali</Button>
                ) : (
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-kipan-blue hover:bg-kipan-soft-blue">
                      ← Beranda
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Kosongkan formulir dan mulai dari awal?')) {
                          clearDraft();
                          window.location.reload();
                        }
                      }}
                      className="text-xs font-semibold text-kipan-text-muted underline hover:text-kipan-red"
                    >
                      Kosongkan formulir
                    </button>
                  </div>
                )}
              </div>
              {step < 4 ? (
                <Button variant="primary" onClick={lanjut}>Lanjut →</Button>
              ) : (
                <Button variant="accent" disabled={kirim} onClick={() => void submit()}>
                  {kirim ? (<span className="inline-flex items-center gap-2"><Spinner size={15} /> Mengirim...</span>) : 'Kirim Pendaftaran'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      {kirim && <Overlay label="Mengirim pendaftaran... mohon tunggu, jangan tutup halaman ini." />}
    </LandingLayout>
  );
}
