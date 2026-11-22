import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import WorkerAvatar from './WorkerAvatar.jsx';
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

const SEARCH_PLACEHOLDER = {
  pos: 'Cari nama barang, merek, atau kode SKU...',
  checkout: 'Cari nama barang, merek, atau kode SKU...',
  debts: 'Cari nama mandor, proyek, atau nomor transaksi...',
  inventory: 'Cari nama barang, merek, atau kode SKU...',
  reports: 'Cari barang, transaksi, atau laporan...',
  master: 'Cari nama barang, merek, atau kode SKU...',
  suppliers: 'Cari nama supplier, kontak, atau kota...',
  settings: 'Cari pengaturan, pengguna, printer, atau backup...',
  help: 'Cari bantuan, fitur, atau pertanyaan...',
};

// Tombol di sisi kanan header per halaman (mengikuti mockup)
const HEADER_EXTRAS = {
  pos: ['scan', 'wholesale'],
  inventory: ['scan', 'wholesale'],
  debts: ['wholesale'],
  master: ['wholesale'],
  checkout: ['today', 'wholesale'],
  reports: ['range', 'branch'],
  suppliers: [],
  settings: [],
  help: [],
};

export default function TopHeader({
  activeTab,
  user,
  logout,
  isWholesale,
  setIsWholesale,
  onOpenBarcodeScanner,
  globalSearch,
  setGlobalSearch,
  onToggleMobileSidebar,
}) {
  const [now] = useState(() => new Date());
  const monthLabel = (() => {
    const f = (d) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    return `${f(new Date(now.getFullYear(), now.getMonth(), 1))} - ${f(new Date(now.getFullYear(), now.getMonth() + 1, 0))}`;
  })();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

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

  const { data: notif } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    refetchInterval: 60000,
    enabled: !!user,
  });
  const notifications = notif?.data || [];
  const notifTotal = notif?.meta?.total ?? notifications.length;
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data.data,
    enabled: !!user,
    staleTime: 60000,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data.data,
    enabled: !!user,
    staleTime: 60000,
  });
  const timeAgo = (v) => {
    const mins = Math.max(0, Math.round((now.getTime() - new Date(v).getTime()) / 60000));
    if (mins < 60) return `${mins} menit lalu`;
    if (mins < 1440) return `${Math.round(mins / 60)} jam lalu`;
    return `${Math.round(mins / 1440)} hari lalu`;
  };

  return (
    <header className="h-[68px] bg-white border-b border-[#DEDCCF] flex items-center shrink-0 z-20">
      {/* Brand: logo + nama + subjudul (selebar sidebar di desktop) */}
      <div className="flex items-center gap-3 px-4 lg:w-[300px] shrink-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] text-[#252922] transition shrink-0"
          title="Buka Menu Navigasi"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-4 h-4 text-[#234536]" />
        </button>
        <button onClick={() => navigate('/pos')} className="flex items-center gap-3 min-w-0 text-left" aria-label="StokMaterial.id - ke Kasir">
          <img src="/02_ikon-aplikasi-full-color.png" alt="" className="w-11 h-11 rounded-xl shadow-sm shrink-0" />
          <span className="hidden sm:block min-w-0">
            <span className="block text-[20px] font-extrabold text-[#1B3A2D] tracking-tight leading-tight">StokMaterial.id</span>
            <span className="block text-[11px] text-[#625D53] leading-tight whitespace-nowrap">Toko Bangunan &amp; Material Konstruksi</span>
          </span>
        </button>
      </div>

      <div className="flex-1 min-w-0 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-[640px]">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            placeholder={SEARCH_PLACEHOLDER[activeTab] || 'Cari data di sistem...'}
            value={globalSearch || ''}
            onChange={(e) => setGlobalSearch && setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-16 py-3 text-sm font-medium bg-white border border-[#DEDCCF] rounded-control focus:outline-none focus:border-[#234536] focus:bg-white text-[#252922] placeholder-[#8C877D] transition"
          />
          <div className="absolute right-3 px-1.5 py-0.5 rounded bg-white border border-[#DEDCCF] text-[10px] font-mono text-[#8C877D] font-medium shadow-2xs">
            Ctrl+K
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {(HEADER_EXTRAS[activeTab] || []).includes('scan') && (
          <button
            onClick={onOpenBarcodeScanner}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] text-xs font-bold text-[#252922] transition"
          >
            <Barcode className="w-5 h-5 text-[#234536]" />
            <span className="text-left leading-tight">Scan<br />Barcode</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#F7F4ED] text-[#8C877D] border border-[#DEDCCF]">F3</span>
          </button>
        )}

        {(HEADER_EXTRAS[activeTab] || []).includes('wholesale') && (
          <button
            onClick={() => setIsWholesale && setIsWholesale(!isWholesale)}
            aria-pressed={!!isWholesale}
            className={`flex items-center gap-2 px-3 py-2 rounded-control text-xs font-bold transition border ${
              isWholesale
                ? 'bg-[#C6A46A] text-white border-[#C6A46A] shadow-sm'
                : 'bg-white hover:bg-[#F7F4ED] text-[#252922] border-[#DEDCCF]'
            }`}
            title="Aktifkan perhitungan harga grosir"
          >
            <span className="w-6 h-6 rounded-full bg-[#F6E3BF] text-[#B45309] flex items-center justify-center font-extrabold text-[11px]">%</span>
            <span className="hidden md:block text-left leading-tight">Harga<br />Grosir</span>
          </button>
        )}

        {(HEADER_EXTRAS[activeTab] || []).includes('today') && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922]">
            <Calendar className="w-4 h-4 text-[#234536]" />
            <span className="leading-tight">
              {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(now)}
              <span className="block text-[10px] font-medium text-[#625D53]">
                {new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(now)}
              </span>
            </span>
          </div>
        )}

        {(HEADER_EXTRAS[activeTab] || []).includes('range') && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922]">
            <Calendar className="w-4 h-4 text-[#234536]" />
            <span>{monthLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#625D53]" />
          </div>
        )}

        {(HEADER_EXTRAS[activeTab] || []).includes('branch') && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922]">
            <span>Semua Cabang{branches.length ? ` (${branches.length})` : ''}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#625D53]" />
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="w-11 h-11 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] flex items-center justify-center text-[#252922] relative transition"
          >
            <Bell className="w-4 h-4" />
            {notifTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#C62828] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                {notifTotal > 99 ? '99+' : notifTotal}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-card shadow-modal border border-[#DEDCCF] p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#DEDCCF]">
                <div className="text-xs font-bold text-[#252922]">Notifikasi Sistem ({notifTotal})</div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-[#234536] font-semibold hover:underline"
                >
                  Tutup
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="py-6 text-center text-xs text-[#8C877D]">Tidak ada notifikasi. Semua aman.</div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      if (n.link) navigate(n.link);
                    }}
                    className="p-2 rounded-control bg-[#F7F4ED]/60 border border-[#DEDCCF]/70 text-xs hover:bg-[#F7F4ED] transition cursor-pointer"
                  >
                    <div className="font-bold text-[#252922] flex items-center gap-1.5">
                      {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />}
                      {n.type === 'danger' && <AlertTriangle className="w-3.5 h-3.5 text-[#C62828]" />}
                      {n.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-[#16845B]" />}
                      <span>{n.title}</span>
                    </div>
                    <div className="text-[11px] text-[#625D53] mt-0.5">{n.desc}</div>
                    <div className="text-[10px] text-[#8C877D] mt-1">{timeAgo(n.at)}</div>
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
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] transition"
          >
            <WorkerAvatar size={34} helmet="#234536" shirt="#234536" title="Profil" />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-extrabold text-[#252922] leading-tight">
                {user?.role === 'admin' ? 'Admin' : user?.role === 'cashier' ? 'Kasir' : 'Gudang'}
              </div>
              <div className="text-[10px] text-[#625D53] font-medium leading-none">
                {settings?.storeName || 'Toko'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#625D53]" />
          </button>

          {/* Profile & Role Switch Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-card shadow-modal border border-[#DEDCCF] p-3 z-50">
              <div className="pb-2.5 border-b border-[#DEDCCF]">
                <div className="text-xs font-extrabold text-[#252922]">{user?.name || '-'}</div>
                <div className="text-[11px] text-[#625D53]">
                  Masuk sebagai: <span className="font-bold uppercase text-[#234536]">{user?.role || 'admin'}</span>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                    navigate('/login');
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
      </div>
    </header>
  );
}
