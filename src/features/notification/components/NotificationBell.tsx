import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationBell() {
  const { items, unread, read } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
        aria-label={`Notifikasi${unread ? ` (${unread} belum dibaca)` : ''}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-kipan-red px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-kipan-border bg-white shadow-xl">
          <div className="border-b border-kipan-border px-4 py-3 font-bold text-kipan-text-dark">Notifikasi</div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-kipan-text-muted">Belum ada notifikasi.</li>}
            {items.map((n) => (
              <li key={n.id} className={`border-b border-kipan-border/60 last:border-0 ${n.is_read ? '' : 'bg-kipan-soft-blue'}`}>
                <button
                  type="button"
                  onClick={() => void read(n.id)}
                  className="block w-full px-4 py-3 text-left hover:bg-kipan-soft-gray"
                >
                  <p className="text-sm font-semibold text-kipan-text-dark">{n.title}</p>
                  <p className="mt-0.5 text-xs text-kipan-text-muted">{n.message}</p>
                  <p className="mt-1 text-[11px] text-kipan-text-muted/70">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
