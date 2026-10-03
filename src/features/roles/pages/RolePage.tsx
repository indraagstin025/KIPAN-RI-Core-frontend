import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Card, ErrorBox, Loading, PageHeader } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { getRoleCatalog } from '../api/rolesService';
import type { RoleCatalog } from '../types';

export default function RolePage() {
  const [catalog, setCatalog] = useState<RoleCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCatalog(await getRoleCatalog());
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat katalog role');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading />;
  if (!catalog) return <ErrorBox message={error ?? 'Katalog tidak tersedia'} />;

  return (
    <div>
      <PageHeader
        title="Role & Wewenang"
        desc="Katalog peran admin dan matriks wewenang (read-only, ditegakkan server-side)."
        action={<Button variant="outline-navy" onClick={() => window.print()}>Cetak / PDF</Button>}
      />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.roles.map((r) => (
          <Card key={r.key}>
            <p className="text-sm font-bold text-kipan-text-dark">{r.label}</p>
            <p className="mt-1 text-xs text-kipan-text-muted">{r.description}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-kipan-navy">{r.key}</p>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-kipan-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-kipan-soft-blue text-xs uppercase tracking-wide text-kipan-text-muted">
            <tr>
              <th className="px-4 py-3">Wewenang</th>
              {catalog.roles.map((r) => (
                <th key={r.key} className="px-3 py-3 text-center">{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.capabilities.map((cap) => (
              <tr key={cap.key} className="border-t border-kipan-border align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-kipan-text-dark">{cap.label}</div>
                  <div className="text-xs text-kipan-text-muted">{cap.description}</div>
                </td>
                {catalog.roles.map((r) => (
                  <td key={r.key} className="px-3 py-3 text-center">
                    {cap.roles.includes(r.key)
                      ? <span className="text-kipan-green" aria-label="diizinkan">✓</span>
                      : <span className="text-kipan-border" aria-label="tidak">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
