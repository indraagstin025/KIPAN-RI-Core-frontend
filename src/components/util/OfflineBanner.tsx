import { useEffect, useState } from 'react';

// Banner offline global (N3, katalog §19.3): persisten kuning selama offline.
// Murni indikator jaringan — TIDAK mengubah sesi (logout hanya via auth:expired
// yang kini ditunda saat offline di apiClient).
export default function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-[200] w-full bg-yellow-400 px-4 py-2 text-center text-sm font-semibold text-yellow-950"
    >
      Anda sedang offline. Perubahan tersimpan lokal dan dikirim saat online.
    </div>
  );
}
