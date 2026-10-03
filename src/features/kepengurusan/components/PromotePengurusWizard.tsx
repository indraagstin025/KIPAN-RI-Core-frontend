import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert, Stepper, TextInput } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import { Modal } from '@/components/ui/modal';
import { adminListAnggota } from '@/features/anggota/api/anggotaService';
import type { AnggotaDetail } from '@/features/anggota/types';
import type { Role } from '@/features/auth/types';
import { useDebouncedValue } from '@/hooks/useDebounced';
import { ApiError } from '@/services/apiClient';
import { adminAddPengurus, adminGetSK, adminListJabatan, adminListSK } from '../api/kepengurusanService';
import { canManagePengurusForLevel } from '../roles';
import type { Jabatan, SKListItem } from '../types';

type StepKey = 'sk' | 'anggota' | 'jabatan' | 'konfirmasi';

const STEP_LABEL: Record<StepKey, string> = {
  sk: 'Pilih SK',
  anggota: 'Pilih Anggota',
  jabatan: 'Pilih Jabatan',
  konfirmasi: 'Konfirmasi',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  actorRole?: Role | null;
  presetSK?: SKListItem | null;
  presetAnggota?: AnggotaDetail | null;
}

function skWilayah(s: SKListItem): string {
  if (s.level === 'NASIONAL') return 'Nasional';
  if (s.level === 'PROVINSI') return s.provinsi_nama ?? '-';
  return s.kabupaten_nama ?? '-';
}

