import { useEffect, type ReactNode } from 'react';

// Modal bersama: menutup via ESC / klik backdrop + kunci scroll body + atribut a11y.
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-kipan-border bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-kipan-border px-5 py-3">
          <p className="text-base font-bold text-kipan-text-dark">{title}</p>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-kipan-text-muted hover:bg-kipan-soft-gray" aria-label="Tutup">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
