import type { DaftarForm } from '../hooks/useDaftarForm';
import { Alert } from './fields';

export default function LangkahRingkasan({ form }: { form: DaftarForm }) {
  const { nama, nik, tempat, tanggal, email, wa, kec, desa, kodepos, docs } = form;

  return (
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
  );
}
