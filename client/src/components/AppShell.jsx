import React, { useState } from 'react';
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

  const handleOpenBarcodeScanner = () => {
    alert('Simulasi Barcode Scanner aktif: Gunakan scanner USB/Bluetooth Anda atau tekan Enter pada input SKU.');
  };

  return (
    <div className="flex h-screen bg-[#F7F4ED] overflow-hidden">
      {/* Left Sidebar (Desktop persistent + Mobile slide-over) */}
      <Sidebar
        activeTab={activeTab}
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
          activeTab={activeTab}
          user={user}
          logout={logout}
          quickDemoLogin={quickDemoLogin}
          isWholesale={isWholesale}
          setIsWholesale={setIsWholesale}
          onOpenBarcodeScanner={handleOpenBarcodeScanner}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
