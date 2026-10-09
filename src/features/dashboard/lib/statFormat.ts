// Helper murni dashboard (persen, label bulan, inisial, koordinat grafik).
// Tanpa React agar bisa diuji langsung (node --test).

const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// pct membulatkan persen bagian/total (total 0 = 0, anti NaN).
export function pct(bagian: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((bagian / total) * 100);
}

// shortBulan "2026-10" -> "Okt"; format lain dikembalikan apa adanya.
export function shortBulan(bulan: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(bulan.trim());
  if (!m) return bulan;
  const idx = Number(m[2]) - 1;
  return idx >= 0 && idx < 12 ? BULAN_PENDEK[idx] : bulan;
}

// initials "Uji Artefak NIK" -> "UA" (maks 2 huruf).
export function initials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export interface ChartPoint {
  x: number;
  y: number;
}

// niceCeil batas atas sumbu-Y (langkah 2/5/10 sesuai skala).
export function niceCeil(max: number): number {
  if (max <= 0) return 2;
  const step = max > 20 ? 10 : max > 10 ? 5 : 2;
  return Math.ceil(max / step) * step;
}

// trendPoints memetakan nilai ke koordinat SVG (viewBox w×h, padding).
export function trendPoints(
  values: number[],
  w: number,
  h: number,
  padL: number,
  padB: number,
  padT: number,
): { points: ChartPoint[]; yMax: number } {
  const max = values.length > 0 ? Math.max(...values) : 0;
  const yMax = niceCeil(max);
  const innerW = w - padL - 8;
  const innerH = h - padT - padB;
  const n = values.length;
  const points = values.map((v, i) => ({
    x: n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW,
    y: padT + innerH - (v / yMax) * innerH,
  }));
  return { points, yMax };
}
