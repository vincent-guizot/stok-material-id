import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore.js';
import AppShell from './components/AppShell.jsx';
import POSPage from './pages/POSPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import DebtLedgerPage from './pages/DebtLedgerPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import MasterDataPage from './pages/MasterDataPage.jsx';
import SupplierPage from './pages/SupplierPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import HelpCenterPage from './pages/HelpCenterPage.jsx';
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
  const [subTab, setSubTab] = useState('stock-list');
  const [globalSearch, setGlobalSearch] = useState('');

  // Global hotkeys (F1 - F4)
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Don't intercept if typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('debts');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('reports');
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        subTab={subTab}
        setSubTab={setSubTab}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
      >
        {activeTab === 'pos' && (
          <POSPage
            onProceedToPayment={() => setActiveTab('checkout')}
            globalSearch={globalSearch}
          />
        )}

        {activeTab === 'checkout' && (
          <PaymentPage onBackToPOS={() => setActiveTab('pos')} />
        )}

        {(activeTab === 'debts' || activeTab === 'mandor') && (
          <DebtLedgerPage />
        )}

        {activeTab === 'inventory' && (
          <InventoryPage subTab={subTab} setSubTab={setSubTab} />
        )}

        {activeTab === 'reports' && (
          <ReportsPage subTab={subTab} setSubTab={setSubTab} />
        )}

        {activeTab === 'master' && (
          <MasterDataPage subTab={subTab} setSubTab={setSubTab} />
        )}

        {activeTab === 'suppliers' && (
          <SupplierPage />
        )}

        {activeTab === 'settings' && (
          <SettingsPage subTab={subTab} setSubTab={setSubTab} />
        )}

        {activeTab === 'help' && (
          <HelpCenterPage />
        )}
      </AppShell>
    </QueryClientProvider>
  );
}
