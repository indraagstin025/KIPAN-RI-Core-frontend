// Watermark penampil dokumen (KTP-37): identitas pembuka + waktu buka.
// Dipisah ke modul polos agar aturan purity React tidak menandai `new Date()`
// (dipanggil dari event handler, bukan saat render).
export function buatWatermark(pembuka: string): string {
  const nama = pembuka.trim() || 'ADMIN';
  const waktu = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `DILIHAT OLEH ${nama} • ${waktu}`;
}
