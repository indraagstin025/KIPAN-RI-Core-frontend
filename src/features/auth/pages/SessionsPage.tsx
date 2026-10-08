import { useCallback, useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader } from '@/components/ui/stateful';
import { Spinner } from '@/components/ui/loading';
import { ApiError } from '@/services/apiClient';
import { getMySessions, revokeSession, type UserSession } from '../api/authService';

// Sesi Aktif: daftar sesi login milik sendiri + cabut per sesi.
// Mencabut sesi saat ini = keluar dari perangkat ini.
export default function SessionsPage() {
  const [items, setItems] = useState<UserSession[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMySessions();
      setItems(res.sessions);
      setCurrent(res.current || null);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat sesi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cabut(familyId: string, isCurrent: boolean): Promise<void> {
    const msg = isCurrent
      ? 'Cabut sesi INI? Anda akan keluar dari perangkat ini.'
      : 'Cabut sesi ini? Perangkat tersebut akan keluar dan harus login ulang.';
    if (!window.confirm(msg)) return;
    setRevoking(familyId);
    setError(null);
    try {
      await revokeSession(familyId);
      if (isCurrent) {
        window.location.assign('/');
        return;
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mencabut sesi');
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Sesi Aktif" desc="Perangkat yang sedang login ke akun Anda. Cabut sesi yang tidak dikenal." />
      {loading ? (
        <Card>
          <p className="flex items-center gap-2 text-sm text-kipan-text-muted"><Spinner size={15} /> Memuat…</p>
        </Card>
      ) : (
        <Card>
          {error && <div className="mb-4"><ErrorBox message={error} /></div>}
          {items.length === 0 ? (
            <p className="text-sm text-kipan-text-muted">Tidak ada sesi aktif.</p>
          ) : (
            <ul className="grid gap-3">
              {items.map((s) => {
                const isCurrent = !!current && s.family_id === current;
                return (
                  <li key={s.family_id} className="rounded-lg border border-kipan-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-kipan-text-dark">
                        {s.ip_address || '-'}
                        {isCurrent && <span className="ml-2 rounded bg-kipan-soft-blue px-2 py-0.5 text-xs text-kipan-blue">perangkat ini</span>}
                      </p>
                      <button
                        type="button"
                        onClick={() => void cabut(s.family_id, isCurrent)}
                        disabled={revoking === s.family_id}
                        className="rounded-lg border border-kipan-red/40 px-3 py-1.5 text-xs font-semibold text-kipan-red hover:bg-red-50 disabled:opacity-50"
                      >
                        {revoking === s.family_id ? 'Mencabut…' : 'Cabut'}
                      </button>
                    </div>
                    <p className="mt-1 break-all text-xs text-kipan-text-muted">{s.user_agent || '-'}</p>
                    <p className="mt-1 text-xs text-kipan-text-muted">
                      Sejak {new Date(s.created_at).toLocaleString('id-ID')} · berlaku s/d {new Date(s.expires_at).toLocaleString('id-ID')}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
