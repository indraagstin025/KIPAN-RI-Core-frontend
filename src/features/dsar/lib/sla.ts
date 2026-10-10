// sisaJam menghitung sisa jam SLA dari due_at (negatif = terlambat).
export function sisaJam(dueAt: string): number {
  return Math.floor((new Date(dueAt).getTime() - Date.now()) / 3600000);
}