export default function PromotePengurusWizard({ open, onClose, onDone, actorRole, presetSK, presetAnggota }: Props) {
  const needSkStep = !presetSK;
  const needAnggotaStep = !presetAnggota;
  const stepKeys = useMemo<StepKey[]>(() => [
    ...(needSkStep ? (['sk'] as StepKey[]) : []),
    ...(needAnggotaStep ? (['anggota'] as StepKey[]) : []),
    'jabatan',
    'konfirmasi',
  ], [needSkStep, needAnggotaStep]);

  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [sk, setSk] = useState<SKListItem | null>(presetSK ?? null);
  const [skOptions, setSkOptions] = useState<SKListItem[]>([]);
  const [loadingSk, setLoadingSk] = useState(false);

  const [anggota, setAnggota] = useState<AnggotaDetail | null>(presetAnggota ?? null);
  const [cari, setCari] = useState('');
  const debouncedCari = useDebouncedValue(cari, 300);
  const [hasilAnggota, setHasilAnggota] = useState<AnggotaDetail[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);

  const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
  const [takenInti, setTakenInti] = useState<Set<number>>(new Set());
  const [loadingJabatan, setLoadingJabatan] = useState(false);
  const [jabatanId, setJabatanId] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Muat opsi SK (Aktif, belum final, boleh dikelola role).
  useEffect(() => {
    if (!open || !needSkStep) return;
    setLoadingSk(true);
    adminListSK({ page: 1, limit: 100, status: 'Aktif' })
      .then((res) => setSkOptions(res.data.filter((s) => s.approval_status !== 'DISETUJUI' && canManagePengurusForLevel(actorRole, s.level))))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Gagal memuat daftar SK'))
      .finally(() => setLoadingSk(false));
  }, [open, needSkStep, actorRole]);

  // Pencarian anggota (AKTIF) saat langkah anggota aktif.
  useEffect(() => {
    if (!open || !needAnggotaStep) return;
    const q = debouncedCari.trim();
    if (q.length < 2) {
      setHasilAnggota([]);
      return;
    }
    setLoadingAnggota(true);
    adminListAnggota({ page: 1, limit: 8, search: q, status: 'AKTIF' })
      .then((res) => setHasilAnggota(res.data))
      .catch(() => setHasilAnggota([]))
      .finally(() => setLoadingAnggota(false));
  }, [open, needAnggotaStep, debouncedCari]);

  // Saat SK dipilih: muat master jabatan (tanpa level) + tandai jabatan inti terisi.
  useEffect(() => {
    if (!open || !sk) return;
    setLoadingJabatan(true);
    setJabatanId('');
    setTanggalMulai(sk.tanggal_terbit ? sk.tanggal_terbit.slice(0, 10) : '');
    Promise.all([adminListJabatan(false), adminGetSK(sk.id)])
      .then(([js, detail]) => {
        setJabatanList(js.filter((j) => j.is_active));
        setTakenInti(new Set(detail.pengurus.filter((p) => p.is_inti).map((p) => p.jabatan_id)));
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Gagal memuat jabatan'))
      .finally(() => setLoadingJabatan(false));
  }, [open, sk]);

  if (!open) return null;

  const currentKey = stepKeys[stepIdx];
  const stepLabels = stepKeys.map((k) => STEP_LABEL[k]);
  const skFinal = sk?.approval_status === 'DISETUJUI';

  function next(): void {
    setError(null);
    if (currentKey === 'sk' && !sk) {
      setError('Pilih SK terlebih dahulu.');
      return;
    }
    if (currentKey === 'anggota' && !anggota) {
      setError('Pilih anggota terlebih dahulu.');
      return;
    }
    if (currentKey === 'jabatan' && !jabatanId) {
      setError('Pilih jabatan terlebih dahulu.');
      return;
    }
    if (stepIdx < stepKeys.length - 1) setStepIdx((i) => i + 1);
  }

  function back(): void {
    setError(null);
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  async function submit(): Promise<void> {
    if (!sk || !anggota || !jabatanId) return;
    if (skFinal) {
      setError('SK sudah final dan terkunci. Buat SK baru untuk perubahan susunan.');
      return;
    }
    if (!konfirmasi) {
      setError('Centang konfirmasi kelayakan untuk melanjutkan.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const mulai = tanggalMulai ? new Date(`${tanggalMulai}T00:00:00Z`).toISOString() : undefined;
      await adminAddPengurus(sk.id, anggota.id, Number(jabatanId), true, mulai);
      setSuccess(true);
      onDone();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengangkat pengurus');
    } finally {
      setSubmitting(false);
    }
  }

  const jabatanTerpilih = jabatanList.find((j) => String(j.id) === jabatanId) ?? null;

  return (
    <Modal title="Angkat Pengurus" onClose={onClose}>
      {success ? (
        <div className="space-y-4">
          <Alert kind="success">
            <p className="font-bold">Pengurus berhasil diangkat.</p>
            <p className="mt-1 text-sm">
              {anggota?.nama_lengkap} kini berjabatan <span className="font-semibold">{jabatanTerpilih?.nama}</span> pada SK {sk?.nomor_sk}.
              Tipe akun berubah menjadi PENGURUS, sesi lama dicabut, dan email notifikasi dikirim.
            </p>
          </Alert>
          <Button variant="primary" onClick={onClose}>Selesai</Button>
        </div>
      ) : (
        <>
          <div className="mb-4"><Stepper steps={stepLabels} active={stepIdx} /></div>
          <p className="mb-3 text-xs text-kipan-text-muted">Langkah {stepIdx + 1} dari {stepKeys.length}: {STEP_LABEL[currentKey]}</p>
          {error && <div className="mb-3"><Alert kind="error">{error}</Alert></div>}

          {currentKey === 'sk' && (
            <div>
              {loadingSk ? (
                <div className="flex items-center gap-2 py-6 text-sm text-kipan-text-muted"><Spinner size={16} /> Memuat SK...</div>
              ) : skOptions.length === 0 ? (
                <Alert kind="info">
                  Belum ada SK yang bisa disusun. Buat SK lebih dulu (menu Surat Keputusan), lalu tambahkan pengurus sebelum SK diajukan/disahkan.
                </Alert>
              ) : (
                <label className="block text-sm font-semibold text-kipan-text-dark">
                  SK (Aktif &amp; belum final)
                  <select
                    value={sk ? String(sk.id) : ''}
                    onChange={(e) => {
                      const found = skOptions.find((s) => String(s.id) === e.target.value) ?? null;
                      setSk(found);
                    }}
                    className="mt-1 w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
                  >
                    <option value="">Pilih SK...</option>
                    {skOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.nomor_sk} — {s.level} ({skWilayah(s)})</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {currentKey === 'anggota' && (
            <div>
              <label className="block text-sm font-semibold text-kipan-text-dark" htmlFor="pw-cari">
                Cari anggota (nama / NIA) — hanya KADER AKTIF se-wilayah SK
              </label>
              <TextInput value={cari} onChange={setCari} placeholder="Ketik minimal 2 karakter" id="pw-cari" />
              <div className="mt-3">
                {loadingAnggota ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-kipan-text-muted"><Spinner size={16} /> Mencari...</div>
                ) : debouncedCari.trim().length < 2 ? (
                  <p className="py-2 text-xs text-kipan-text-muted">Mulai mengetik untuk mencari anggota.</p>
                ) : hasilAnggota.length === 0 ? (
                  <p className="py-2 text-xs text-kipan-text-muted">Tidak ada anggota AKTIF yang cocok di wilayah ini.</p>
                ) : (
                  <div className="max-h-56 overflow-auto rounded-lg border border-kipan-border bg-white">
                    {hasilAnggota.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAnggota(a)}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-kipan-soft-blue ${anggota?.id === a.id ? 'bg-kipan-soft-blue font-semibold' : ''}`}
                      >
                        <span>{a.nama_lengkap}</span>
                        <span className="font-mono text-xs text-kipan-text-muted">{a.nia}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {anggota && <p className="mt-2 text-xs font-semibold text-kipan-green">Terpilih: {anggota.nama_lengkap} ({anggota.nia})</p>}
            </div>
          )}

          {currentKey === 'jabatan' && (
            <div>
              {loadingJabatan ? (
                <div className="flex items-center gap-2 py-6 text-sm text-kipan-text-muted"><Spinner size={16} /> Memuat jabatan...</div>
              ) : jabatanList.length === 0 ? (
                <Alert kind="info">Belum ada master jabatan. Tambahkan dulu di menu Master Jabatan (semua admin boleh menambah).</Alert>
              ) : (
                <div className="grid gap-2">
                  {jabatanList.map((j) => {
                    const taken = j.is_inti && takenInti.has(j.id);
                    const selected = String(j.id) === jabatanId;
                    return (
                      <button
                        key={j.id}
                        type="button"
                        disabled={taken}
                        onClick={() => setJabatanId(String(j.id))}
                        className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left text-sm ${
                          taken ? 'cursor-not-allowed border-kipan-border bg-kipan-soft-gray opacity-60'
                            : selected ? 'border-kipan-navy bg-kipan-soft-blue font-semibold'
                            : 'border-kipan-border hover:border-kipan-blue/50'
                        }`}
                      >
                        <span>{j.nama}{j.is_inti ? ' (inti)' : ''}</span>
                        {taken && <span className="text-xs font-semibold text-kipan-red">sudah terisi</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentKey === 'konfirmasi' && sk && anggota && jabatanTerpilih && (
            <div className="space-y-4">
              <dl className="grid gap-2 rounded-xl border border-kipan-border bg-kipan-soft-gray p-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">SK</dt><dd className="font-semibold">{sk.nomor_sk} · {sk.level}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Anggota</dt><dd className="font-semibold">{anggota.nama_lengkap} ({anggota.nia})</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-kipan-text-muted">Jabatan</dt><dd className="font-semibold">{jabatanTerpilih.nama}{jabatanTerpilih.is_inti ? ' (inti)' : ''}</dd></div>
              </dl>
              <div>
                <label htmlFor="pw-mulai" className="block text-sm font-semibold text-kipan-text-dark">Tanggal Mulai Jabatan</label>
                <input
                  type="date"
                  id="pw-mulai"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
                />
              </div>
              <Alert kind="info">
                Saat disimpan: tipe akun anggota berubah <b>KADER → PENGURUS</b>, seluruh sesi login-nya <b>dicabut</b>, dan email
                notifikasi dikirim. Bila anggota ini sedang menjabat aktif di SK lain, jabatan lamanya otomatis menjadi <b>Demisioner</b>.
              </Alert>
              <label className="flex items-start gap-2 text-sm text-kipan-text-dark">
                <input type="checkbox" checked={konfirmasi} onChange={(e) => setKonfirmasi(e.target.checked)} className="mt-0.5 h-4 w-4 accent-kipan-navy" />
                Saya mengonfirmasi kader ini layak diangkat (penilaian kelayakan dilakukan di luar sistem).
              </label>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">
            <div>{stepIdx > 0 && <Button variant="ghost" onClick={back}>← Kembali</Button>}</div>
            {currentKey !== 'konfirmasi' ? (
              <Button variant="primary" onClick={next}>Lanjut →</Button>
            ) : (
              <Button variant="accent" onClick={() => void submit()} disabled={submitting || skFinal}>
                {submitting ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Mengangkat...</span> : 'Angkat Pengurus'}
              </Button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
