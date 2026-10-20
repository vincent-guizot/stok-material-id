import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import { Package, PlusCircle, SlidersHorizontal, Search, ArrowDownToLine, CheckCircle2, X } from 'lucide-react';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedProductForIn, setSelectedProductForIn] = useState(null);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);

  // States Barang Masuk
  const [inUnitId, setInUnitId] = useState('');
  const [inQty, setInQty] = useState('');
  const [inNotes, setInNotes] = useState('');
  const [inError, setInError] = useState(null);

  // States Opname / Koreksi
  const [actualQty, setActualQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState(null);

  // Fetch Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search } });
      return res.data.data;
    },
  });

  // Mutasi Barang Masuk
  const stockInMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/stocks/in', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProductForIn(null);
      setInQty('');
      setInNotes('');
    },
    onError: (err) => {
      setInError(err.response?.data?.message || 'Gagal mencatat barang masuk.');
    },
  });

  // Mutasi Opname
  const adjustMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/stocks/adjust', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProductForAdjust(null);
      setActualQty('');
      setAdjustReason('');
    },
    onError: (err) => {
      setAdjustError(err.response?.data?.message || 'Gagal menyesuaikan stok.');
    },
  });

  const handleStockInSubmit = (e) => {
    e.preventDefault();
    setInError(null);
    const qty = parseFloat(inQty);
    if (!qty || qty <= 0) {
      setInError('Jumlah barang masuk harus lebih dari 0.');
      return;
    }
    stockInMutation.mutate({
      productId: selectedProductForIn.id,
      unitId: inUnitId || selectedProductForIn.units?.[0]?.id,
      qty,
      notes: inNotes,
    });
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    setAdjustError(null);
    const qty = parseFloat(actualQty);
    if (isNaN(qty) || qty < 0) {
      setAdjustError('Jumlah fisik harus berupa angka positif atau nol.');
      return;
    }
    adjustMutation.mutate({
      productId: selectedProductForAdjust.id,
      actualBaseQty: qty,
      reason: adjustReason,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Manajemen Stok & Penerimaan Material</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Pantau stok dalam satuan dasar, konversi multi-satuan, dan catat penerimaan truk supplier
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama material / SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Material / Produk</th>
                <th className="p-4">Satuan Dasar</th>
                <th className="p-4">Stok Saat Ini (Konversi Satuan)</th>
                <th className="p-4">Pilihan Satuan Jual</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Aksi Gudang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                    Memuat data stok...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                    Material tidak ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-black text-slate-900">{prod.name}</div>
                      <div className="font-mono text-[10px] text-slate-400 font-bold">{prod.sku}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-xs">{prod.baseUnit}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900 text-sm">{prod.humanReadableStock}</div>
                      <div className="text-xs text-slate-400">Min. Peringatan: {prod.minStock} {prod.baseUnit}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {prod.units?.map((u) => (
                          <span
                            key={u.id}
                            className="px-2 py-0.5 rounded-lg text-xs bg-blue-50 border border-blue-200 font-bold text-blue-900"
                          >
                            {u.unitName} ({formatRupiah(u.sellPrice)})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {prod.isLowStock ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                          Stok Menipis
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedProductForIn(prod);
                            setInUnitId(prod.units?.[prod.units.length - 1]?.id || '');
                            setInError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Terima Masuk</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProductForAdjust(prod);
                            setActualQty(prod.currentStockBase.toString());
                            setAdjustError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Opname</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL TERIMA BARANG MASUK                                   */}
      {/* ============================================================ */}
      {selectedProductForIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Penerimaan Barang Masuk</h3>
                <p className="text-xs text-slate-500">{selectedProductForIn.name}</p>
              </div>
              <button
                onClick={() => setSelectedProductForIn(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="py-4 space-y-4">
              {inError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                  {inError}
                </div>
              )}

              {/* Pilih Satuan Masuk */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Satuan Kemasan yang Masuk:
                </label>
                <select
                  value={inUnitId}
                  onChange={(e) => setInUnitId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                >
                  {selectedProductForIn.units?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitName} (Isi {u.conversionFactor} {selectedProductForIn.baseUnit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Jumlah Satuan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jumlah Kuantitas Masuk:
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  min="0.1"
                  step="any"
                  placeholder="Contoh: 50"
                  value={inQty}
                  onChange={(e) => setInQty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 font-black text-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Nomor Surat Jalan Supplier / Catatan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor Surat Jalan Supplier / Truk Pengirim:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DO-SemenGresik-9876"
                  value={inNotes}
                  onChange={(e) => setInNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={stockInMutation.isPending}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition disabled:opacity-50"
                >
                  {stockInMutation.isPending ? 'Menyimpan...' : 'SIMPAN BARANG MASUK GUDANG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PENYESUAIAN STOK (OPNAME FISIK)                        */}
      {/* ============================================================ */}
      {selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Koreksi Stok Opname Fisik</h3>
                <p className="text-xs text-slate-500">{selectedProductForAdjust.name}</p>
              </div>
              <button
                onClick={() => setSelectedProductForAdjust(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="py-4 space-y-4">
              {adjustError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                  {adjustError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
                <span>Stok Sistem Saat Ini:</span>
                <span className="font-bold text-slate-900">
                  {selectedProductForAdjust.currentStockBase} {selectedProductForAdjust.baseUnit}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jumlah Fisik Riil Hasil Hitung Lapangan ({selectedProductForAdjust.baseUnit}):
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  min="0"
                  step="any"
                  value={actualQty}
                  onChange={(e) => setActualQty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 font-black text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alasan Penyesuaian (Opname):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Semen mengeras terkena air hujan / besi terpangkas"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition disabled:opacity-50"
                >
                  {adjustMutation.isPending ? 'Menyimpan...' : 'UPDATE STOK OPNAME'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
