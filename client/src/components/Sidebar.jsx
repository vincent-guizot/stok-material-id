import { useAuthStore } from '../store/useAuthStore.js';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ChevronDown,
  X,
} from 'lucide-react';
import WorkerAvatar from './WorkerAvatar.jsx';

// Menu & submenu mengikuti mockup. Submenu memakai parameter ?tab= yang sudah dipakai tiap halaman.
const NAV = [
  { id: 'pos', label: 'Kasir Penjualan', icon: ShoppingCart, shortcut: 'F1', path: '/pos' },
  { id: 'debts', label: 'Buku Kasbon Mandor', icon: BookOpen, shortcut: 'F2', path: '/debts' },
  {
    id: 'inventory',
    label: 'Stok & Barang Masuk',
    icon: Package,
    shortcut: 'F3',
    path: '/inventory',
    defaultTab: 'stock-list',
    sub: [
      ['stock-list', 'Data Stok'],
      ['stock-in', 'Barang Masuk'],
      ['stock-out', 'Barang Keluar'],
      ['stock-mutation', 'Mutasi Stok'],
      ['stock-adjust', 'Penyesuaian Stok'],
      ['stock-opname', 'Opname Stok'],
    ],
  },
  {
    id: 'reports',
    adminOnly: true,
    label: 'Laporan Keuangan',
    icon: BarChart3,
    shortcut: 'F4',
    path: '/reports',
    defaultTab: 'summary',
    sub: [
      ['summary', 'Ringkasan'],
      ['sales', 'Penjualan'],
      ['purchases', 'Pembelian'],
      ['debts-report', 'Piutang Mandor'],
      ['stocks-report', 'Stok Barang'],
      ['profit-loss', 'Laba Rugi'],
      ['cash-flow', 'Arus Kas'],
    ],
  },
  {
    id: 'master',
    label: 'Master Data',
    icon: Database,
    path: '/master',
    defaultTab: 'products',
    sub: [
      ['products', 'Data Produk'],
      ['categories', 'Kategori'],
      ['brands', 'Merek'],
      ['units', 'Satuan & Konversi'],
      ['wholesale', 'Harga Grosir'],
      ['customers', 'Pelanggan'],
      ['suppliers', 'Supplier'],
    ],
  },
  { id: 'mandor', label: 'Data Mandor', icon: Users, path: '/master?tab=customers' },
  { id: 'suppliers', label: 'Data Supplier', icon: Truck, path: '/suppliers' },
  {
    id: 'settings',
    label: 'Pengaturan',
    icon: Settings,
    path: '/settings',
    defaultTab: 'general',
    sub: [
      ['general', 'Umum'],
      ['users', 'Pengguna'],
      ['branches', 'Cabang'],
      ['receipt', 'Printer & Nota'],
      ['backup', 'Backup Data'],
      ['security', 'Keamanan'],
      ['other', 'Lainnya'],
    ],
  },
];

