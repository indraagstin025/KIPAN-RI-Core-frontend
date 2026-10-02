export function Spinner({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 ${light ? 'border-white/40 border-t-white' : 'border-kipan-border border-t-kipan-blue'}`}
      style={{ width: size, height: size }}
    />
  );
}

// Overlay mengunci layar selama operasi penting (submit, approve) agar tidak
// ada klik ganda dan pengguna jelas sedang diproses.
export function Overlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-kipan-navy/60 backdrop-blur-[2px]" role="status" aria-live="polite">
      <Spinner size={44} light />
      <p className="max-w-xs text-center text-sm font-semibold text-white">{label}</p>
    </div>
  );
}

// Skeleton baris dropdown saat opsi masih dimuat.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-kipan-soft-gray ${className}`} />;
}
