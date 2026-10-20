import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore.js';
import Navbar from './components/Navbar.jsx';
import POSPage from './pages/POSPage.jsx';
import DebtLedgerPage from './pages/DebtLedgerPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 detik
    },
  },
});

export default function App() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('pos');

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1">
          {activeTab === 'pos' && <POSPage />}
          {activeTab === 'debts' && <DebtLedgerPage />}
          {activeTab === 'inventory' && <InventoryPage />}
          {activeTab === 'reports' && <ReportsPage />}
        </main>
      </div>
    </QueryClientProvider>
  );
}
