import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { motionTransition } from './motion/presets.js';
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  BookOpen,
  Package,
  BarChart3,
  Database,
  Truck,
  Settings,
  HelpCircle,
  CreditCard,
  X,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  setSubTab,
  user,
  cartCount = 0,
  isOpen = false,
  onClose,
}) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const drawerRef = useRef(null);
  useEffect(() => {
    if (!isOpen || window.innerWidth >= 1024) return;
    const previousFocus = document.activeElement;
    const drawer = drawerRef.current;
    const selector = 'button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]';
    drawer?.querySelector(selector)?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose?.(); }
      if (event.key !== 'Tab') return;
      const controls = [...(drawer?.querySelectorAll(selector) || [])];
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus?.(); };
  }, [isOpen, onClose]);
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\//, '').split('/')[0];
  const effectiveActiveTab = activeTab || (currentPath === '' ? 'pos' : currentPath);

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
      shortcut: 'F5',
      defaultSubTab: 'products',
    },
    {
      id: 'suppliers',
      label: 'Data Supplier',
      icon: Truck,
      shortcut: 'F6',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      shortcut: 'F7',
      defaultSubTab: 'general',
    },
  ];

  const handleSelectNav = (item) => {
    if (setActiveTab) {
      setActiveTab(item.id);
    }
    const targetPath = item.id === 'pos' ? '/pos' : `/${item.id}`;
    const targetSearch = item.defaultSubTab ? `?tab=${item.defaultSubTab}` : '';
    navigate(targetPath + targetSearch);
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
            if (setActiveTab) setActiveTab('pos');
            navigate('/pos');
            if (onClose) onClose();
          }}
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-[#234536] text-white shrink-0">
            <img
              src="/02_ikon-aplikasi-full-color.png"
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
        {navItems.filter((item) => user?.role === 'admin' || !['reports', 'settings'].includes(item.id)).map((item) => {
          const Icon = item.icon;
          const isActive =
            effectiveActiveTab === item.id ||
            (item.id === 'pos' && (effectiveActiveTab === '' || effectiveActiveTab === '/'));

          return (
            <motion.button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              whileHover={reduceMotion ? undefined : { x: 2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={motionTransition}
              onClick={() => handleSelectNav(item)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold transition-colors ${
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
            </motion.button>
          );
        })}

        {/* Dedicated Checkout indicator when in checkout mode */}
        {effectiveActiveTab === 'checkout' && (
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('checkout');
              navigate('/checkout');
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold bg-[#234536] text-white shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CreditCard className="w-4 h-4 shrink-0 text-white" />
              <span>Pembayaran</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-white/20 text-white">
              F10
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
              if (setActiveTab) setActiveTab('help');
              navigate('/help');
              if (onClose) onClose();
            }}
            className={`w-full py-1.5 px-3 rounded-control text-xs font-bold border transition flex items-center justify-between gap-1.5 ${
              effectiveActiveTab === 'help'
                ? 'bg-[#234536] text-white border-[#234536]'
                : 'bg-white text-[#252922] border-[#DEDCCF] hover:bg-[#F7F4ED]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Pusat Bantuan</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                effectiveActiveTab === 'help'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F7F4ED] text-[#8C877D] border border-[#DEDCCF]'
              }`}
            >
              F8
            </span>
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

      {/* Keep the drawer mounted until its exit transition completes. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div key="mobile-navigation" className="fixed inset-0 z-50 lg:hidden flex"
            initial="closed" animate="open" exit="closed">
            <motion.button
              type="button" aria-label="Tutup menu navigasi"
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={onClose}
              variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
              transition={motionTransition}
            />
            <motion.div
              ref={drawerRef} role="dialog" aria-modal="true" aria-label="Menu navigasi"
              className="relative w-64 max-w-[80vw] h-full bg-white shadow-2xl z-10"
              variants={{ closed: { x: reduceMotion ? 0 : '-100%', opacity: 0 }, open: { x: 0, opacity: 1 } }}
              transition={motionTransition}
            >
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
