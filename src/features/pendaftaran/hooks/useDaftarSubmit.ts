import { ApiError } from '@/services/apiClient';
import { saveRegistration } from '@/features/tracking/lib/registrationHistory';
import { submitPendaftaran } from '../api/pendaftaranService';
import { uploadDokumen } from '../api/storageService';
import { DOKUMEN_LIST } from '../constants/dokumen';
import { mapServerFields, stepForKey } from '../lib/daftarMapping';
import { clearDraft } from '../lib/draft';
import type { DokumenCategory } from '../types';
import { fileSig, pdfLocked } from './useDokumenCheck';
import type { DaftarForm, DocState } from './useDaftarForm';

export function useDaftarSubmit(form: DaftarForm): {
  unggah: (category: DokumenCategory, file: File) => Promise<void>;
  submit: () => Promise<void>;
} {
  const { docs, setDocs } = form;

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
    const { otp } = form;
    form.setUmum(null);
    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    form.touchAll();

    // Validasi ulang SEMUA langkah sebelum kirim (defensif: data bisa saja
    // dipulihkan dari draf, atau pengguna melompat langkah). Berhenti di
    // langkah gagal pertama agar pesan error tepat terlihat.
    if (!form.runValidDataDiri()) {
      form.setStep(0);
      form.setUmum('Data Diri belum lengkap/valid. Periksa kolom yang ditandai merah.');
      scrollTop();
      return;
    }
    if (!form.runValidKontak()) {
      form.setStep(1);
      form.setUmum('Kontak & Verifikasi WhatsApp belum lengkap/valid. Periksa kolom yang ditandai merah.');
      scrollTop();
      return;
    }
    if (!form.runValidDokumen()) {
      form.setStep(2);
      form.setUmum('Masih ada dokumen wajib yang belum diunggah. Lengkapi berkas yang ditandai merah.');
      scrollTop();
      return;
    }
    if (!form.runValidPersyaratan()) {
      form.setStep(3);
      form.setUmum('Centang seluruh persyaratan untuk melanjutkan.');
      scrollTop();
      return;
    }
    if (!otp.verifiedToken) {
      form.setStep(1);
      form.setUmum('Sesi verifikasi WhatsApp hilang. Minta & masukkan ulang kode OTP.');
      scrollTop();
      return;
    }

    form.setKirim(true);
    try {
      const res = await submitPendaftaran({
        tipe_pendaftaran: 'KADER',
        nama_lengkap: form.nama.trim(),
        nik: form.nik.trim(),
        tempat_lahir: form.tempat.trim(),
        tanggal_lahir: new Date(`${form.tanggal}T00:00:00+07:00`).toISOString(),
        jenis_kelamin: form.jk as 'L' | 'P',
        agama: form.agama.trim(),
        pendidikan: form.pendidikan.trim(),
        pekerjaan: form.pekerjaan.trim(),
        alamat: form.alamat.trim(),
        provinsi_id: Number(form.prov),
        kabupaten_id: Number(form.kab),
        kecamatan: form.kec.trim(),
        desa: form.desa.trim(),
        kode_pos: form.kodepos.trim(),
        email: form.email.trim(),
        whatsapp: form.wa.trim(),
        wa_otp_token: otp.verifiedToken,
        motivation: form.motivasi.trim(),
        persyaratan: form.persyaratan,
        foto_key: form.docs.foto.key,
        ktp_key: form.docs.ktp.key,
        cv_key: form.docs.cv.key,
        surat_pernyataan_key: form.docs.surat_pernyataan.key,
        surat_sehat_key: form.docs.surat_sehat.key,
      });
      saveRegistration({
        nomor: res.nomor_pendaftaran,
        nama: form.nama.trim(),
        tipe: 'KADER',
        email: form.email.trim(),
        whatsapp: form.wa.trim(),
      });
      clearDraft();
      form.setHasil(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const mapped = mapServerFields(err.fields);
        const keys = Object.keys(mapped);
        // Jump ke langkah error pertama (bila ada error per-field).
        if (keys.length > 0) {
          form.setErrors(mapped);
          form.setStep(stepForKey(keys[0]));
          form.setUmum(`${err.message} Periksa kolom yang ditandai merah.`);
        } else {
          form.setUmum(err.message);
        }
      } else {
        form.setUmum(err instanceof Error ? err.message : 'Pengiriman gagal. Coba lagi.');
      }
      // Selalu tampilkan pesan di atas agar terlihat.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      form.setKirim(false);
    }
  }

  return { unggah, submit };
}
