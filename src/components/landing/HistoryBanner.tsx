import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getRegistrations } from '@/features/tracking/lib/registrationHistory';

// HistoryBanner: menampilkan nomor pendaftaran terakhir yang tersimpan di
// perangkat ini, agar pendaftar tidak kehilangan nomor setelah submit.
export default function HistoryBanner() {
  const [rec] = useState(() => getRegistrations()[0] ?? null);
  const [closed, setClosed] = useState(false);
  if (!rec || closed) return null;

  return (
    <div className="border-b border-kipan-yellow/40 bg-yellow-50">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p className="text-sm text-kipan-text-dark">
          Pendaftaran terakhir di perangkat ini:{' '}
          <span className="font-mono font-bold text-kipan-navy">{rec.nomor}</span>
          <span className="text-kipan-text-muted"> · {rec.nama}</span>
        </p>
        <div className="flex items-center gap-3">
          <Link to={`/lacak?nomor=${encodeURIComponent(rec.nomor)}`} className="rounded-lg bg-kipan-navy px-4 py-2 text-xs font-bold text-white hover:bg-kipan-blue">
            Lacak
          </Link>
          <Link to={`/revisi?nomor=${encodeURIComponent(rec.nomor)}`} className="rounded-lg border border-kipan-navy/30 px-4 py-2 text-xs font-bold text-kipan-navy hover:bg-white">
            Revisi
          </Link>
          <button
            type="button"
            onClick={() => setClosed(true)}
            className="text-xs font-semibold text-kipan-text-muted hover:text-kipan-red"
            aria-label="Tutup pemberitahuan"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
