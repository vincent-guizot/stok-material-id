import React from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { ShoppingCart, BookOpen, Package, BarChart3, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, quickDemoLogin } = useAuthStore();

  const roleBadge = {
    admin: { label: 'Admin (Bos)', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    cashier: { label: 'Kasir Toko', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    warehouse: { label: 'Staf Gudang', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  }[user?.role || 'cashier'];

  const navItems = [
    { id: 'pos', label: 'Kasir Penjualan', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { id: 'debts', label: 'Buku Kasbon Mandor', icon: BookOpen, roles: ['admin', 'cashier'] },
    { id: 'inventory', label: 'Stok & Barang Masuk', icon: Package, roles: ['admin', 'cashier', 'warehouse'] },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3, roles: ['admin'] },
  ];

  const visibleNavs = navItems.filter(item => item.roles.includes(user?.role || 'cashier'));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pos')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-md font-bold">
              🧱
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                StokMaterial<span className="text-blue-600">.id</span>
              </div>
              <div className="text-xs text-slate-500 font-medium hidden sm:block">
                Sistem Kasir & Stok Multi-Satuan Toko Bangunan
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            {visibleNavs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Demo Switcher */}
          <div className="flex items-center space-x-3">
            {/* Role Badge */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleBadge.bg}`}>
              <UserCheck className="w-3.5 h-3.5" />
              <span>{roleBadge.label}</span>
            </div>

            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
              <span className="px-1 text-slate-400">Ganti:</span>
              <button
                onClick={() => quickDemoLogin('admin')}
                className={`px-2 py-0.5 rounded ${user?.role === 'admin' ? 'bg-purple-600 text-white font-bold' : 'hover:bg-white'}`}
                title="Masuk sebagai Bos / Admin"
              >
                Bos
              </button>
              <button
                onClick={() => quickDemoLogin('cashier')}
                className={`px-2 py-0.5 rounded ${user?.role === 'cashier' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-white'}`}
                title="Masuk sebagai Kasir"
              >
                Kasir
              </button>
              <button
                onClick={() => quickDemoLogin('warehouse')}
                className={`px-2 py-0.5 rounded ${user?.role === 'warehouse' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-white'}`}
                title="Masuk sebagai Staf Gudang"
              >
                Gudang
              </button>
            </div>

            {/* User Name & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800 leading-none">{user?.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">@{user?.username}</div>
              </div>
              <button
                onClick={logout}
                title="Keluar Akun"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
