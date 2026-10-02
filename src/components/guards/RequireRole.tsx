import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/features/auth/types';

export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="rounded-2xl border border-kipan-red/30 bg-red-50 p-8 text-center">
        <p className="text-2xl" aria-hidden="true">🚫</p>
        <h2 className="mt-2 text-lg font-bold text-kipan-red">Akses Ditolak</h2>
        <p className="mt-1 text-sm text-kipan-text-muted">Role <strong>{user?.role ?? 'ANON'}</strong> tidak berwenang membuka halaman ini.</p>
      </div>
    );
  }
  return <>{children}</>;
}
