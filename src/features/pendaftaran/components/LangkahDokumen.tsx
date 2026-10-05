import { Spinner } from '@/components/ui/loading';
import { DOKUMEN_LIST } from '../constants/dokumen';
import type { DaftarForm } from '../hooks/useDaftarForm';
import type { DokumenCategory } from '../types';

export default function LangkahDokumen({ form, unggah }: {
  form: DaftarForm;
  unggah: (category: DokumenCategory, file: File) => Promise<void>;
}) {
  const { docs, errors } = form;

  return (
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
  );
}
