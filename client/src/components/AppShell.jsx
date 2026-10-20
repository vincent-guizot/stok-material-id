import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopHeader from './TopHeader.jsx';
import { useAuthStore } from '../store/useAuthStore.js';
import { useCartStore } from '../store/useCartStore.js';

export default function AppShell({
  activeTab,
  setActiveTab,
  subTab,
  setSubTab,
  children,
  globalSearch,
  setGlobalSearch,
}) {
  const { user, logout, quickDemoLogin } = useAuthStore();
  const { items } = useCartStore();
  const [isWholesale, setIsWholesale] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const pathName = location.pathname.replace(/^\//, '').split('/')[0];
  const currentTab = activeTab || (pathName === '' ? 'pos' : pathName);

  // Global hotkeys (F1 - F10, Esc, Ctrl+K)
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Allow Esc to blur active inputs
      if (e.key === 'Escape') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
          e.target.blur();
          return;
        }
      }

      // Quick search focus with Ctrl+K or '/' when not in input
      if (
        (e.key === 'k' && (e.ctrlKey || e.metaKey)) ||
        (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))
      ) {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Don't intercept function keys if user is typing text, but allow F1-F12
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.key.startsWith('F')) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('pos');
        navigate('/pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('debts');
        navigate('/debts');
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('inventory');
        navigate('/inventory');
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('reports');
        navigate('/reports');
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('master');
        navigate('/master');
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('mandor');
        navigate('/mandor');
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('suppliers');
        navigate('/suppliers');
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('settings');
        navigate('/settings');
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('help');
        navigate('/help');
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (items.length > 0) {
          if (setActiveTab) setActiveTab('checkout');
          navigate('/checkout');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [navigate, setActiveTab, items.length]);

  const effectiveSearch = globalSearch !== undefined ? globalSearch : localSearch;
  const handleSearchChange = setGlobalSearch || setLocalSearch;

  const handleOpenBarcodeScanner = () => {
    alert('Simulasi Barcode Scanner aktif: Gunakan scanner USB/Bluetooth Anda atau tekan Enter pada input SKU.');
  };

  return (
    <div className="flex h-screen bg-[#F7F4ED] overflow-hidden">
      {/* Left Sidebar (Desktop persistent + Mobile slide-over) */}
      <Sidebar
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        subTab={subTab}
        setSubTab={setSubTab}
        user={user}
        cartCount={items.length}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <TopHeader
          activeTab={currentTab}
          user={user}
          logout={logout}
          quickDemoLogin={quickDemoLogin}
          isWholesale={isWholesale}
          setIsWholesale={setIsWholesale}
          onOpenBarcodeScanner={handleOpenBarcodeScanner}
          globalSearch={effectiveSearch}
          setGlobalSearch={handleSearchChange}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Page Content */}
        <main
          className={`flex-1 min-w-0 w-full ${
            currentTab === 'pos' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {children || (
            <Outlet
              context={{
                globalSearch: effectiveSearch,
                setGlobalSearch: handleSearchChange,
                isWholesale,
                setIsWholesale,
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
