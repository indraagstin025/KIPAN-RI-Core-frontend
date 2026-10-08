import { useRef, useState } from 'react';

// Kanvas tanda tangan (3:1, PNG transparan). Digambar dengan pointer
// (mouse/sentuh), lalu diekspor sebagai Blob PNG. Tanpa library tambahan.

interface Props {
  onSave: (blob: Blob) => Promise<void> | void;
  saving?: boolean;
}

const W = 720;
const H = 240;

export default function SignatureCanvas({ onSave, saving }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  function point(e: React.PointerEvent): { x: number; y: number } {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }

  function down(e: React.PointerEvent): void {
    e.preventDefault();
    drawing.current = true;
    last.current = point(e);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function move(e: React.PointerEvent): void {
    if (!drawing.current || !last.current) return;
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    const p = point(e);
    ctx.strokeStyle = '#0b2a4a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (empty) setEmpty(false);
  }

  function up(): void {
    drawing.current = false;
    last.current = null;
  }

  function clear(): void {
    const c = ref.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
  }

  function simpan(): void {
    const c = ref.current;
    if (!c || empty) return;
    c.toBlob((b) => {
      if (b) void onSave(b);
    }, 'image/png');
  }

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full touch-none rounded-lg border border-dashed border-kipan-border bg-white"
        style={{ aspectRatio: '3 / 1' }}
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={simpan}
          disabled={empty || saving}
          className="rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-50"
        >
          {saving ? 'Menyimpan…' : 'Simpan Tanda Tangan'}
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={saving}
          className="rounded-lg border border-kipan-border px-5 py-2.5 text-sm font-semibold text-kipan-text-dark hover:bg-kipan-soft-gray disabled:opacity-50"
        >
          Hapus
        </button>
      </div>
      <p className="mt-2 text-xs text-kipan-text-muted">Gambar tanda tangan Anda di kotak di atas (bisa pakai mouse atau layar sentuh).</p>
    </div>
  );
}
