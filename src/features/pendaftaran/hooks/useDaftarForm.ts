import { useEffect, useRef, useState } from 'react';
import type { DokumenCategory, PendaftaranCreated } from '../types';
import { loadDraft, saveDraft, type RegDraft } from '../lib/draft';
import { STEP1_KEYS, STEP2_KEYS, STEP3_KEYS, STEP4_KEYS } from '../lib/daftarMapping';
import { validDataDiri, validDokumen, validKontak, validPersyaratan } from '../lib/validasi';
import { useOtp } from './useOtp';
import { useWilayah } from './useWilayah';

export interface DocState {
  key: string;
  name: string;
  sig: string;
  uploading: boolean;
  error: string | null;
}

export const STEPS = ['Data Diri', 'Kontak & OTP', 'Dokumen', 'Persyaratan', 'Kirim'];

const emptyDocs = (): Record<DokumenCategory, DocState> => ({
  foto: { key: '', name: '', sig: '', uploading: false, error: null },
  ktp: { key: '', name: '', sig: '', uploading: false, error: null },
  cv: { key: '', name: '', sig: '', uploading: false, error: null },
  sk: { key: '', name: '', sig: '', uploading: false, error: null },
  surat_pernyataan: { key: '', name: '', sig: '', uploading: false, error: null },
  surat_sehat: { key: '', name: '', sig: '', uploading: false, error: null },
});

export interface BindText {
  onChange: (v: string) => void;
  onBlur: () => void;
}

// DaftarForm adalah SELURUH state + helper formulir pendaftaran.
// Komponen langkah menerima objek ini agar daftar props tetap ramping.
export interface DaftarForm {
  draft: RegDraft | null;
  step: number;
  setStep: (v: number | ((s: number) => number)) => void;
  nama: string; setNama: (v: string) => void;
  nik: string; setNik: (v: string) => void;
  tempat: string; setTempat: (v: string) => void;
  tanggal: string; setTanggal: (v: string) => void;
  jk: string; setJk: (v: string) => void;
  agama: string; setAgama: (v: string) => void;
  pendidikan: string; setPendidikan: (v: string) => void;
  pekerjaan: string; setPekerjaan: (v: string) => void;
  alamat: string; setAlamat: (v: string) => void;
  prov: string; setProv: (v: string) => void;
  kab: string; setKab: (v: string) => void;
  kec: string; setKec: (v: string) => void;
  desa: string; setDesa: (v: string) => void;
  kodepos: string; setKodepos: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  wa: string; setWa: (v: string) => void;
  kode: string; setKode: (v: string) => void;
  motivasi: string; setMotivasi: (v: string) => void;
  persyaratan: string[]; setPersyaratan: (v: string[] | ((p: string[]) => string[])) => void;
  docs: Record<DokumenCategory, DocState>;
  setDocs: (v: Record<DokumenCategory, DocState> | ((p: Record<DokumenCategory, DocState>) => Record<DokumenCategory, DocState>)) => void;
  errors: Record<string, string>;
  setErrors: (v: Record<string, string>) => void;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
  umum: string | null; setUmum: (v: string | null) => void;
  kirim: boolean; setKirim: (v: boolean) => void;
  hasil: PendaftaranCreated | null; setHasil: (v: PendaftaranCreated | null) => void;
  markTouched: (key: string) => void;
  touchStep: (s: number) => void;
  touchAll: () => void;
  visibleError: (key: string) => string | undefined;
  isInvalid: (key: string) => boolean;
  bindText: (key: string, setter: (v: string) => void) => BindText;
  togglePersyaratan: (title: string) => void;
  runValidDataDiri: () => boolean;
  runValidKontak: () => boolean;
  runValidDokumen: () => boolean;
  runValidPersyaratan: () => boolean;
  provinsi: Array<{ id: number; nama: string }>;
  kabupaten: Array<{ id: number; nama: string; kode: string }>;
  kecamatan: Array<{ nama: string; kode: string }>;
  desaList: Array<{ nama: string }>;
  kodeposList: Array<{ kode_pos: string }>;
  loadingKab: boolean;
  loadingKec: boolean;
  loadingDesa: boolean;
  loadingKodepos: boolean;
  wilayahError: string | null;
  pilihProvinsi: (v: number) => void;
  loadKecamatan: (kode: string) => void;
  loadDesa: (kode: string) => void;
  loadKodepos: (desa: string, kec: string, kabNama: string) => void;
  otp: ReturnType<typeof useOtp>;
}

export function useDaftarForm(): DaftarForm {
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
  const [umum, setUmum] = useState<string | null>(null);
  const [kirim, setKirim] = useState(false);
  const [hasil, setHasil] = useState<PendaftaranCreated | null>(null);

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
  function bindText(key: string, setter: (v: string) => void): BindText {
    return {
      onChange: (v: string) => {
        setter(v);
      },
      onBlur: () => {
        markTouched(key);
      },
    };
  }

  function togglePersyaratan(title: string): void {
    setPersyaratan((p) => (p.includes(title) ? p.filter((t) => t !== title) : [...p, title]));
    markTouched('persyaratan');
  }

  const { provinsi, kabupaten, kecamatan, desaList, kodeposList, loadingKab, loadingKec, loadingDesa, loadingKodepos, error: wilayahError, pilihProvinsi, loadKecamatan, loadDesa, loadKodepos } = useWilayah();
  const otp = useOtp();

  function runValidDataDiri(): boolean {
    const e = validDataDiri({ nama, nik, tempat, tanggal, jk, agama, pendidikan, pekerjaan, alamat, prov, kab, kec, desa, kodepos });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function runValidKontak(): boolean {
    const e = validKontak({ email, wa, motivasi, otpToken: otp.verifiedToken });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function runValidDokumen(): boolean {
    const e = validDokumen(docs);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function runValidPersyaratan(): boolean {
    const e = validPersyaratan(persyaratan);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

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
    if (step === 0) runValidDataDiri();
    else if (step === 1) runValidKontak();
    else if (step === 2) runValidDokumen();
    else if (step === 3) runValidPersyaratan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveValues]);

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

  return {
    draft, step, setStep,
    nama, setNama, nik, setNik, tempat, setTempat, tanggal, setTanggal,
    jk, setJk, agama, setAgama, pendidikan, setPendidikan, pekerjaan, setPekerjaan,
    alamat, setAlamat, prov, setProv, kab, setKab, kec, setKec, desa, setDesa,
    kodepos, setKodepos, email, setEmail, wa, setWa, kode, setKode,
    motivasi, setMotivasi, persyaratan, setPersyaratan, docs, setDocs,
    errors, setErrors, submitted, setSubmitted, umum, setUmum, kirim, setKirim,
    hasil, setHasil, markTouched, touchStep, touchAll, visibleError, isInvalid,
    bindText, togglePersyaratan, runValidDataDiri, runValidKontak, runValidDokumen,
    runValidPersyaratan, provinsi, kabupaten, kecamatan, desaList, kodeposList,
    loadingKab, loadingKec, loadingDesa, loadingKodepos, wilayahError,
    pilihProvinsi, loadKecamatan, loadDesa, loadKodepos, otp,
  };
}
