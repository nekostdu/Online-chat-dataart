import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import React from 'react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const location = useLocation();
  if (!initialized) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
