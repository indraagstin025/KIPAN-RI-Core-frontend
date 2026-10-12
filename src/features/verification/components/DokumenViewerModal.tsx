import { useEffect } from 'react';

// DokumenViewerModal (KTP-37/Batch 5): penampil dokumen di DALAM aplikasi
// dengan watermark identitas pembuka + waktu — deterrent dan atribusi bila
// tangkapan layar bocor. BUKAN prevensi mutlak: pihak berniat tetap bisa
// mengakali DOM. Pembukaan sendiri sudah teraudit di server (presign-view).
export interface ViewerDokumen {
  label: string;
  url: string;
  isPdf: boolean;
  watermark: string;
}

interface Props {
  dokumen: ViewerDokumen | null;
  onClose: () => void;
}

const JUMLAH_SALINAN = 24;

export default function DokumenViewerModal({ dokumen, onClose }: Props) {
  useEffect(() => {
    if (!dokumen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dokumen, onClose]);

  if (!dokumen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Pratinjau ${dokumen.label}`}>
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-kipan-border px-5 py-3">
          <h2 className="text-sm font-bold text-kipan-text-dark">{dokumen.label}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-kipan-text-muted hover:bg-kipan-soft-gray hover:text-kipan-text-dark"
          >
            Tutup ✕
          </button>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto bg-slate-100">
          {dokumen.isPdf ? (
            <iframe src={dokumen.url} title={dokumen.label} className="h-[70vh] w-full bg-white" />
          ) : (
            <img src={dokumen.url} alt={dokumen.label} className="mx-auto max-h-[70vh] object-contain" draggable={false} />
          )}
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden="true">
            <div className="flex h-full w-full flex-wrap content-center items-center justify-center gap-10 opacity-20">
              {Array.from({ length: JUMLAH_SALINAN }, (_, i) => (
                <span key={i} className="-rotate-[24deg] whitespace-nowrap text-lg font-black text-kipan-navy">
                  {dokumen.watermark}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="border-t border-kipan-border px-5 py-2 text-[11px] text-kipan-text-muted">
          Dokumen rahasia — pembukaan tercatat di audit. Dilarang menyebarluaskan.
        </p>
      </div>
    </div>
  );
}
