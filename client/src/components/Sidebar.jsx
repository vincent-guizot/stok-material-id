import React from 'react';
import {
  ShoppingCart,
  BookOpen,
  Package,
  BarChart3,
  Database,
  Users,
  Truck,
  Settings,
  HelpCircle,
  CreditCard,
  X,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({
  activeTab,
  setActiveTab,
  setSubTab,
  cartCount = 0,
  isOpen = false,
  onClose,
}) {
  const navItems = [
    {
      id: 'pos',
      label: 'Kasir Penjualan',
      icon: ShoppingCart,
      shortcut: 'F1',
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      id: 'debts',
      label: 'Buku Kasbon Mandor',
      icon: BookOpen,
      shortcut: 'F2',
    },
    {
      id: 'inventory',
      label: 'Stok & Barang Masuk',
      icon: Package,
      shortcut: 'F3',
      defaultSubTab: 'stock-list',
    },
    {
      id: 'reports',
      label: 'Laporan Keuangan',
      icon: BarChart3,
      shortcut: 'F4',
      defaultSubTab: 'summary',
    },
    {
      id: 'master',
      label: 'Master Data',
      icon: Database,
      defaultSubTab: 'products',
    },
    {
      id: 'mandor',
      label: 'Data Mandor',
      icon: Users,
    },
    {
      id: 'suppliers',
      label: 'Data Supplier',
      icon: Truck,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      defaultSubTab: 'general',
    },
  ];

  const handleSelectNav = (item) => {
    setActiveTab(item.id);
    if (item.defaultSubTab && setSubTab) {
      setSubTab(item.defaultSubTab);
    }
    if (onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#DEDCCF] flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          onClick={() => {
            setActiveTab('pos');
            if (onClose) onClose();
          }}
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-[#234536] text-white shrink-0">
            <img
              src={logoImg}
              alt="StokMaterial.id Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.innerHTML = '🧱';
              }}
            />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="text-base font-extrabold text-[#252922] tracking-tight leading-tight flex items-center gap-1 truncate">
              StokMaterial<span className="text-[#234536]">.id</span>
            </div>
            <div className="text-[11px] text-[#625D53] truncate font-medium">
              Toko Bahan Bangunan
            </div>
          </div>
        </div>

        {/* Close Button on Mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-control text-[#8C877D] hover:text-[#252922] hover:bg-[#F7F4ED] transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List - Without Dropdown Accordions */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectNav(item)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#234536] text-white shadow-sm'
                  : 'text-[#252922] hover:bg-[#F7F4ED] hover:text-[#234536]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-[#625D53]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {item.shortcut && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F7F4ED] text-[#8C877D] border border-[#DEDCCF]'
                    }`}
                  >
                    {item.shortcut}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Dedicated Checkout indicator when in checkout mode */}
        {activeTab === 'checkout' && (
          <button
            onClick={() => {
              setActiveTab('checkout');
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold bg-[#234536] text-white shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CreditCard className="w-4 h-4 shrink-0 text-white" />
              <span>Pembayaran</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-white/20 text-white">
              F5
            </span>
          </button>
        )}
      </nav>

      {/* Bottom Help Banner */}
      <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED]/80">
        <div className="bg-white rounded-card p-3 border border-[#DEDCCF] shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-lg shrink-0 border border-amber-300">
              👷‍♂️
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#252922] truncate">Butuh Bantuan?</div>
              <div className="text-[10px] text-[#625D53] leading-tight truncate">
                Hubungi admin toko.
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('help');
              if (onClose) onClose();
            }}
            className={`w-full py-1.5 px-3 rounded-control text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'help'
                ? 'bg-[#234536] text-white border-[#234536]'
                : 'bg-white text-[#252922] border-[#DEDCCF] hover:bg-[#F7F4ED]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pusat Bantuan</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#DEDCCF] flex-col h-screen sticky top-0 shrink-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Visible when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Slide-in */}
          <div className="relative w-64 max-w-[80vw] h-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
