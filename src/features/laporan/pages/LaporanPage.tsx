import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Card, ErrorBox, Loading, PageHeader } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { exportLaporan, getLaporan } from '../api/laporanService';
import type { LaporanCount, LaporanData } from '../types';

function BarList({ title, data }: { title: string; data: LaporanCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.jumlah));
  return (
    <Card>
      <p className="mb-3 text-sm font-bold text-kipan-text-dark">{title}</p>
      {data.length === 0 ? (
        <p className="text-sm text-kipan-text-muted">Belum ada data.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.label}>
              <div className="flex justify-between text-xs text-kipan-text-muted">
                <span className="truncate pr-2 font-medium text-kipan-text-dark">{d.label}</span>
                <span className="font-bold">{d.jumlah}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-kipan-soft-gray">
                <div className="h-2 rounded-full bg-kipan-blue" style={{ width: `${(d.jumlah / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ekspor, setEkspor] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getLaporan());
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unduhCsv(): Promise<void> {
    setEkspor(true);
    try {
      await exportLaporan();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengekspor CSV');
    } finally {
      setEkspor(false);
    }
  }

  if (loading) return <Loading />;
  if (!data) return <ErrorBox message={error ?? 'Laporan tidak tersedia'} />;

  const s = data.summary;

  return (
    <div>
      <PageHeader
        title="Laporan & Statistik"
        desc="Ringkasan, demografi, dan tren keanggotaan sesuai yurisdiksi Anda."
        action={(
          <div className="flex gap-2">
            <Button variant="outline-navy" onClick={() => void unduhCsv()} disabled={ekspor}>{ekspor ? 'Menyiapkan...' : 'Ekspor CSV'}</Button>
            <Button variant="outline-navy" onClick={() => window.print()}>Cetak / PDF</Button>
          </div>
        )}
      />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card><p className="text-xs text-kipan-text-muted">Total Anggota</p><p className="text-2xl font-bold text-kipan-text-dark">{s.total_anggota}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Anggota Aktif</p><p className="text-2xl font-bold text-kipan-text-dark">{s.anggota_aktif}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Menunggu Verifikasi</p><p className="text-2xl font-bold text-amber-600">{s.menunggu_verifikasi}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">Pengurus Aktif</p><p className="text-2xl font-bold text-kipan-text-dark">{s.total_pengurus}</p></Card>
        <Card><p className="text-xs text-kipan-text-muted">SK Aktif</p><p className="text-2xl font-bold text-kipan-text-dark">{s.total_sk_aktif}</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Anggota per Status" data={data.anggota_by_status} />
        <BarList title="Pendaftaran per Status" data={data.pendaftaran_by_status} />
        <BarList title="Pengurus Aktif per Level" data={data.pengurus_by_level} />
        <BarList title="Demografi — Kelompok Usia" data={data.demografi_usia} />
        <BarList title="Demografi — Pendidikan" data={data.demografi_pendidikan} />
        <BarList title="Demografi — Pekerjaan" data={data.demografi_pekerjaan} />
        <BarList title={`Distribusi Anggota — ${data.wilayah_label}`} data={data.wilayah} />
        <BarList title="Tren Anggota Baru (12 Bulan)" data={data.tren.map((t) => ({ label: t.bulan, jumlah: t.jumlah }))} />
      </div>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-kipan-text-dark">Anomali NIA (kode NIK ≠ kode domisili)</p>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{data.anomali_count}</span>
        </div>
        {data.anomali_nia.length === 0 ? (
          <p className="text-sm text-kipan-text-muted">Tidak ada anomali terdeteksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-kipan-text-muted">
                <tr><th className="py-2 pr-4">NIA</th><th className="py-2 pr-4">Nama</th><th className="py-2 pr-4">Kode NIK</th><th className="py-2">Kode Domisili</th></tr>
              </thead>
              <tbody>
                {data.anomali_nia.map((a) => (
                  <tr key={a.nia} className="border-t border-kipan-border">
                    <td className="py-2 pr-4 font-mono text-xs text-kipan-navy">{a.nia}</td>
                    <td className="py-2 pr-4 font-semibold text-kipan-text-dark">{a.nama}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{a.kode_nik}</td>
                    <td className="py-2 font-mono text-xs">{a.kode_domisili}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
