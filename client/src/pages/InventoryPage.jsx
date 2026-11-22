import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import MaterialImage from '../components/MaterialImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
import StockInTab from './inventory/StockInTab.jsx';
import StockOutTab from './inventory/StockOutTab.jsx';
import MutationTab from './inventory/MutationTab.jsx';
import AdjustTab from './inventory/AdjustTab.jsx';
import OpnameTab from './inventory/OpnameTab.jsx';
import { useMovements } from './inventory/useMovements.js';
import { EmptyState } from '../components/ui/common.jsx';
import { fmtDateTime, fmtNum } from '../components/ui/helpers.js';
import { exportToCsv } from '../utils/exportCsv.js';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  Plus,
  Download,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  ArrowDownLeft,
} from 'lucide-react';

export default function InventoryPage({ subTab, setSubTab }) {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [localTab, setLocalTab] = useState(urlTab || subTab || 'stock-list');
  const activeTabKey = urlTab || subTab || localTab;

  const handleTabChange = (tabId) => {
    setLocalTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
    if (setSubTab) setSubTab(tabId);
  };

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Notifikasi (toast)
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const [sortOrder, setSortOrder] = useState('name-asc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerTab, setDrawerTab] = useState('summary'); // 'summary' | 'mutations' | 'pricing' | 'edit'
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  // Pengisian cepat dari header / panel produk: membuka form di tab terkait
  const [stockInPrefill, setStockInPrefill] = useState(null);
  const [adjustPrefill, setAdjustPrefill] = useState(null);


  // 1. Fetch Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search } });
      return res.data.data;
    },
  });

  // 2. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });



  // Stat produk
  const totalProductsCount = products.length;
  const lowStockCount = products.filter((p) => p.isLowStock && p.currentStockBase > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStockBase <= 0).length;
  const totalStockValue = products.reduce((acc, p) => {
    // Nilai stok = stok (satuan dasar) x harga modal per satuan dasar (harga modal satuan / faktor konversi)
    const base = (p.units || []).find((u) => Number(u.conversionFactor) === 1) || p.units?.[0];
    const costPerBase = base ? (parseFloat(base.buyPrice) || 0) / (Number(base.conversionFactor) || 1) : 0;
    return acc + Math.max(0, p.currentStockBase) * costPerBase;
  }, 0);


  // Mutation Update Product
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return api.put(`/products/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProduct(null);
      showToast('success', 'Data produk material berhasil diperbarui secara permanen!');
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Gagal memperbarui produk.');
    },
  });

  // Mutation Delete Product
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteConfirmProduct(null);
      showToast('success', 'Produk material berhasil dihapus.');
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus produk.');
      setDeleteConfirmProduct(null);
    },
  });


  // Filtered products list
  const filteredProducts = products
    .filter((p) => {
      if (categoryFilter !== 'all' && String(p.categoryId) !== String(categoryFilter)) {
        return false;
      }
      if (statusFilter === 'safe' && (p.isLowStock || p.currentStockBase <= 0)) {
        return false;
      }
      if (statusFilter === 'low' && (!p.isLowStock || p.currentStockBase <= 0)) {
        return false;
      }
      if (statusFilter === 'empty' && p.currentStockBase > 0) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      if (sortOrder === 'stock-low') return a.currentStockBase - b.currentStockBase;
      if (sortOrder === 'stock-high') return b.currentStockBase - a.currentStockBase;
      return 0;
    });

  // Sub-tab navigation tabs matching user request
  const subTabsList = [
    { id: 'stock-list', label: 'Data Stok' },
    { id: 'stock-in', label: 'Barang Masuk' },
    { id: 'stock-out', label: 'Barang Keluar' },
    { id: 'stock-mutation', label: 'Mutasi Stok' },
    { id: 'stock-adjust', label: 'Penyesuaian Stok' },
    { id: 'stock-opname', label: 'Opname Stok' },
  ];

  const handleOpenStockIn = (product) => {
    setStockInPrefill(product || true);
    handleTabChange('stock-in');
  };

  const handleOpenAdjust = (product) => {
    setAdjustPrefill(product);
    handleTabChange('stock-adjust');
  };

  const handleConfirmDeleteProduct = () => {
    if (!deleteConfirmProduct) return;
    deleteProductMutation.mutate(deleteConfirmProduct.id);
    if (selectedProduct?.id === deleteConfirmProduct.id) {
      setSelectedProduct(null);
    }
  };


  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Stok & Barang Masuk
            </h1>
            <p className="text-xs text-[#625D53]">
              Kelola data material, pantau stok, lakukan barang masuk/keluar, dan atur harga.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              exportToCsv(
                'stok-material',
                ['SKU', 'Nama Material', 'Kategori', 'Satuan Dasar', 'Stok Riil', 'Min Stok', 'Harga Beli', 'Harga Jual'],
                products.map((p) => [
                  p.sku,
                  p.name,
                  p.category?.name || '-',
                  p.baseUnit,
                  p.currentStockBase ?? p.stock ?? 0,
                  p.minStock ?? 0,
                  p.units?.[0]?.buyPrice ?? 0,
                  p.units?.[0]?.sellPrice ?? 0,
                ])
              );
              showToast('success', 'Data stok material berhasil diekspor ke format Excel (CSV)!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#234536]" />
            <span>Export Data</span>
          </button>

          <button
            onClick={() => handleOpenStockIn(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Barang Masuk (PO)</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards - Responsive Grid without horizontal overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={Package}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Produk"
          value={`${totalProductsCount} Item`}
          subtitle={`${products.filter((p) => p.isActive !== false).length} Aktif • ${products.filter((p) => p.isActive === false).length} Non-aktif`}
        />

        <StatCard
          icon={Boxes}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Total Nilai Stok"
          value={formatRupiah(totalStockValue)}
          subtitle="Berdasarkan harga modal"
        />

        <StatCard
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Stok Menipis"
          value={`${lowStockCount} Item`}
          subtitle="Perlu segera restock"
        />

        <StatCard
          icon={XCircle}
          iconBg="bg-rose-50 text-[#C62828]"
          title="Stok Habis"
          value={`${outOfStockCount} Item`}
          subtitle="Tidak tersedia"
        />
      </div>

      {/* Subtabs Bar - Fully Interactive */}
      <div className="flex border-b border-[#DEDCCF] gap-2 overflow-x-auto pb-1">
        {subTabsList.map((tab) => {
          const isActive = activeTabKey === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-4 rounded-t-lg font-bold text-xs whitespace-nowrap transition border-b-2 ${
                isActive
                  ? 'border-[#234536] text-[#234536] bg-white shadow-2xs font-extrabold'
                  : 'border-transparent text-[#625D53] hover:text-[#252922] hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DATA STOK (Default)                              */}
      {/* ======================================================== */}
      {activeTabKey === 'stock-list' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-card border border-[#DEDCCF] shadow-card flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari barang, merek, atau kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold text-[#252922] focus:outline-none focus:border-[#234536] focus:bg-white transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
              >
                <option value="all">Semua Status</option>
                <option value="safe">Stok Aman</option>
                <option value="low">Stok Menipis</option>
                <option value="empty">Stok Habis</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
              >
                <option value="name-asc">Urutkan: Nama A-Z</option>
                <option value="name-desc">Urutkan: Nama Z-A</option>
                <option value="stock-low">Stok: Sedikit ke Banyak</option>
                <option value="stock-high">Stok: Banyak ke Sedikit</option>
              </select>

              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setSortOrder('name-asc');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#625D53] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>

          {/* Main Table Layout - Full width without squeezing */}
          <div className="w-full bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                  <tr>
                    <th className="py-3 px-3 w-8">
                      <input type="checkbox" className="rounded text-[#234536]" />
                    </th>
                    <th className="py-3 px-3">PRODUK</th>
                    <th className="py-3 px-3">KATEGORI</th>
                    <th className="py-3 px-3 text-center">STOK</th>
                    <th className="py-3 px-3 text-center">SATUAN</th>
                    <th className="py-3 px-3 text-right">HARGA BELI</th>
                    <th className="py-3 px-3 text-right">HARGA JUAL</th>
                    <th className="py-3 px-3 text-center">STATUS</th>
                    <th className="py-3 px-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEDCCF]/70">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs font-bold text-[#625D53]">
                        Memuat daftar inventaris material...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-[#8C877D]">
                        Tidak ada barang material yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProduct?.id === p.id;
                      const primaryUnit = p.units?.[p.units.length - 1] || p.units?.[0] || {};
                      const isOutOfStock = p.currentStockBase <= 0;
                      const isLow = p.isLowStock;

                      const statusType = isOutOfStock
                        ? 'habis'
                        : isLow
                        ? 'menipis'
                        : 'aman';

                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setDrawerTab('summary');
                          }}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-emerald-50/60' : 'hover:bg-[#F7F4ED]/50'
                          }`}
                        >
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded text-[#234536]" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <MaterialImage name={p.name} sku={p.sku} className="w-9 h-9 shrink-0" />
                              <div>
                                <div className="font-extrabold text-xs text-[#252922]">{p.name}</div>
                                <div className="text-[10px] text-[#8C877D] font-mono">{p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#625D53]">
                            {p.category?.name || 'Material Bangunan'}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-sm">
                            <span
                              className={
                                isOutOfStock
                                  ? 'text-[#C62828]'
                                  : isLow
                                  ? 'text-[#D97706]'
                                  : 'text-[#16845B]'
                              }
                            >
                              {p.currentStockBase.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-[#252922]">
                            {primaryUnit.unitName || p.baseUnit}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-[#625D53]">
                            {formatRupiah(primaryUnit.buyPrice || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-[#252922]">
                            {formatRupiah(primaryUnit.sellPrice || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <StatusBadge status={statusType} />
                          </td>
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setDrawerTab('edit');
                                }}
                                className="p-1.5 hover:bg-slate-200 rounded text-[#234536] transition"
                                title="Edit / Ubah Data (Buka Drawer)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmProduct(p)}
                                className="p-1.5 hover:bg-red-50 text-[#C62828] rounded transition"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination bar */}
            <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED]/50 flex items-center justify-between text-xs text-[#625D53]">
              <div>
                Tampilkan <span className="font-bold">10</span> dari{' '}
                <span className="font-bold">{filteredProducts.length}</span> produk
              </div>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&lt;</button>
                <button className="px-2.5 py-1 rounded bg-[#234536] text-white font-bold">1</button>
                <button className="px-2.5 py-1 rounded border border-[#DEDCCF] bg-white font-bold">2</button>
                <button className="px-2.5 py-1 rounded border border-[#DEDCCF] bg-white font-bold">3</button>
                <button className="px-2.5 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&gt;</button>
              </div>
            </div>
          </div>
        </>
      )}


      {activeTabKey === 'stock-in' && (
        <StockInTab products={products} onToast={showToast} prefill={stockInPrefill} onPrefillUsed={() => setStockInPrefill(null)} />
      )}
      {activeTabKey === 'stock-out' && <StockOutTab products={products} onToast={showToast} />}
      {activeTabKey === 'stock-mutation' && <MutationTab products={products} onToast={showToast} />}
      {activeTabKey === 'stock-adjust' && (
        <AdjustTab products={products} onToast={showToast} prefill={adjustPrefill} onPrefillUsed={() => setAdjustPrefill(null)} />
      )}
      {activeTabKey === 'stock-opname' && <OpnameTab products={products} onToast={showToast} />}


      {/* Modal: Konfirmasi Hapus Produk */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DEDCCF]">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#C62828] flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#252922]">Hapus Produk Material?</h3>
                <p className="text-xs text-[#625D53]">Tindakan ini akan menghapus data dari sistem inventaris.</p>
              </div>
            </div>

            <div className="text-xs text-[#252922] bg-[#F7F4ED] p-3 rounded-control border border-[#DEDCCF] space-y-1">
              <div>Apakah Anda yakin ingin menghapus material:</div>
              <div className="font-extrabold text-sm text-[#234536]">{deleteConfirmProduct.name}</div>
              <div className="text-[#625D53]">SKU: {deleteConfirmProduct.sku} | Kategori: {deleteConfirmProduct.categoryName || 'Material'}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED] text-xs text-[#252922]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="px-5 py-2 rounded-control bg-[#C62828] hover:bg-[#b02222] text-white font-extrabold text-xs shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Material</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Right Drawer for Selected Product */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-[#252922]/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#DEDCCF] pointer-events-auto flex flex-col h-full animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#DEDCCF] flex items-center justify-between bg-[#F7F4ED]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-control border border-[#DEDCCF] overflow-hidden bg-white flex items-center justify-center">
                    <MaterialImage
                      src={selectedProduct.imageUrl}
                      categoryName={selectedProduct.category?.name}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      iconClassName="w-5 h-5 text-[#8C877D]"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#252922] line-clamp-1">{selectedProduct.name}</h3>
                    <p className="text-[11px] font-mono text-[#8C877D]">SKU: {selectedProduct.sku}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 text-[#8C877D] hover:text-[#252922] hover:bg-stone-200 rounded-control transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-[#DEDCCF] px-4 bg-white text-xs">
                {[
                  { id: 'summary', label: 'Ringkasan' },
                  { id: 'mutations', label: 'Mutasi' },
                  { id: 'pricing', label: 'Tingkat Harga' },
                  { id: 'edit', label: 'Edit Info' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    className={`py-3 px-3 font-bold border-b-2 transition ${
                      drawerTab === tab.id
                        ? 'border-[#234536] text-[#234536]'
                        : 'border-transparent text-[#625D53] hover:text-[#252922]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {drawerTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-[#F7F4ED] rounded-card border border-[#DEDCCF] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[#625D53] font-bold">Total Stok Saat Ini</span>
                        <StatusBadge
                          status={
                            selectedProduct.currentStockBase <= 0
                              ? 'danger'
                              : selectedProduct.isLowStock
                              ? 'warning'
                              : 'success'
                          }
                          label={
                            selectedProduct.currentStockBase <= 0
                              ? 'Habis'
                              : selectedProduct.isLowStock
                              ? 'Menipis'
                              : 'Aman'
                          }
                        />
                      </div>
                      <div className="text-2xl font-black text-[#234536]">
                        {selectedProduct.humanReadableStock || `${selectedProduct.currentStockBase} ${selectedProduct.baseUnit}`}
                      </div>
                      <div className="text-[11px] text-[#8C877D]">
                        Batas Min. Stok: <span className="font-bold text-[#252922]">{selectedProduct.minStock ?? 0} {selectedProduct.baseUnit}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[#252922]">Informasi Produk</h4>
                      <div className="bg-white border border-[#DEDCCF] rounded-card divide-y divide-[#DEDCCF]">
                        <div className="p-2.5 flex justify-between">
                          <span className="text-[#625D53]">Kategori</span>
                          <span className="font-bold text-[#252922]">{selectedProduct.category?.name || '-'}</span>
                        </div>
                        <div className="p-2.5 flex justify-between">
                          <span className="text-[#625D53]">Satuan Dasar</span>
                          <span className="font-bold text-[#252922]">{selectedProduct.baseUnit}</span>
                        </div>
                        <div className="p-2.5 flex justify-between">
                          <span className="text-[#625D53]">Harga Beli Pokok</span>
                          <span className="font-bold text-[#252922]">
                            {formatRupiah(selectedProduct.units?.[0]?.buyPrice || 0)}
                          </span>
                        </div>
                        <div className="p-2.5 flex justify-between">
                          <span className="text-[#625D53]">Harga Jual Retail</span>
                          <span className="font-bold text-[#16845B]">
                            {formatRupiah(selectedProduct.units?.[0]?.sellPrice || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="font-extrabold text-[#252922]">Aksi Cepat Material</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenStockIn(selectedProduct)}
                          className="flex items-center justify-center gap-1.5 p-2.5 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control font-bold"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                          <span>Barang Masuk</span>
                        </button>
                        <button
                          onClick={() => handleOpenAdjust(selectedProduct)}
                          className="flex items-center justify-center gap-1.5 p-2.5 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] text-[#252922] rounded-control font-bold"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Opname / Koreksi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'mutations' && <ProductMovements productId={selectedProduct.id} baseUnit={selectedProduct.baseUnit} />}

                {drawerTab === 'pricing' && <ProductPricing product={selectedProduct} />}

                {drawerTab === 'edit' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target;
                      const name = form.elements.name.value;
                      const sku = form.elements.sku.value;
                      const baseUnit = form.elements.baseUnit.value;
                      const minStock = form.elements.minStock.value;
                      const location = form.elements.location.value;
                      updateProductMutation.mutate({
                        id: selectedProduct.id,
                        payload: {
                          name,
                          sku,
                          baseUnit,
                          minStock: parseFloat(minStock) || 0,
                          location,
                        },
                      });
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="font-bold text-[#252922] block mb-1">Nama Material *</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={selectedProduct.name}
                        required
                        className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-[#252922] block mb-1">SKU *</label>
                        <input
                          type="text"
                          name="sku"
                          defaultValue={selectedProduct.sku}
                          required
                          className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#252922] block mb-1">Satuan Dasar</label>
                        <input
                          type="text"
                          name="baseUnit"
                          defaultValue={selectedProduct.baseUnit}
                          className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-[#252922] block mb-1">Minimum Stok Pengingat</label>
                      <input
                        type="number"
                        name="minStock"
                        defaultValue={selectedProduct.minStock ?? 0}
                        className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#252922] block mb-1">Lokasi Simpan (Gudang / Rak)</label>
                      <input
                        type="text"
                        name="location"
                        defaultValue={selectedProduct.location || ''}
                        placeholder="Contoh: Gudang Utama - Rak A1"
                        className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:outline-none focus:border-[#234536]"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control font-extrabold text-xs shadow-xs"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#DEDCCF] bg-[#F7F4ED] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmProduct(selectedProduct);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#C62828] hover:bg-red-50 p-2 rounded-control transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Material</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 bg-white border border-[#DEDCCF] text-xs font-bold text-[#252922] rounded-control hover:bg-[#ECEAE2]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Global Toast Feedback & Import Input */}
      <Toast toast={toast} onClose={() => setToast({ show: false, type: 'info', message: '' })} />
    </div>
  );
}

const MOVE_STYLE = {
  SALE: ['Penjualan', 'text-[#C62828]'], OUT: ['Barang keluar', 'text-[#C62828]'], IN: ['Barang masuk', 'text-[#16845B]'],
  ADJUSTMENT: ['Penyesuaian', 'text-blue-700'], OPNAME: ['Opname', 'text-blue-700'], TRANSFER: ['Mutasi lokasi', 'text-[#625D53]'], RETURN: ['Retur', 'text-[#16845B]'],
};

function ProductMovements({ productId, baseUnit }) {
  const q = useMovements(undefined, { productId, limit: 30 });
  if (q.isLoading) return <p className="text-[#8C877D] font-semibold">Memuat riwayat...</p>;
  if (q.isError) return <p className="text-rose-600 font-semibold">Gagal memuat riwayat stok.</p>;
  const rows = q.data || [];
  if (rows.length === 0) return <EmptyState title="Belum ada pergerakan stok" desc="Riwayat penjualan, barang masuk, dan koreksi akan tampil di sini." />;
  return (
    <div className="space-y-3">
      <h4 className="font-extrabold text-[#252922]">Riwayat Mutasi Stok Terakhir</h4>
      <div className="space-y-2">
        {rows.map((m) => {
          const [label, color] = MOVE_STYLE[m.type] || [m.type, 'text-[#252922]'];
          const qty = Number(m.qtyBaseUnit);
          return (
            <div key={m.id} className="p-3 bg-[#F7F4ED] rounded-control border border-[#DEDCCF] text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#252922]">
                <span className={color}>{label}</span>
                <span>{fmtDateTime(m.createdAt)}</span>
              </div>
              <p className="text-[11px] text-[#625D53]">
                {m.type === 'TRANSFER' ? `${m.fromLocation} → ${m.toLocation}` : `${qty > 0 ? '+' : ''}${fmtNum(qty)} ${baseUnit} (stok ${fmtNum(m.newStock)})`}
                {m.refNo ? ` • ${m.refNo}` : ''}
              </p>
              {(m.notes || m.reason) && <p className="text-[11px] text-[#8C877D]">{m.reason || m.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductPricing({ product }) {
  const units = product.units || [];
  const wholesale = product.wholesale || [];
  if (units.length === 0) return <EmptyState title="Belum ada satuan" desc="Tambahkan satuan jual di Data Master > Konversi Satuan." />;
  return (
    <div className="space-y-4">
      <h4 className="font-extrabold text-[#252922]">Konversi & Tingkat Harga Multi-Satuan</h4>
      <div className="bg-white border border-[#DEDCCF] rounded-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
            <tr>
              <th className="py-2 px-3">Satuan</th><th className="py-2 px-3 text-center">Isi ({product.baseUnit})</th>
              <th className="py-2 px-3 text-right">Harga Beli</th><th className="py-2 px-3 text-right">Harga Jual</th><th className="py-2 px-3 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DEDCCF]">
            {units.map((u) => {
              const buy = parseFloat(u.buyPrice) || 0;
              const sell = parseFloat(u.sellPrice) || 0;
              const margin = sell > 0 ? ((sell - buy) / sell) * 100 : 0;
              return (
                <tr key={u.id}>
                  <td className="py-2 px-3 font-bold">{u.unitName}</td>
                  <td className="py-2 px-3 text-center font-mono">{fmtNum(u.conversionFactor)}</td>
                  <td className="py-2 px-3 text-right text-[#625D53]">{formatRupiah(buy)}</td>
                  <td className="py-2 px-3 text-right font-black text-[#16845B]">{formatRupiah(sell)}</td>
                  <td className="py-2 px-3 text-right font-bold">{fmtNum(margin, 1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h4 className="font-extrabold text-[#252922]">Harga Grosir Aktif</h4>
      {wholesale.length === 0 ? (
        <p className="text-[#8C877D]">Belum ada aturan harga grosir untuk material ini. Atur di Data Master &gt; Harga Grosir.</p>
      ) : (
        <ul className="space-y-1.5">
          {wholesale.map((w) => (
            <li key={w.id} className="p-2.5 bg-[#F7F4ED] rounded-control border border-[#DEDCCF] flex justify-between">
              <span className="font-bold">{w.label} <span className="text-[#8C877D] font-normal">({units.find((u) => u.id === w.unitId)?.unitName}, min. {fmtNum(w.minQty)})</span></span>
              <span className="font-black text-[#16845B]">{formatRupiah(w.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
