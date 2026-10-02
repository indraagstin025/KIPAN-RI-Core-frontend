import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, ErrorBox, Loading, PageHeader } from '@/components/ui/stateful';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/apiClient';
import { checkNasionalOrSuper, checkSuperOnly, getMeScope } from '../api/verificationService';
import type { MeScope } from '../types';
import { checkHealth } from '@/features/system/api/systemService';

export default function DashboardPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<MeScope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rbac, setRbac] = useState<{ superOnly?: string; nasional?: string }>({});
  const [health, setHealth] = useState<string>('memeriksa...');

  useEffect(() => {
    void (async () => {
      try {
        const h = await checkHealth();
        setHealth(h.status === 'ok' ? `Online (${new Date(h.time).toLocaleTimeString('id-ID')})` : h.status);
      } catch {
        setHealth('Tidak dapat dijangkau');
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setScope(await getMeScope());
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : 'Gagal memuat scope wilayah');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function cekSuperOnly(): Promise<void> {
    try {
      await checkSuperOnly();
      setRbac((p) => ({ ...p, superOnly: 'Hijau — akses super-only terbuka.' }));
    } catch (e: unknown) {
      setRbac((p) => ({ ...p, superOnly: e instanceof ApiError ? `Ditolak ${e.status}: ${e.message}` : 'Gagal' }));
    }
  }

  async function cekNasional(): Promise<void> {
    try {
      await checkNasionalOrSuper();
      setRbac((p) => ({ ...p, nasional: 'Hijau — akses nasional/super terbuka.' }));
    } catch (e: unknown) {
      setRbac((p) => ({ ...p, nasional: e instanceof ApiError ? `Ditolak ${e.status}: ${e.message}` : 'Gagal' }));
    }
  }

  return (
    <div>
      <PageHeader title={`Selamat datang, ${user?.name ?? 'Admin'}`} desc="Ringkasan akun, cakupan wilayah, dan uji otorisasi RBAC." />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Cakupan Wilayah</h2>
          {loading ? (
            <Loading label="Memuat scope..." />
          ) : scope ? (
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Role" value={scope.role} />
              <Row label="Email" value={scope.email} />
              <Row label="Filter Provinsi" value={scope.filter_provinsi_id !== null ? `#${scope.filter_provinsi_id}` : 'Tanpa filter (nasional)'} />
              <Row label="Filter Kabupaten" value={scope.filter_kabupaten_id !== null ? `#${scope.filter_kabupaten_id}` : 'Tanpa filter'} />
              <Row label="Scope Nasional" value={scope.is_nasional_scope ? 'Ya' : 'Tidak'} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-kipan-text-muted">Tidak tersedia.</p>
          )}
          <div className="mt-5">
            <Link to="/admin/pendaftaran" className="inline-flex rounded-lg bg-kipan-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-kipan-navy">
              Buka Antrean Pendaftaran →
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Status</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Status Layanan" value={health} />
          </dl>
          {import.meta.env.DEV && (
            <>
              <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-kipan-text-muted">Uji Otorisasi RBAC (dev)</h2>
              <p className="mt-2 text-sm text-kipan-text-muted">Endpoint dummy non-production untuk memverifikasi guard role server-side.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline-navy" onClick={() => void cekSuperOnly()}>Uji /admin/super-only</Button>
                <Button variant="outline-navy" onClick={() => void cekNasional()}>Uji /admin/nasional-or-super</Button>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                {rbac.superOnly && <Row label="super-only" value={rbac.superOnly} />}
                {rbac.nasional && <Row label="nasional-or-super" value={rbac.nasional} />}
              </dl>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-kipan-text-muted">{label}</dt>
      <dd className="text-right font-semibold text-kipan-text-dark">{value}</dd>
    </div>
  );
}
