import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Bell,
  ChevronDown,
  Calendar,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Menu,
} from 'lucide-react';

export default function TopHeader({
  activeTab,
  user,
  logout,
  quickDemoLogin,
  isWholesale,
  setIsWholesale,
  onOpenBarcodeScanner,
  globalSearch,
  setGlobalSearch,
  onToggleMobileSidebar,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'Stok Menipis',
      desc: 'Semen Portland 50kg tersisa 25 Sak (dibawah min 50 Sak)',
      time: '10 menit lalu',
      type: 'warning',
    },
    {
      id: 2,
      title: 'Jatuh Tempo Kasbon',
      desc: 'Pak Joko memiliki tagihan jatuh tempo Rp 22.000.000',
      time: '1 jam lalu',
      type: 'danger',
    },
    {
      id: 3,
      title: 'Barang Masuk Diterima',
      desc: 'PO #IN-20261020-001 dari PT Semen Indonesia telah tiba',
      time: '3 jam lalu',
      type: 'success',
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#DEDCCF] px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-20 shrink-0">
      {/* Mobile Sidebar Hamburger Toggle */}
      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden p-2 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] text-[#252922] transition shrink-0"
        title="Buka Menu Navigasi"
      >
        <Menu className="w-4 h-4 text-[#234536]" />
      </button>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeTab === 'pos'
                ? 'Cari nama barang, merek, atau kode SKU...'
                : activeTab === 'debts'
                ? 'Cari nama mandor, proyek, atau nomor transaksi...'
                : activeTab === 'inventory'
                ? 'Cari barang, merek, atau kategori...'
                : activeTab === 'reports'
                ? 'Cari barang, transaksi, atau laporan...'
                : 'Cari data di sistem...'
            }
            value={globalSearch || ''}
            onChange={(e) => setGlobalSearch && setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-12 py-2 text-xs font-semibold bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:outline-none focus:border-[#234536] focus:bg-white text-[#252922] placeholder-[#8C877D] transition"
          />
          <div className="absolute right-3 px-1.5 py-0.5 rounded bg-white border border-[#DEDCCF] text-[10px] font-mono text-[#8C877D] font-medium shadow-2xs">
            F4
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* POS-specific buttons */}
        {activeTab === 'pos' && (
          <>
            <button
              onClick={onOpenBarcodeScanner}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] text-xs font-bold text-[#252922] transition"
            >
              <Barcode className="w-4 h-4 text-[#234536]" />
              <span>Scan Barcode</span>
              <span className="text-[10px] bg-white border border-[#DEDCCF] px-1 rounded font-mono text-[#8C877D]">
                F3
              </span>
            </button>

            <button
              onClick={() => setIsWholesale && setIsWholesale(!isWholesale)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-control text-xs font-bold transition border ${
                isWholesale
                  ? 'bg-[#C6A46A] text-white border-[#C6A46A] shadow-sm'
                  : 'bg-[#F7F4ED] hover:bg-[#ECEAE2] text-[#252922] border-[#DEDCCF]'
              }`}
              title="Aktifkan perhitungan harga grosir"
            >
              <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                %
              </div>
              <span className="hidden md:inline">Harga Grosir</span>
            </button>
          </>
        )}

        {/* Non-POS Date Display */}
        {activeTab !== 'pos' && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922]">
            <Calendar className="w-3.5 h-3.5 text-[#234536]" />
            <span>01 Okt 2026 - 31 Okt 2026</span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="w-9 h-9 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] flex items-center justify-center text-[#252922] relative transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C62828] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-card shadow-modal border border-[#DEDCCF] p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#DEDCCF]">
                <div className="text-xs font-bold text-[#252922]">Notifikasi Sistem (3)</div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-[#234536] font-semibold hover:underline"
                >
                  Tutup
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-control bg-[#F7F4ED]/60 border border-[#DEDCCF]/70 text-xs hover:bg-[#F7F4ED] transition"
                  >
                    <div className="font-bold text-[#252922] flex items-center gap-1.5">
                      {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />}
                      {n.type === 'danger' && <AlertTriangle className="w-3.5 h-3.5 text-[#C62828]" />}
                      {n.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-[#16845B]" />}
                      <span>{n.title}</span>
                    </div>
                    <div className="text-[11px] text-[#625D53] mt-0.5">{n.desc}</div>
                    <div className="text-[10px] text-[#8C877D] mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] transition"
          >
            <div className="w-7 h-7 rounded-full bg-[#234536] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.role === 'admin' ? '👑' : user?.role === 'cashier' ? '🛒' : '📦'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-extrabold text-[#252922] leading-tight">
                {user?.role === 'admin' ? 'Admin' : user?.role === 'cashier' ? 'Kasir' : 'Gudang'}
              </div>
              <div className="text-[10px] text-[#625D53] font-medium leading-none">
                Toko Sentosa
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#625D53]" />
          </button>

          {/* Profile & Role Switch Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-card shadow-modal border border-[#DEDCCF] p-3 z-50">
              <div className="pb-2.5 border-b border-[#DEDCCF]">
                <div className="text-xs font-extrabold text-[#252922]">{user?.name || 'Vincent G'}</div>
                <div className="text-[11px] text-[#625D53]">
                  Masuk sebagai: <span className="font-bold uppercase text-[#234536]">{user?.role || 'admin'}</span>
                </div>
              </div>

              {/* Demo Role Switcher */}
              <div className="py-2 border-b border-[#DEDCCF]">
                <div className="text-[10px] font-bold uppercase text-[#8C877D] mb-1.5 tracking-wider">
                  Ganti Cepat Peran (Demo):
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      quickDemoLogin('admin');
                      setShowProfileMenu(false);
                    }}
                    className={`py-1 text-center rounded text-[11px] font-bold border transition ${
                      user?.role === 'admin'
                        ? 'bg-[#234536] text-white border-[#234536]'
                        : 'bg-[#F7F4ED] text-[#252922] border-[#DEDCCF] hover:bg-white'
                    }`}
                  >
                    Bos
                  </button>
                  <button
                    onClick={() => {
                      quickDemoLogin('cashier');
                      setShowProfileMenu(false);
                    }}
                    className={`py-1 text-center rounded text-[11px] font-bold border transition ${
                      user?.role === 'cashier'
                        ? 'bg-[#234536] text-white border-[#234536]'
                        : 'bg-[#F7F4ED] text-[#252922] border-[#DEDCCF] hover:bg-white'
                    }`}
                  >
                    Kasir
                  </button>
                  <button
                    onClick={() => {
                      quickDemoLogin('warehouse');
                      setShowProfileMenu(false);
                    }}
                    className={`py-1 text-center rounded text-[11px] font-bold border transition ${
                      user?.role === 'warehouse'
                        ? 'bg-[#234536] text-white border-[#234536]'
                        : 'bg-[#F7F4ED] text-[#252922] border-[#DEDCCF] hover:bg-white'
                    }`}
                  >
                    Gudang
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-[#C62828] hover:bg-red-50 rounded-control transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Aplikasi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
