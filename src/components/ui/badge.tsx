export default function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-100">
      <span className="h-1.5 w-1.5 rounded-full bg-kipan-yellow" aria-hidden="true" />
      {children}
    </span>
  );
}
