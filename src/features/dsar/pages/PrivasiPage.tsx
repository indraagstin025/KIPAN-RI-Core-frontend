import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert } from '@/components/ui/fields';
import { ErrorBox, Loading, PageHeader } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { fileDsar, myDsar, exportMine } from '../api/dsarService';
import { sisaJam } from '../lib/sla';
import { DSAR_JENIS, type DsarRequest } from '../types';
import StepUpModal from '@/components/ui/StepUpModal';

const STATUS_LABEL: Record<string, string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
};

export default function PrivasiPage() {
  const [items, setItems] = useState<DsarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [jenis, setJenis] = useState<string>('akses');
  const [detail, setDetail] = useState('');
  const [stepUpOpen, setStepUpOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await myDsar());
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat permohonan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function ajukan(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const b = await fileDsar(jenis, detail.trim() || undefined);
      const due = new Date(b.due_at).toLocaleString('id-ID');
      setOk(`Permohonan #${b.id} tercatat. Batas respons: ${due} (3x24 jam).`);
      setDetail('');
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengajukan permohonan');
    } finally {
      setBusy(false);
    }
  }

  async function unduhData(token: string): Promise<void> {
    setError(null);
    try {
      const data = await exportMine(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'data-pribadi-saya.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengunduh data');
    }
  }

  return (
    <div>
      <PageHeader
        title="Data Pribadi Saya"
        desc="Ajukan hak Anda atas data pribadi (UU PDP): akses, perbaiki, hapus, tarik persetujuan, portabilitas, batasi. Respons maks 3x24 jam."
        action={(
          <Button variant="outline-navy" onClick={() => setStepUpOpen(true)}>
            Unduh Data Saya (JSON)
          </Button>
        )}
      />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {ok && <div className="mb-4"><Alert kind="success">{ok}</Alert></div>}

      <form onSubmit={(e) => void ajukan(e)} className="rounded-2xl border border-kipan-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Permohonan Baru</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {DSAR_JENIS.map((j) => (
            <label key={j.key} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${jenis === j.key ? 'border-kipan-blue bg-kipan-soft-blue' : 'border-kipan-border'}`}>
              <input type="radio" name="dsar-jenis" value={j.key} checked={jenis === j.key} onChange={() => setJenis(j.key)} className="mt-1 accent-kipan-navy" />
              <span>
                <span className="block text-sm font-bold text-kipan-text-dark">{j.label}</span>
                <span className="mt-0.5 block text-xs text-kipan-text-muted">{j.desc}</span>
              </span>
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold text-kipan-text-dark" htmlFor="dsar-detail">
          Keterangan tambahan (opsional, maks 2000 karakter)
        </label>
        <textarea
          id="dsar-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value.slice(0, 2000))}
          rows={3}
          placeholder="Contoh: field alamat salah, seharusnya Jl. Merdeka No. 12"
          className="mt-2 w-full rounded-lg border border-kipan-border px-3.5 py-2.5 text-sm focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20"
        />
        <Button variant="primary" disabled={busy} className="mt-4">
          {busy ? 'Mengirim...' : 'Ajukan Permohonan'}
        </Button>
      </form>

      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Riwayat Permohonan</h2>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-kipan-border bg-white p-10 text-center text-kipan-text-muted">Belum ada permohonan.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Batas Respons</th>
                <th className="px-4 py-3">Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const sisa = sisaJam(b.due_at);
                const terbuka = b.status === 'diajukan' || b.status === 'diproses';
                return (
                  <tr key={b.id} className="border-t border-kipan-border hover:bg-kipan-soft-gray/60">
                    <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                    <td className="px-4 py-3 font-semibold">{b.jenis}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${b.status === 'selesai' ? 'bg-emerald-100 text-kipan-green' : b.status === 'ditolak' ? 'bg-red-100 text-kipan-red' : 'bg-sky-100 text-kipan-blue'}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-kipan-text-muted">
                      {new Date(b.due_at).toLocaleString('id-ID')}
                      {terbuka && (
                        <span className={`ml-2 font-bold ${sisa < 0 ? 'text-kipan-red' : ''}`}>
                          {sisa < 0 ? 'terlambat' : `sisa ${sisa} jam`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-kipan-text-muted">{b.catatan_admin ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <StepUpModal
        open={stepUpOpen}
        title="Unduh data pribadi — verifikasi ulang"
        onClose={() => setStepUpOpen(false)}
        onToken={(tok) => void unduhData(tok)}
      />
    </div>
  );
}