const HELP_SUB = [
  ['help-panduan', 'Panduan Penggunaan'],
  ['help-video', 'Video Tutorial'],
  ['help-faq', 'Pertanyaan Umum'],
  ['help-kontak', 'Hubungi Kami'],
  ['help-tentang', 'Tentang Aplikasi'],
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  setSubTab,
  cartCount = 0,
  isOpen = false,
  onClose,
}) {
  const navigate = useNavigate();
  const role = useAuthStore((st) => st.user?.role);
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\//, '').split('/')[0];
  const current = activeTab || (currentPath === '' ? 'pos' : currentPath);
  const tabParam = new URLSearchParams(location.search).get('tab');

  const go = (path, tabId) => {
    if (setActiveTab && tabId) setActiveTab(tabId);
    navigate(path);
    if (onClose) onClose();
  };

  const goItem = (item) => {
    if (setActiveTab) setActiveTab(item.id === 'mandor' ? 'master' : item.id);
    const target = item.defaultTab ? `${item.path}?tab=${item.defaultTab}` : item.path;
    if (item.defaultTab && setSubTab) setSubTab(item.defaultTab);
    navigate(target);
    if (onClose) onClose();
  };

  const goSub = (item, tabId) => {
    if (setActiveTab) setActiveTab(item.id);
    if (setSubTab) setSubTab(tabId);
    navigate(`${item.path}?tab=${tabId}`);
    if (onClose) onClose();
  };

  const isItemActive = (item) => {
    if (item.id === 'mandor') return current === 'master' && tabParam === 'customers';
    if (item.id === 'master') return current === 'master' && tabParam !== 'customers';
    return current === item.id || (item.id === 'pos' && current === '');
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (onClose) onClose();
  };

  const rowBase =
    'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-control text-[13px] font-semibold transition-colors';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {onClose && (
        <div className="lg:hidden flex justify-end p-2">
          <button onClick={onClose} aria-label="Tutup menu" className="p-1.5 rounded-control text-[#8C877D] hover:bg-[#F7F4ED]">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto" aria-label="Navigasi utama">
        {NAV.filter((item) => !item.adminOnly || role === 'admin').map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          const badge = item.id === 'pos' && cartCount > 0 ? cartCount : null;
          return (
            <div key={item.id}>
              <button
                onClick={() => goItem(item)}
                aria-current={active ? 'page' : undefined}
                className={`${rowBase} ${
                  active ? 'bg-[#234536] text-white shadow-sm' : 'text-[#252922] hover:bg-[#F7F4ED] hover:text-[#234536]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0 text-left">
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-[#625D53]'}`} />
                  <span className="leading-tight">{item.label}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {badge && (
                    <span className="w-5 h-5 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                  {item.shortcut && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        active ? 'bg-white/20 text-white' : 'bg-[#F7F4ED] text-[#8C877D] border border-[#DEDCCF]'
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  )}
                  {item.sub && active && <ChevronDown className="w-3.5 h-3.5 text-white/80" />}
                </span>
              </button>

              {item.sub && active && (
                <ul className="mt-1 mb-1.5 ml-3 space-y-0.5 rounded-control bg-[#EAF0EC]/60 p-1.5">
                  {item.sub.map(([tabId, label]) => {
                    const subActive = (tabParam || item.defaultTab) === tabId;
                    return (
                      <li key={tabId}>
                        <button
                          onClick={() => goSub(item, tabId)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-[13px] text-left transition-colors ${
                            subActive ? 'bg-[#DDE9E3] text-[#234536] font-bold' : 'text-[#252922] hover:bg-white/70'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${subActive ? 'bg-[#234536]' : 'bg-[#8C877D]'}`} />
                          <span>{label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        {/* Pembayaran muncul saat di halaman checkout */}
        {current === 'checkout' && (
          <button onClick={() => go('/checkout', 'checkout')} className={`${rowBase} bg-[#234536] text-white shadow-sm`} aria-current="page">
            <span className="flex items-center gap-3">
              <CreditCard className="w-[18px] h-[18px]" />
              <span>Pembayaran</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white/20">F10</span>
          </button>
        )}

        {/* Pusat Bantuan: menu + submenu tampil saat di halaman bantuan */}
        {current === 'help' && (
          <div>
            <button onClick={() => go('/help', 'help')} aria-current="page" className={`${rowBase} bg-[#234536] text-white shadow-sm`}>
              <span className="flex items-center gap-3">
                <HelpCircle className="w-[18px] h-[18px]" />
                <span>Pusat Bantuan</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>
            <ul className="mt-1 ml-3 space-y-0.5 rounded-control bg-[#EAF0EC]/60 p-1.5">
              {HELP_SUB.map(([id, label], i) => (
                <li key={`${id}-${i}`}>
                  <button
                    onClick={() => scrollTo(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-[13px] text-left transition-colors ${
                      i === 0 ? 'bg-[#DDE9E3] text-[#234536] font-bold' : 'text-[#252922] hover:bg-white/70'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? 'bg-[#234536]' : 'bg-[#8C877D]'}`} />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Kartu bantuan */}
      <div className="p-3">
        <div className="rounded-card p-3 bg-[#F6EFE3] border border-[#DEDCCF]">
          <div className="flex items-center gap-2.5">
            <WorkerAvatar size={44} mustache title="Mandor bantuan" />
            <div className="min-w-0">
              <div className="text-[13px] font-extrabold text-[#234536]">Butuh Bantuan?</div>
              <div className="text-[11px] text-[#625D53] leading-snug">Hubungi admin jika ada kendala sistem.</div>
            </div>
          </div>
          <button
            onClick={() => go('/help', 'help')}
            className="mt-2.5 w-full py-2 px-3 rounded-control text-[13px] font-bold bg-white border border-[#DEDCCF] text-[#234536] hover:bg-[#F7F4ED] transition flex items-center justify-center gap-2"
          >
            <span className="w-5 h-5 rounded-full bg-[#234536] text-white flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
            <span>Pusat Bantuan</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[232px] bg-white border-r border-[#DEDCCF] flex-col shrink-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="relative w-64 max-w-[80vw] h-full bg-white shadow-2xl z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
