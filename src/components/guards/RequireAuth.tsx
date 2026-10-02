import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth({ children, loginPath = '/login' }: { children: ReactNode; loginPath?: string }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kipan-soft-gray">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-kipan-border border-t-kipan-blue" aria-label="Memuat" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
