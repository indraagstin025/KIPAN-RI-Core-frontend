// Cek dini di browser sebelum upload (L9): duplikat berkas antar-slot dan
// PDF terkunci. Bukan pengganti validasi server — hanya UX agar pendaftar
// tidak menunggu 422.

export function fileSig(f: File): string {
  return `${f.name}|${f.size}|${f.lastModified}`;
}

// pdfLocked memindai 64KB terakhir file mencari penanda /Encrypt PDF
// (heuristik yang sama dengan backend LooksEncryptedPDF).
export async function pdfLocked(file: File): Promise<boolean> {
  if (file.type !== 'application/pdf') return false;
  try {
    const tail = file.slice(Math.max(0, file.size - 65536));
    const text = new TextDecoder().decode(await tail.arrayBuffer());
    const idx = text.indexOf('/Encrypt');
    if (idx < 0) return false;
    const after = text[idx + 8];
    return after === undefined || ' \t\n\r\x00\f/<[('.includes(after);
  } catch {
    return false;
  }
}
