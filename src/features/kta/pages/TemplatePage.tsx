import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, ErrorBox, PageHeader } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { ApiError } from '@/services/apiClient';
import {
  getKtaTemplateBackground,
  getKtaTemplateFont,
  getKtaTemplateLayout,
  regenerateAllKta,
  type TemplateField,
  type TemplateLayout,
} from '../api/ktaService';

// Tool kalibrasi template KTA (Super/Nasional). Menggeser kotak field di atas
// gambar latar lalu mengekspor layout.json — format persis dibaca server.
// BUKAN untuk anggota: template tunggal untuk semua kartu.

const SAMPLE_LABEL: Record<string, string> = {
  member_number: 'KIPAN-IND-3200-2026-000001',
  full_name: 'Siti Nurbaya Binti Haji Muhammad Syarifuddin',
  province: 'Jawa Barat',
  city: 'Kota Bandung',
};

type Side = 'front' | 'back';

function overlaps(a: TemplateField['rect'], b: TemplateField['rect']): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function bumpPatch(v: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  if (!m) return v;
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

export default function TemplatePage() {
  const [layout, setLayout] = useState<TemplateLayout | null>(null);
  const [side, setSide] = useState<Side>('front');
  const [bg, setBg] = useState<Record<Side, string>>({ front: '', back: '' });
  const [sel, setSel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState<Record<string, string>>({ ...SAMPLE_LABEL });
  const [fontsReady, setFontsReady] = useState(false);
  const [orig, setOrig] = useState<TemplateLayout | null>(null);
  const [version, setVersion] = useState('');
  const [bgDims, setBgDims] = useState<Record<Side, { w: number; h: number } | null>>({ front: null, back: null });
  const [regen, setRegen] = useState(false);
  const [regenMsg, setRegenMsg] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; mode: 'move' | 'resize' } | null>(null);

  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    // Coba sekali lagi hanya untuk gagal jaringan (status 0): menutup
    // transfer besar yang terpenggal di tengah. Salah 4xx/5xx tidak diulang.
    async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
      try {
        return await fn();
      } catch (e: unknown) {
        if (e instanceof ApiError && e.status === 0) return await fn();
        throw e;
      }
    }
    (async () => {
      try {
        // Berurutan (bukan paralel): layout dulu untuk versi cache,
        // lalu aset satu per satu agar tak berebut koneksi dingin.
        const lay = await withRetry(() => getKtaTemplateLayout());
        if (!alive) return;
        const v = lay.template.version;
        const front = await withRetry(() => getKtaTemplateBackground('front', v));
        if (!alive) return;
        const back = await withRetry(() => getKtaTemplateBackground('back', v));
        if (!alive) return;
        urls.push(front, back);
        setLayout(lay);
        // Simpan salinan awal untuk ringkasan diff + versi awal.
        setOrig(JSON.parse(JSON.stringify(lay)) as TemplateLayout);
        setVersion(lay.template.version);
        setBg({ front, back });
        // Muat fonta template agar bentuk huruf pratinjau sama dengan kartu
        // produksi (fallback font browser bila gagal — posisi tetap akurat).
        try {
          const names = [lay.template.fonts?.normal, lay.template.fonts?.bold].filter(
            (n): n is string => typeof n === 'string' && n.length > 0,
          );
          for (const n of [...new Set(names)]) {
            const u = await withRetry(() => getKtaTemplateFont(n, v));
            urls.push(u);
            const face = new FontFace('KTA Template', `url(${u})`, {
              weight: /bold/i.test(n) ? '700' : '400',
            });
            await face.load();
            document.fonts.add(face);
          }
          if (alive) setFontsReady(true);
        } catch {
          // abaikan: pratinjau jalan dengan font browser
        }
      } catch (e: unknown) {
        if (alive) setError(e instanceof ApiError ? e.message : 'Gagal memuat template');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const fields = layout ? layout[side].fields : [];
  const canvas = layout ? layout[side].canvas : { width: 0, height: 0 };

  const patchField = useCallback(
    (id: string, patch: Partial<TemplateField> | ((f: TemplateField) => TemplateField)) => {
      setLayout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [side]: {
            ...prev[side],
            fields: prev[side].fields.map((f) =>
              f.id === id ? (typeof patch === 'function' ? patch(f) : { ...f, ...patch }) : f,
            ),
          },
        };
      });
    },
    [side],
  );

  function onBoxDown(e: React.PointerEvent, id: string) {
    const f = fields.find((x) => x.id === id);
    if (!f) return;
    setSel(id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    drag.current = { id, dx: e.clientX - r.left, dy: e.clientY - r.top, mode: 'move' };
  }

  function onGripDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    setSel(id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { id, dx: 0, dy: 0, mode: 'resize' };
  }

  function onMove(e: React.PointerEvent, wrap: HTMLDivElement | null, scale: number) {
    const d = drag.current;
    if (!d || !wrap) return;
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / scale;
    const py = (e.clientY - r.top) / scale;
    if (d.mode === 'move') {
      patchField(d.id, (f) => ({
        ...f,
        rect: {
          ...f.rect,
          x: Math.round(Math.min(Math.max(px - d.dx / scale, 0), canvas.width - f.rect.width)),
          y: Math.round(Math.min(Math.max(py - d.dy / scale, 0), canvas.height - f.rect.height)),
        },
      }));
    } else {
      patchField(d.id, (f) => {
        const w = Math.max(8, Math.round(px - f.rect.x));
        const h = Math.max(8, Math.round(py - f.rect.y));
        const sq = f.type === 'qr';
        return { ...f, rect: { ...f.rect, width: w, height: sq ? w : h } };
      });
    }
  }

  function sampleFor(f: TemplateField): string {
    if (f.value) return f.value;
    return samples[f.id] ?? SAMPLE_LABEL[f.id] ?? '';
  }

  const warnings: string[] = [];
  fields.forEach((f) => {
    if (f.rect.x < 0 || f.rect.y < 0 || f.rect.x + f.rect.width > canvas.width || f.rect.y + f.rect.height > canvas.height) {
      warnings.push(`"${f.id}" keluar kanvas`);
    }
  });
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      if (overlaps(fields[i].rect, fields[j].rect)) warnings.push(`"${fields[i].id}" bertumpuk dengan "${fields[j].id}"`);
    }
  }
  const bd = bgDims[side];
  if (bd && (bd.w !== canvas.width || bd.h !== canvas.height)) {
    warnings.push(`latar ${side} ${bd.w}×${bd.h} ≠ kanvas ${canvas.width}×${canvas.height}`);
  }

  // diffSummary: daftar perubahan posisi/ukuran/font vs layout awal (audit save).
  function diffSummary(): string[] {
    if (!orig || !layout) return [];
    const out: string[] = [];
    (['front', 'back'] as Side[]).forEach((s) => {
      const oc = orig[s].canvas;
      const nc = layout[s].canvas;
      if (oc.width !== nc.width || oc.height !== nc.height) out.push(`kanvas ${s}: ${oc.width}×${oc.height} → ${nc.width}×${nc.height}`);
      const before = new Map(orig[s].fields.map((f) => [f.id, f]));
      layout[s].fields.forEach((f) => {
        const b = before.get(f.id);
        if (!b) {
          out.push(`field ${s}.${f.id}: ditambah`);
          return;
        }
        if (b.rect.x !== f.rect.x || b.rect.y !== f.rect.y || b.rect.width !== f.rect.width || b.rect.height !== f.rect.height) {
          out.push(`posisi ${s}.${f.id}: (${b.rect.x},${b.rect.y} ${b.rect.width}×${b.rect.height}) → (${f.rect.x},${f.rect.y} ${f.rect.width}×${f.rect.height})`);
        }
        if ((b.style?.fontSize ?? 0) !== (f.style?.fontSize ?? 0)) out.push(`font ${s}.${f.id}: ${b.style?.fontSize ?? 0} → ${f.style?.fontSize ?? 0}`);
      });
    });
    return out;
  }

  // exportJson: fail-closed — versi wajib x.y.z; peringatan minta konfirmasi;
  // ringkasan perubahan ditampilkan sebelum berkas diunduh.
  function exportJson() {
    if (!layout) return;
    const v = version.trim();
    if (!/^\d+\.\d+\.\d+$/.test(v)) {
      setError('Versi harus format x.y.z (mis. 2.1.1).');
      return;
    }
    if (warnings.length > 0 && !window.confirm(`Peringatan:\n- ${warnings.join('\n- ')}\n\nTetap ekspor?`)) return;
    const diff = diffSummary();
    const head = diff.length ? `Perubahan:\n- ${diff.join('\n- ')}` : 'Tidak ada perubahan posisi dari layout awal.';
    if (!window.confirm(`${head}\n\nEkspor layout.json v${v}?`)) return;
    const out = { ...layout, template: { ...layout.template, version: v } };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'layout.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  // regenerateAll: terapkan template aktif ke semua kartu (menimpa objek lama).
  async function regenerateAll() {
    if (!window.confirm('Render ulang SEMUA kartu ber-tanda-tangan dengan template AKTIF? Kartu lama akan ditimpa.')) return;
    setRegen(true);
    setRegenMsg(null);
    setError(null);
    try {
      const r = await regenerateAllKta();
      setRegenMsg(`${r.regenerated} kartu diregenerasi dengan template v${version}.`);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal regenerasi massal');
    } finally {
      setRegen(false);
    }
  }

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const scale = 1;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Kalibrasi Template KTA" desc="Geser kotak field tepat di atas latar, lalu ekspor layout.json." />
        <Card>
          <p className="flex items-center gap-2 text-sm text-kipan-text-muted"><Spinner size={15} /> Memuat template…</p>
        </Card>
      </div>
    );
  }

  const selected = fields.find((f) => f.id === sel) ?? null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Kalibrasi Template KTA" desc="Geser kotak field tepat di atas latar, lalu ekspor layout.json ke assets/kta/." />
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['front', 'back'] as Side[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setSide(s); setSel(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${side === s ? 'bg-kipan-navy text-white' : 'border border-kipan-border text-kipan-text-dark'}`}
          >
            {s === 'front' ? 'Depan' : 'Belakang'}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-1 text-xs text-kipan-text-muted">
          Versi
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            aria-label="Versi layout"
            className="w-20 rounded border border-kipan-border px-1.5 py-1 text-xs"
          />
          <button type="button" onClick={() => setVersion((v) => bumpPatch(v))} title="Naikkan patch" className="rounded border border-kipan-border px-1.5 py-1 text-xs">+1</button>
        </label>
        <span className="text-xs text-kipan-text-muted">
          font: {layout?.template.fonts?.normal ?? 'DejaVu'} / {layout?.template.fonts?.bold ?? '-'} · kanvas {canvas.width}×{canvas.height}
        </span>
        <button
          type="button"
          onClick={() => void regenerateAll()}
          disabled={regen}
          className="ml-auto rounded-lg border border-kipan-navy px-4 py-2 text-sm font-semibold text-kipan-navy hover:bg-kipan-navy hover:text-white disabled:opacity-60"
        >
          {regen ? 'Merender…' : 'Render ulang semua kartu'}
        </button>
        <button
          type="button"
          onClick={exportJson}
          disabled={!layout}
          className="rounded-lg bg-kipan-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kipan-navy disabled:opacity-60"
        >
          Ekspor layout.json
        </button>
      </div>
      {regenMsg && <p className="mb-4 text-xs font-medium text-emerald-700">{regenMsg}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Card>
          <div className="overflow-auto">
            <div
              ref={wrapRef}
              onPointerMove={(e) => onMove(e, wrapRef.current, scale)}
              onPointerUp={() => { drag.current = null; }}
              className="relative select-none"
              style={{ width: canvas.width, height: canvas.height }}
            >
              {bg[side] && (
                <img
                  src={bg[side]}
                  alt={`Latar ${side}`}
                  className="absolute inset-0 h-full w-full"
                  draggable={false}
                  onLoad={(e) => {
                    const im = e.currentTarget;
                    setBgDims((p) => ({ ...p, [side]: { w: im.naturalWidth, h: im.naturalHeight } }));
                  }}
                />
              )}
              {fields.map((f) => (
                <div
                  key={f.id}
                  onPointerDown={(e) => onBoxDown(e, f.id)}
                  className={`absolute flex items-center justify-center overflow-hidden border-2 ${sel === f.id ? 'border-red-500' : 'border-emerald-500'} ${f.type === 'qr' ? 'bg-white/80' : 'bg-sky-200/40'}`}
                  style={{ left: f.rect.x, top: f.rect.y, width: f.rect.width, height: f.rect.height, cursor: 'move', touchAction: 'none' }}
                  title={f.id}
                >
                  {f.type === 'image' ? (
                    <span className="text-xs font-bold text-kipan-navy">FOTO</span>
                  ) : f.type === 'qr' ? (
                    <span className="text-xs font-bold text-kipan-navy">QR</span>
                  ) : (
                    <span
                      className="w-full truncate px-1 text-left"
                      style={{ fontSize: Math.max(8, (f.style?.fontSize ?? 14)), color: '#173a5e', fontWeight: f.style?.fontWeight === '700' ? 700 : 500, fontFamily: fontsReady ? "'KTA Template', sans-serif" : undefined }}
                    >
                      {sampleFor(f)}
                    </span>
                  )}
                  <span
                    onPointerDown={(e) => onGripDown(e, f.id)}
                    className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize bg-red-500"
                    style={{ touchAction: 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-kipan-text-muted">
            Seret kotak untuk pindah, tarik sudut merah untuk ubah ukuran (QR selalu bujur sangkar).
            Ukuran teks pratinjau kira-kira — konfirmasi akhir via render server.
          </p>
          {warnings.length > 0 && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-medium text-kipan-red">
              {warnings.map((w) => <p key={w}>⚠ {w}</p>)}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-sm font-bold text-kipan-text-dark">Data contoh</h3>
            {Object.keys(SAMPLE_LABEL).map((k) => (
              <label key={k} className="mt-2 block">
                <span className="text-xs text-kipan-text-muted">{k}</span>
                <input
                  value={samples[k] ?? ''}
                  onChange={(e) => setSamples((p) => ({ ...p, [k]: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-kipan-border px-2 py-1.5 text-xs"
                />
              </label>
            ))}
          </Card>
          <Card>
            <h3 className="text-sm font-bold text-kipan-text-dark">Field terpilih</h3>
            {!selected ? (
              <p className="mt-2 text-xs text-kipan-text-muted">Klik kotak di kanvas.</p>
            ) : (
              <div className="mt-2 text-xs">
                <p><b>ID:</b> {selected.id} ({selected.type})</p>
                <p><b>Rect:</b> {selected.rect.x}, {selected.rect.y}, {selected.rect.width}×{selected.rect.height}</p>
                {selected.type === 'text' && (
                  <label className="mt-2 block">
                    <span className="text-kipan-text-muted">Ukuran font</span>
                    <input
                      type="number"
                      min={6}
                      max={40}
                      value={selected.style?.fontSize ?? 14}
                      onChange={(e) => patchField(selected.id, (f) => ({ ...f, style: { ...f.style, fontSize: Number(e.target.value) || 14 } }))}
                      className="mt-0.5 w-full rounded-lg border border-kipan-border px-2 py-1.5 text-xs"
                    />
                  </label>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
