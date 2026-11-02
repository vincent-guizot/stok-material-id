import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore.js';
import { queryClient } from './services/queryClient.js';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './router.jsx';

export default function App() {
  useEffect(() => {
    const expire = () => useAuthStore.getState().logout();
    window.addEventListener('auth_expired', expire);
    return () => window.removeEventListener('auth_expired', expire);
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
