import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ErrorBox } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { parseKtaQr } from '../api/ktaService';

// QrScanModal: pindai QR kartu via kamera (decode 100% di perangkat;
// video tidak dikirim ke mana pun). Kamera dimatikan saat tutup/unmount.
interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (nia: string, sig: string) => void;
}

const REGION_ID = 'kta-qr-region';

export default function QrScanModal({ open, onClose, onScan }: Props) {
  const scanner = useRef<Html5Qrcode | null>(null);
  const running = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setError(null);
    setStarting(true);
    const sqr = new Html5Qrcode(REGION_ID, { verbose: false });
    scanner.current = sqr;
    sqr
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          const parsed = parseKtaQr(text);
          if (!parsed) {
            if (alive) setError('QR ini bukan QR KTA KIPAN. Arahkan ke QR pada kartu.');
            return;
          }
          void stop().finally(() => {
            if (alive) onScanRef.current(parsed.nia, parsed.sig);
          });
        },
        () => {
          // frame tanpa QR: abaikan diam-diam
        },
      )
      .then(() => {
        running.current = true;
        if (alive) setStarting(false);
      })
      .catch(() => {
        if (alive) {
          setStarting(false);
          setError('Kamera tidak dapat dibuka. Izinkan akses kamera dan gunakan HTTPS/localhost, atau isi manual.');
        }
      });
    async function stop(): Promise<void> {
      if (running.current) {
        running.current = false;
        try {
          await sqr.stop();
        } catch {
          // abaikan: kamera mungkin sudah mati
        }
      }
      try {
        sqr.clear();
      } catch {
        // abaikan
      }
    }
    return () => {
      alive = false;
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Pindai QR KTA">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="font-serif text-lg font-bold text-kipan-text-dark">Pindai QR Kartu</h2>
        <p className="mt-0.5 text-xs text-kipan-text-muted">Arahkan kamera ke QR pada kartu KTA.</p>
        <div className="mt-4 overflow-hidden rounded-lg bg-black">
          <div id={REGION_ID} className="w-full" />
        </div>
        {starting && (
          <p className="mt-3 flex items-center gap-2 text-sm text-kipan-text-muted"><Spinner size={15} /> Membuka kamera…</p>
        )}
        {error && <div className="mt-3"><ErrorBox message={error} /></div>}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-kipan-border px-4 py-2.5 text-sm font-semibold text-kipan-text-dark"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
