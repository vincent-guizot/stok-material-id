import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  ShieldCheck,
  ShoppingCart,
  Package,
  LogIn,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const { login, quickDemoLogin, isLoading, error } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!username || !password) {
      setLocalError("Username dan password wajib diisi.");
      return;
    }
    const res = await login(username, password);
    if (!res.success) {
      setLocalError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Brand Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-500/25 mb-3 font-bold">
          🧱
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          StokMaterial<span className="text-blue-500">.id</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Sistem Kasir & Manajemen Stok Multi-Satuan Toko Bangunan
        </p>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">Masuk Aplikasi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Silakan masukkan akun Anda atau gunakan tombol cepat di bawah
          </p>
        </div>

        {(localError || error) && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
              Username Kasir / Admin:
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="admin / kasir / gudang"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-600 font-semibold text-sm focus:outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
              Password:
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-600 font-semibold text-sm focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? "Sedang Masuk..." : "MASUK SEKARANG"}</span>
          </button>
        </form>

        {/* 1-Click Quick Demo Login Section */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase text-center tracking-wider">
            Atau Masuk Cepat Sebagai:
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => quickDemoLogin("admin")}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Bos / Pemilik Toko (Admin)</span>
              </span>
              <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-black">
                Akses Penuh
              </span>
            </button>

            <button
              type="button"
              onClick={() => quickDemoLogin("cashier")}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Kasir Depan (Nova Philly)</span>
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                Kasir & Kasbon
              </span>
            </button>

            <button
              type="button"
              onClick={() => quickDemoLogin("warehouse")}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Staf Gudang (Novo Phillia)</span>
              </span>
              <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-black">
                Stok Masuk
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-xs text-slate-500 font-medium">
        StokMaterial.id &bull; Solusi POS Bahan Bangunan Indonesia
      </div>
    </div>
  );
}
