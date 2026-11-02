import { MotionConfig } from 'framer-motion';
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 detik
    },
  },
});

export default function App() {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.18 }}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
    </MotionConfig>
  );
}
