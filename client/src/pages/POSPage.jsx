import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { useCartStore } from '../store/useCartStore.js';
import { formatRupiah } from '../utils/formatters.js';
import CreditHealthBar from '../components/CreditHealthBar.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import PrintReceiptModal from '../components/PrintReceiptModal.jsx';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  FileText,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [printedTransaction, setPrintedTransaction] = useState(null);

  const {
    items,
    selectedCustomer,
    discount,
    notes,
    addItem,
    updateQty,
    removeItem,
    switchUnit,
    setCustomer,
    setDiscount,
    setNotes,
    clearCart,
    getTotal,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  // Fetch Kategori
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // Fetch Produk Material
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory],
    queryFn: async () => {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;
      const res = await api.get('/products', { params });
      return res.data.data;
    },
  });

  // Fetch Pelanggan / Mandor
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    },
  });

  // Keyboard shortcut F2 untuk bayar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' && items.length > 0) {
        e.preventDefault();
        setIsPaymentOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  const total = getTotal();
  const subtotal = getSubtotal();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      
      {/* ============================================================ */}
      {/* PANEL KIRI: KATALOG PRODUK & SELECTOR SATUAN INSTAN         */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200">
        
        {/* Search Bar & Header */}
        <div className="p-3 bg-white border-b border-slate-200 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik nama semen, besi, cat, bata, atau paku... [F4]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-blue-500 focus:bg-white text-sm font-semibold transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Category Chips / Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🏢</span>
              <span>Semua Material</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isProductsLoading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 font-bold">
              Memuat katalog material...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <span className="text-4xl mb-2">🔍</span>
              <p className="font-bold">Barang material tidak ditemukan</p>
              <p className="text-xs">Coba cari dengan kata kunci lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Category Icon & SKU */}
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-500 flex items-center gap-1">
                        <span>{prod.category?.icon || '📦'}</span>
                        <span>{prod.category?.name || 'Material'}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                        {prod.sku}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                      {prod.name}
                    </h3>

                    {/* Real Stock Status */}
                    <div className="mt-1 flex items-center gap-1 text-[11px]">
                      <span className="text-slate-500 font-medium">Stok:</span>
                      <span
                        className={`font-bold ${
                          prod.isLowStock ? 'text-red-600' : 'text-slate-800'
                        }`}
                      >
                        {prod.humanReadableStock}
                      </span>
                      {prod.isLowStock && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold">
                          Menipis!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* INSTANT ONE-CLICK UNIT BUTTONS */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Klik Satuan untuk Tambah:
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {prod.units?.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => addItem(prod, u)}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200/70 text-blue-900 font-bold text-xs flex items-center justify-between transition group"
                        >
                          <span className="flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5 text-blue-500 group-hover:text-white" />
                            <span>{u.unitName}</span>
                          </span>
                          <span className="font-black">{formatRupiah(u.sellPrice)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ============================================================ */}
      {/* PANEL KANAN: DAFTAR NOTA BELANJA & KASBON (ACTIVE CART)      */}
      {/* ============================================================ */}
      <div className="w-full md:w-[420px] lg:w-[460px] bg-white h-full flex flex-col border-t md:border-t-0 border-slate-200 shadow-xl shrink-0">
        
        {/* Cart Top: Customer Selector & Reset */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span>DAFTAR NOTA BELANJA</span>
              <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full ml-1">
                {getItemCount()}
              </span>
            </span>

            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Batal Semua</span>
              </button>
            )}
          </div>

          {/* Customer Dropdown */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Nama Pembeli / Mandor Proyek:
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const cId = e.target.value;
                const found = customers.find((c) => c.id === cId);
                setCustomer(found || null);
              }}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 bg-white font-bold text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="">👤 Pembeli Umum (Non-Langganan)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} {c.currentDebt > 0 ? `(Bon: ${formatRupiah(c.currentDebt)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Credit Health Bar (Muncul otomatis jika Mandor dipilih) */}
          {selectedCustomer && (
            <CreditHealthBar customer={selectedCustomer} />
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <span className="text-4xl mb-1">🛒</span>
              <p className="font-bold text-sm">Nota Belanja Masih Kosong</p>
              <p className="text-xs text-slate-400">
                Pilih satuan material di panel kiri untuk memulai
              </p>
            </div>
          ) : (
            items.map((it) => (
              <div
                key={`${it.productId}-${it.unitId}`}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-slate-900 text-xs sm:text-sm truncate">
                      {it.productName}
                    </div>
                    {/* Unit Switcher inside Cart */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <select
                        value={it.unitId}
                        onChange={(e) => {
                          const targetUnit = it.availableUnits.find(
                            (u) => u.id === e.target.value
                          );
                          if (targetUnit) switchUnit(it.productId, it.unitId, targetUnit);
                        }}
                        className="text-[11px] font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-blue-700"
                      >
                        {it.availableUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unitName} (@{formatRupiah(u.sellPrice)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(it.productId, it.unitId)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Qty Stepper and Subtotal */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(it.productId, it.unitId, it.qty - 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center transition active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={(e) => updateQty(it.productId, it.unitId, e.target.value)}
                      className="w-12 h-8 text-center font-black text-sm bg-white border border-slate-300 rounded-lg"
                    />
                    <button
                      onClick={() => updateQty(it.productId, it.unitId, it.qty + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-sm text-slate-900">
                      {formatRupiah(it.subtotal)}
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Cart Bottom: Calculation & Big Action Buttons */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal Barang:</span>
              <span className="font-bold">{formatRupiah(subtotal)}</span>
            </div>

            {/* Diskon Input */}
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Potongan Diskon:</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-bold">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 px-2 py-0.5 rounded border border-slate-300 text-right font-bold text-xs"
                />
              </div>
            </div>

            {/* GRAND TOTAL BESAR */}
            <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-300">
              <span className="text-sm font-black text-slate-800 uppercase">TOTAL NOTA:</span>
              <span className="text-2xl font-black text-blue-700 tracking-tight">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          {/* CHUNKY ACTION BUTTONS (BESAR & TOUCH-FRIENDLY) */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              disabled={items.length === 0}
              onClick={() => setIsPaymentOpen(true)}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-6 h-6" />
              <span>⚡ BAYAR NOTA KASIR (F2)</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODAL PEMBAYARAN */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={(completedTx) => {
          setPrintedTransaction(completedTx);
        }}
      />

      {/* MODAL CETAK STRUK & FAKTUR */}
      {printedTransaction && (
        <PrintReceiptModal
          transaction={printedTransaction}
          onClose={() => setPrintedTransaction(null)}
        />
      )}

    </div>
  );
}
