import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  LogIn,
  AlertCircle,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, quickDemoLogin, isLoading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!username || !password) {
      setLocalError('Username dan password wajib diisi.');
      return;
    }
    const res = await login(username, password);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setLocalError(res.message);
    }
  };

  const handleDemoLogin = async (roleKey) => {
    const res = await quickDemoLogin(roleKey);
    if (res.success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#234536] rounded-2xl mx-auto flex items-center justify-center text-white text-3xl shadow-card mb-3 overflow-hidden">
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
        <h1 className="text-2xl sm:text-3xl font-black text-[#252922] tracking-tight">
          StokMaterial<span className="text-[#234536]">.id</span>
        </h1>
        <p className="text-xs text-[#625D53] mt-1 font-medium">
          Sistem Kasir & Manajemen Stok Multi-Satuan Toko Bangunan
        </p>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-card shadow-modal border border-[#DEDCCF] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-[#252922]">Masuk Aplikasi</h2>
          <p className="text-xs text-[#625D53] mt-0.5">
            Silakan masukkan akun Anda atau gunakan tombol masuk cepat demo di bawah.
          </p>
        </div>

        {(localError || error) && (
          <div className="p-3 bg-red-50 text-[#C62828] text-xs font-bold rounded-control border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#252922] uppercase block mb-1">
              Username Kasir / Admin:
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="admin / kasir / gudang"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-control border border-[#DEDCCF] bg-[#F7F4ED] focus:bg-white focus:border-[#234536] font-semibold text-xs focus:outline-none transition text-[#252922]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#252922] uppercase block mb-1">
              Password:
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-control border border-[#DEDCCF] bg-[#F7F4ED] focus:bg-white focus:border-[#234536] font-semibold text-xs focus:outline-none transition text-[#252922]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-control bg-[#234536] hover:bg-[#1c372b] active:scale-[0.99] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Sedang Masuk...' : 'MASUK SEKARANG'}</span>
          </button>
        </form>

        {/* Quick Demo Login Switcher */}
        <div className="pt-4 border-t border-[#DEDCCF] space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C877D] text-center">
            Pilihan Demo Akses Cepat (1-Klik Masuk)
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="p-2.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] text-center transition flex flex-col items-center justify-center gap-1 group"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#234536] flex items-center justify-center text-xs font-bold">
                👑
              </div>
              <div className="font-extrabold text-[11px] text-[#252922]">Bos / Admin</div>
              <div className="text-[9px] text-[#8C877D]">Full Akses</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('cashier')}
              className="p-2.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] text-center transition flex flex-col items-center justify-center gap-1 group"
            >
              <div className="w-7 h-7 rounded-full bg-amber-100 text-[#D97706] flex items-center justify-center text-xs font-bold">
                🛒
              </div>
              <div className="font-extrabold text-[11px] text-[#252922]">Kasir Toko</div>
              <div className="text-[9px] text-[#8C877D]">POS & Nota</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('warehouse')}
              className="p-2.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] text-center transition flex flex-col items-center justify-center gap-1 group"
            >
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                📦
              </div>
              <div className="font-extrabold text-[11px] text-[#252922]">Staf Gudang</div>
              <div className="text-[9px] text-[#8C877D]">Stok & Masuk</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-[#8C877D] mt-6">
        © 2026 StokMaterial.id. Desain sistem POS & Depo Bahan Bangunan.
      </div>
    </div>
  );
}
