import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import AppShell from './AppShell.jsx';

export default function ProtectedLayout() {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin' && ['/reports', '/settings'].includes(location.pathname)) {
    return <div role="alert" className="p-8">Halaman ini hanya tersedia untuk admin. <a href="/pos">Kembali ke Kasir</a></div>;
  }
  return <AppShell />;
}
