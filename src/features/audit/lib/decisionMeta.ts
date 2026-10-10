// Helper murni Log Keputusan (Batch 3): preset aksi + ekstrak alasan.
// Tanpa React agar bisa diuji langsung (node --test).

export interface DecisionGroup {
  key: string;
  label: string;
  aksi: string[];
}

// DECISION_GROUPS mencerminkan aksi audit putusan backend:
// verifikasi (VERIFIKASI/SETUJUI/PERBAIKAN/TOLAK/BYPASS_VERIFIKASI),
// SK (SUBMIT/APPROVE/REJECT), pengurus (PAW/MUTASI/PENGURUS_STATUS),
// DSAR (DSAR_PUTUSAN).
export const DECISION_GROUPS: DecisionGroup[] = [
  {
    key: 'semua',
    label: 'Semua Keputusan',
    aksi: [
      'VERIFIKASI', 'SETUJUI', 'PERBAIKAN', 'TOLAK', 'BYPASS_VERIFIKASI',
      'SUBMIT', 'APPROVE', 'REJECT',
      'PAW', 'MUTASI', 'PENGURUS_STATUS',
      'DSAR_PUTUSAN',
    ],
  },
  { key: 'verifikasi', label: 'Verifikasi', aksi: ['VERIFIKASI', 'SETUJUI', 'PERBAIKAN', 'TOLAK', 'BYPASS_VERIFIKASI'] },
  { key: 'sk', label: 'SK', aksi: ['SUBMIT', 'APPROVE', 'REJECT'] },
  { key: 'pengurus', label: 'Pengurus', aksi: ['PAW', 'MUTASI', 'PENGURUS_STATUS'] },
  { key: 'dsar', label: 'Data Pribadi', aksi: ['DSAR_PUTUSAN'] },
];

// extractAlasan membaca alasan dari meta JSON audit (kunci: alasan,
// bypass_alasan, catatan). Bukan JSON / tanpa kunci = null (bukan error).
export function extractAlasan(meta: string | null | undefined): string | null {
  if (!meta) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(meta);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const rec = parsed as Record<string, unknown>;
  for (const k of ['alasan', 'bypass_alasan', 'catatan']) {
    const v = rec[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return null;
}
