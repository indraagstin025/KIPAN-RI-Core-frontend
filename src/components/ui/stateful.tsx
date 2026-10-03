import type { ReactNode } from 'react';

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-serif text-2xl font-bold text-kipan-text-dark sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-kipan-text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-kipan-border bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</div>;
}

export function Loading({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-kipan-text-muted">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-kipan-border border-t-kipan-blue" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-3xl" aria-hidden="true">🗂️</p>
      <p className="mt-2 font-semibold text-kipan-text-dark">{title}</p>
      {desc && <p className="mt-1 text-sm text-kipan-text-muted">{desc}</p>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-lg border border-kipan-red/30 bg-red-50 p-4 text-sm font-medium text-kipan-red">{message}</div>;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-blue-100 text-kipan-navy',
  DIAJUKAN: 'bg-blue-100 text-kipan-navy',
  DIVERIFIKASI: 'bg-amber-100 text-amber-700',
  PERBAIKAN: 'bg-orange-100 text-orange-700',
  DISETUJUI: 'bg-emerald-100 text-kipan-green',
  DITOLAK: 'bg-red-100 text-kipan-red',
  AKTIF: 'bg-emerald-100 text-kipan-green',
  NONAKTIF: 'bg-gray-100 text-gray-600',
  DEMISIONER: 'bg-amber-100 text-amber-700',
  DIBERHENTIKAN: 'bg-red-100 text-kipan-red',
  MENINGGAL: 'bg-gray-100 text-gray-600',
  KEDALUWARSA: 'bg-gray-100 text-gray-600',
  Aktif: 'bg-emerald-100 text-kipan-green',
  Nonaktif: 'bg-gray-100 text-gray-600',
  Suspended: 'bg-red-100 text-kipan-red',
  Demisioner: 'bg-amber-100 text-amber-700',
  Diberhentikan: 'bg-red-100 text-kipan-red',
  'Mengundurkan Diri': 'bg-gray-100 text-gray-600',
  Meninggal: 'bg-gray-100 text-gray-600',
  Digantikan: 'bg-gray-100 text-gray-600',
  TidakAktif: 'bg-gray-100 text-gray-600',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cls = STATUS_STYLE[status] ?? 'bg-kipan-soft-blue text-kipan-navy';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label ?? status}</span>;
}

export function CursorPager({ hasPrev, hasNext, onPrev, onNext }: { hasPrev: boolean; hasNext: boolean; onPrev: () => void; onNext: () => void }) {
  if (!hasPrev && !hasNext) return null;
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-sm">
      <button
        type="button"
        disabled={!hasPrev}
        onClick={onPrev}
        className="rounded-lg border border-kipan-border px-4 py-2 font-semibold text-kipan-navy disabled:opacity-40"
      >
        ← Sebelumnya
      </button>
      <span className="text-kipan-text-muted">Halaman ini {hasNext ? '·' : '(halaman terakhir)'}</span>
      <button
        type="button"
        disabled={!hasNext}
        onClick={onNext}
        className="rounded-lg border border-kipan-border px-4 py-2 font-semibold text-kipan-navy disabled:opacity-40"
      >
        Berikutnya →
      </button>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-kipan-border px-4 py-2 font-semibold text-kipan-navy disabled:opacity-40"
      >
        ← Sebelumnya
      </button>
      <span className="text-kipan-text-muted">Halaman {page} dari {totalPages}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-kipan-border px-4 py-2 font-semibold text-kipan-navy disabled:opacity-40"
      >
        Berikutnya →
      </button>
    </div>
  );
}
