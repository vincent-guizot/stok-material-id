import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import MaterialImage from '../components/MaterialImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  Plus,
  Download,
  Upload,
  Search,
  RotateCcw,
  Edit2,
  MoreHorizontal,
  X,
  ArrowDownLeft,
  CheckCircle2,
  Repeat,
  ClipboardList,
} from 'lucide-react';

export default function InventoryPage({ subTab = 'stock-list', setSubTab }) {
  const queryClient = useQueryClient();
  const [localTab, setLocalTab] = useState(subTab || 'stock-list');
  const activeTabKey = subTab || localTab;

  const handleTabChange = (tabId) => {
    setLocalTab(tabId);
    if (setSubTab) setSubTab(tabId);
  };

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerTab, setDrawerTab] = useState('summary'); // 'summary' | 'mutations' | 'pricing' | 'edit'

  // Modals state
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Form states for Barang Masuk
  const [poSupplier, setPoSupplier] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poDate, setPoDate] = useState('2026-10-20');
  const [poItems, setPoItems] = useState([]);
  const [stockInError, setStockInError] = useState(null);

  // Form states for Opname / Penyesuaian
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState(null);

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

  // 3. Fetch Suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers_list'],
    queryFn: async () => {
      return [
        { id: 1, name: 'PT Semen Indonesia', code: 'SI-001', category: 'Semen & Mortar' },
        { id: 2, name: 'Toko Besi Jaya', code: 'SI-002', category: 'Besi & Baja' },
        { id: 3, name: 'CV Sumber Bangunan', code: 'SI-003', category: 'Bata & Hebel' },
        { id: 4, name: 'Distributor Cat Maju', code: 'SI-004', category: 'Cat & Pelapis' },
        { id: 5, name: 'PT Rucika Indonesia', code: 'SI-005', category: 'Pipa & Sanitasi' },
      ];
    },
  });

  // Calculate stats
  const totalProductsCount = products.length;
  const lowStockCount = products.filter((p) => p.isLowStock && p.currentStockBase > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStockBase <= 0).length;
  const totalStockValue = products.reduce((acc, p) => {
    const buyPrice = p.units?.[0]?.buyPrice || 1000;
    return acc + p.currentStockBase * buyPrice;
  }, 0);

  // Mutation Barang Masuk
  const stockInMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/stocks/in', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsStockInModalOpen(false);
      setPoItems([]);
      setPoNotes('');
      alert('Penerimaan barang masuk berhasil disimpan dan stok otomatis bertambah!');
    },
    onError: (err) => {
      setStockInError(err.response?.data?.message || 'Gagal menyimpan barang masuk.');
    },
  });

  // Mutation Opname / Koreksi
  const adjustMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/stocks/adjust', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAdjustModalOpen(false);
      setAdjustQty('');
      setAdjustReason('');
      alert('Penyesuaian stok fisik (opname) berhasil dicatat!');
    },
    onError: (err) => {
      setAdjustError(err.response?.data?.message || 'Gagal menyesuaikan stok.');
    },
  });

  // Filtered products list
  const filteredProducts = products
    .filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== parseInt(categoryFilter, 10)) {
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
    setPoItems([
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitId: product.units?.[0]?.id,
        unitName: product.units?.[0]?.unitName || product.baseUnit,
        buyPrice: product.units?.[0]?.buyPrice || 0,
        qty: 10,
      },
    ]);
    setIsStockInModalOpen(true);
  };

  const handleOpenAdjust = (product) => {
    setSelectedProduct(product);
    setAdjustQty(product.currentStockBase.toString());
    setIsAdjustModalOpen(true);
  };

  const handleStockInSubmit = (e) => {
    e.preventDefault();
    setStockInError(null);
    if (poItems.length === 0) {
      setStockInError('Daftar barang masuk masih kosong.');
      return;
    }

    const first = poItems[0];
    stockInMutation.mutate({
      productId: first.productId,
      unitId: first.unitId,
      qty: parseFloat(first.qty) || 1,
      notes: `${poSupplier ? `Supplier: ${poSupplier}. ` : ''}${poNotes}`,
    });
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    setAdjustError(null);
    if (!selectedProduct) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty < 0) {
      setAdjustError('Jumlah fisik harus berupa angka nol atau positif.');
      return;
    }

    adjustMutation.mutate({
      productId: selectedProduct.id,
      actualBaseQty: qty,
      reason: adjustReason || 'Opname rutin toko bangunan',
    });
  };

  // Mock data for other tabs
  const incomingPOs = [
    { id: 'PO-20261020-01', date: '20 Okt 2026', supplier: 'PT Semen Indonesia', item: 'Semen Portland 50kg', qty: '200 Sak', total: 'Rp 11.600.000', status: 'Diterima Lengkap' },
    { id: 'PO-20261019-02', date: '19 Okt 2026', supplier: 'CV Sumber Bangunan', item: 'Bata Ringan Hebel 7.5cm', qty: '400 Pcs', total: 'Rp 3.800.000', status: 'Diterima Lengkap' },
    { id: 'PO-20261018-03', date: '18 Okt 2026', supplier: 'Toko Besi Jaya', item: 'Besi Beton Polos 8mm', qty: '500 Batang', total: 'Rp 27.500.000', status: 'Diterima Lengkap' },
    { id: 'PO-20261017-04', date: '17 Okt 2026', supplier: 'PT Rucika Indonesia', item: 'Pipa PVC AW 3 Inch', qty: '120 Batang', total: 'Rp 6.600.000', status: 'Diterima Lengkap' },
  ];

  const outboundItems = [
    { id: 'DO-20261020-08', date: '20 Okt 2026, 14:10', dest: 'Proyek Ruko Sentosa', receiver: 'Pak Joko (Mandor)', item: 'Semen Portland (30 Sak), Besi 8mm (50 Btg)', driver: 'Budi (Colt Diesel W 8122 UZ)', status: 'Terkirim' },
    { id: 'DO-20261020-07', date: '20 Okt 2026, 11:30', dest: 'Perumahan Graha Asri B-12', receiver: 'Pak Tono', item: 'Bata Ringan Hebel (2 Palet / 200 Pcs)', driver: 'Slamet (Pickup L300)', status: 'Terkirim' },
    { id: 'DO-20261019-06', date: '19 Okt 2026, 16:00', dest: 'Proyek Renovasi Kantor BRI', receiver: 'Pak Haji Wahyu', item: 'Cat Dulux Putih (10 Pail), Kuas 4" (12 Pcs)', driver: 'Amir (Tossa Roda 3)', status: 'Terkirim' },
  ];

  const stockMutations = [
    { id: 'MUT-20261020-01', date: '20 Okt 2026', item: 'Semen Portland 50kg', from: 'Gudang Utama (G1)', to: 'Toko Depan (Rak A-01)', qty: '50 Sak', user: 'Agus (Gudang)', notes: 'Restock pajangan depan' },
    { id: 'MUT-20261019-02', date: '19 Okt 2026', item: 'Pipa PVC AW 3 Inch', from: 'Gudang Belakang (G2)', to: 'Area Muat Pickup', qty: '30 Batang', user: 'Agus (Gudang)', notes: 'Persiapan kirim proyek' },
    { id: 'MUT-20261018-03', date: '18 Okt 2026', item: 'Bata Ringan Hebel 7.5cm', from: 'Lapangan Terbuka', to: 'Gudang Utama (G1)', qty: '100 Pcs', user: 'Bambang', notes: 'Pindah amankan dari hujan' },
  ];

  const stockAdjustments = [
    { date: '20 Okt 2026', sku: 'SMN-PRT-50', item: 'Semen Portland 50kg', before: '102 Sak', actual: '100 Sak', diff: '-2 Sak', reason: 'Kantong sobek saat bongkar muat', user: 'Admin' },
    { date: '18 Okt 2026', sku: 'BSI-BTN-08', item: 'Besi Beton Polos 8mm', before: '488 Btg', actual: '490 Btg', diff: '+2 Btg', reason: 'Selisih hitung awal penerimaan supplier', user: 'Admin' },
    { date: '15 Okt 2026', sku: 'CAT-DLX-WHT', item: 'Cat Tembok Dulux Putih', before: '25 Pail', actual: '24 Pail', diff: '-1 Pail', reason: 'Pecah tutup kemasan', user: 'Admin' },
  ];

  const stockOpnameList = [
    { sku: 'SMN-PRT-50', name: 'Semen Portland 50kg', location: 'Gudang Depan (A1-01)', systemStock: '100 Sak', physicalStock: '100 Sak', status: 'Cocok', diff: '0' },
    { sku: 'BTA-HBL-75', name: 'Bata Ringan Hebel 7.5cm', location: 'Gudang Belakang (B2-04)', systemStock: '450 Pcs', physicalStock: '445 Pcs', status: 'Selisih', diff: '-5 Pcs' },
    { sku: 'BSI-BTN-08', name: 'Besi Beton Polos 8mm', location: 'Rak Besi Luar (C1)', systemStock: '490 Btg', physicalStock: '490 Btg', status: 'Cocok', diff: '0' },
    { sku: 'PPA-PVC-03', name: 'Pipa PVC AW 3 Inch', location: 'Gudang Pipa (D1-02)', systemStock: '85 Btg', physicalStock: '84 Btg', status: 'Selisih', diff: '-1 Btg' },
    { sku: 'CAT-DLX-WHT', name: 'Cat Tembok Dulux Putih', location: 'Toko Depan (Rak Cat)', systemStock: '24 Pail', physicalStock: '24 Pail', status: 'Cocok', diff: '0' },
  ];

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
            onClick={() => alert('Fitur Export Excel: Data stok material sedang diunduh...')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#234536]" />
            <span>Export Data</span>
          </button>

          <button
            onClick={() => alert('Fitur Import Data Material: Pilih file format Excel / CSV.')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#234536]" />
            <span>Import</span>
          </button>

          <button
            onClick={() => {
              if (products.length > 0) handleOpenStockIn(products[0]);
              else setIsStockInModalOpen(true);
            }}
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
          value={`${totalProductsCount || 256} Item`}
          subtitle="180 Aktif • 76 Non-aktif"
        />

        <StatCard
          icon={Boxes}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Total Nilai Stok"
          value={formatRupiah(totalStockValue || 1245800000)}
          subtitle="Berdasarkan harga rata-rata"
          trend="12%"
          trendType="up"
        />

        <StatCard
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Stok Menipis"
          value={`${lowStockCount || 18} Item`}
          subtitle="Perlu segera restock"
        />

        <StatCard
          icon={XCircle}
          iconBg="bg-rose-50 text-[#C62828]"
          title="Stok Habis"
          value={`${outOfStockCount || 6} Item`}
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

          {/* Main Table & Selected Detail Drawer Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Table Area */}
            <div className={`${selectedProduct ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
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
                            onClick={() => setSelectedProduct(isSelected ? null : p)}
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
                                  onClick={() => handleOpenAdjust(p)}
                                  className="p-1.5 hover:bg-slate-200 rounded text-[#234536] transition"
                                  title="Opname / Koreksi Stok"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedProduct(p)}
                                  className="p-1.5 hover:bg-slate-200 rounded text-[#625D53] transition"
                                  title="Detail"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
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

            {/* Selected Product Detail Drawer */}
            {selectedProduct && (
              <div className="lg:col-span-4 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <MaterialImage
                      name={selectedProduct.name}
                      sku={selectedProduct.sku}
                      className="w-14 h-14 shrink-0"
                    />
                    <div>
                      <h3 className="font-black text-sm text-[#252922] leading-tight">
                        {selectedProduct.name}
                      </h3>
                      <div className="text-[11px] text-[#8C877D] font-mono mt-0.5">
                        {selectedProduct.sku}
                      </div>
                      <div className="mt-1">
                        <StatusBadge status="aktif" label="Aktif" size="xs" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 text-[#8C877D] hover:text-[#252922] rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex border-b border-[#DEDCCF] gap-1 text-xs">
                  {[
                    { id: 'summary', label: 'Ringkasan' },
                    { id: 'mutations', label: 'Stok & Mutasi' },
                    { id: 'pricing', label: 'Harga' },
                    { id: 'edit', label: 'Edit' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDrawerTab(tab.id)}
                      className={`py-1.5 px-2.5 font-bold border-b-2 transition ${
                        drawerTab === tab.id
                          ? 'border-[#234536] text-[#234536]'
                          : 'border-transparent text-[#625D53] hover:text-[#252922]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="font-bold text-[#252922] flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Informasi Produk</span>
                  </div>

                  <div className="bg-[#F7F4ED] rounded-control p-3 space-y-2 border border-[#DEDCCF]">
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Kategori</span>
                      <span className="font-bold text-[#252922]">{selectedProduct.category?.name || 'Semen & Mortar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Satuan Utama</span>
                      <span className="font-bold text-[#252922]">{selectedProduct.baseUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Stok Minimum</span>
                      <span className="font-bold text-[#252922]">{selectedProduct.minStock} {selectedProduct.baseUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Lokasi Rak</span>
                      <span className="font-bold text-[#252922]">Gudang Depan (A1-01)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-card bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#234536]">Stok Saat Ini</div>
                    <StatusBadge status="aman" label="Stok Aman" size="xs" />
                  </div>
                  <div className="text-2xl font-black text-[#16845B]">
                    {selectedProduct.humanReadableStock || `${selectedProduct.currentStockBase} ${selectedProduct.baseUnit}`}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C877D]">
                    Aksi Cepat
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenStockIn(selectedProduct)}
                      className="py-2 px-3 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Barang Masuk</span>
                    </button>

                    <button
                      onClick={() => handleOpenAdjust(selectedProduct)}
                      className="py-2 px-3 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] text-[#252922] text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Koreksi / Opname</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BARANG MASUK (PO Supplier)                       */}
      {/* ======================================================== */}
      {activeTabKey === 'stock-in' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Daftar Penerimaan Barang Masuk (PO Supplier)
              </h3>
              <p className="text-xs text-[#625D53]">
                Catatan surat jalan & pengiriman stok material dari produsen/distributor.
              </p>
            </div>
            <button
              onClick={() => setIsStockInModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Barang Masuk Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">NO. PO / SJ</th>
                  <th className="py-2.5 px-3">TANGGAL</th>
                  <th className="py-2.5 px-3">SUPPLIER</th>
                  <th className="py-2.5 px-3">MATERIAL DITERIMA</th>
                  <th className="py-2.5 px-3 text-center">QTY</th>
                  <th className="py-2.5 px-3 text-right">TOTAL NILAI</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {incomingPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{po.id}</td>
                    <td className="py-3 px-3 text-[#625D53]">{po.date}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{po.supplier}</td>
                    <td className="py-3 px-3">{po.item}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#252922]">{po.qty}</td>
                    <td className="py-3 px-3 text-right font-black text-[#252922]">{po.total}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#16845B] text-[10px] font-bold">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BARANG KELUAR (Pengiriman Proyek)                 */}
      {/* ======================================================== */}
      {activeTabKey === 'stock-out' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Riwayat Pengeluaran Material Proyek & Delivery
              </h3>
              <p className="text-xs text-[#625D53]">
                Pengiriman bahan bangunan ke lokasi proyek mandor dan konsumen.
              </p>
            </div>
            <button
              onClick={() => alert('Formulir surat jalan delivery material baru.')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Pengeluaran Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">NO. SURAT JALAN</th>
                  <th className="py-2.5 px-3">WAKTU</th>
                  <th className="py-2.5 px-3">TUJUAN PROYEK</th>
                  <th className="py-2.5 px-3">PENERIMA / MANDOR</th>
                  <th className="py-2.5 px-3">RINCIAN MATERIAL</th>
                  <th className="py-2.5 px-3">ARMADA / DRIVER</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {outboundItems.map((ob) => (
                  <tr key={ob.id} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{ob.id}</td>
                    <td className="py-3 px-3 text-[#625D53]">{ob.date}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{ob.dest}</td>
                    <td className="py-3 px-3 text-[#252922]">{ob.receiver}</td>
                    <td className="py-3 px-3 font-semibold">{ob.item}</td>
                    <td className="py-3 px-3 text-[#625D53]">{ob.driver}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {ob.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MUTASI STOK (Antar Gudang & Rak)                  */}
      {/* ======================================================== */}
      {activeTabKey === 'stock-mutation' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Mutasi Antar Gudang & Rak Toko
              </h3>
              <p className="text-xs text-[#625D53]">
                Catat perpindahan material dari gudang transit / depo utama ke rak penjualan.
              </p>
            </div>
            <button
              onClick={() => alert('Buka form perpindahan rak / gudang')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Mutasi Lokasi Stok</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">NO. MUTASI</th>
                  <th className="py-2.5 px-3">TANGGAL</th>
                  <th className="py-2.5 px-3">MATERIAL</th>
                  <th className="py-2.5 px-3">DARI LOKASI</th>
                  <th className="py-2.5 px-3">KE LOKASI</th>
                  <th className="py-2.5 px-3 text-center">QTY</th>
                  <th className="py-2.5 px-3">OPERATOR</th>
                  <th className="py-2.5 px-3">CATATAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {stockMutations.map((mut) => (
                  <tr key={mut.id} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{mut.id}</td>
                    <td className="py-3 px-3 text-[#625D53]">{mut.date}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{mut.item}</td>
                    <td className="py-3 px-3 text-[#C62828] font-semibold">{mut.from}</td>
                    <td className="py-3 px-3 text-[#16845B] font-semibold">{mut.to}</td>
                    <td className="py-3 px-3 text-center font-black text-[#252922]">{mut.qty}</td>
                    <td className="py-3 px-3 text-[#625D53]">{mut.user}</td>
                    <td className="py-3 px-3 text-[#8C877D] italic">{mut.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: PENYESUAIAN STOK (Koreksi Selisih)               */}
      {/* ======================================================== */}
      {activeTabKey === 'stock-adjust' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Riwayat Penyesuaian / Koreksi Stok Fisik
              </h3>
              <p className="text-xs text-[#625D53]">
                Catatan penyesuaian stok sistem akibat kerusakan, barang basah, atau selisih bongkar.
              </p>
            </div>
            <button
              onClick={() => {
                if (products.length > 0) handleOpenAdjust(products[0]);
                else setIsAdjustModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Input Koreksi Stok Fisik</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">TANGGAL</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">NAMA MATERIAL</th>
                  <th className="py-2.5 px-3 text-center">STOK SEBELUM</th>
                  <th className="py-2.5 px-3 text-center">STOK FISIK BARU</th>
                  <th className="py-2.5 px-3 text-center">SELISIH</th>
                  <th className="py-2.5 px-3">ALASAN KOREKSI</th>
                  <th className="py-2.5 px-3">PETUGAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {stockAdjustments.map((adj, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 text-[#625D53]">{adj.date}</td>
                    <td className="py-3 px-3 font-mono text-[#8C877D]">{adj.sku}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{adj.item}</td>
                    <td className="py-3 px-3 text-center text-[#625D53]">{adj.before}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#252922]">{adj.actual}</td>
                    <td className="py-3 px-3 text-center font-black">
                      <span className={adj.diff.startsWith('-') ? 'text-[#C62828]' : 'text-[#16845B]'}>
                        {adj.diff}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#252922]">{adj.reason}</td>
                    <td className="py-3 px-3 text-[#625D53]">{adj.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: OPNAME STOK (Stock Opname Rutin)                  */}
      {/* ======================================================== */}
      {activeTabKey === 'stock-opname' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Lembar Kerja Stock Opname Rutin
              </h3>
              <p className="text-xs text-[#625D53]">
                Audit fisik berkala untuk mencocokkan stok aktual di rak dengan database sistem.
              </p>
            </div>
            <button
              onClick={() => alert('Sesi Stock Opname Baru telah dibuka! Cetak lembar audit fisik.')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Mulai Sesi Opname Bulanan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">NAMA MATERIAL</th>
                  <th className="py-2.5 px-3">LOKASI RAK</th>
                  <th className="py-2.5 px-3 text-center">STOK SISTEM</th>
                  <th className="py-2.5 px-3 text-center">HITUNGAN FISIK</th>
                  <th className="py-2.5 px-3 text-center">SELISIH</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  <th className="py-2.5 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {stockOpnameList.map((op, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{op.sku}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{op.name}</td>
                    <td className="py-3 px-3 text-[#625D53]">{op.location}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#252922]">{op.systemStock}</td>
                    <td className="py-3 px-3 text-center font-black text-[#234536]">{op.physicalStock}</td>
                    <td className="py-3 px-3 text-center font-black">
                      <span className={op.diff === '0' ? 'text-[#16845B]' : 'text-[#C62828]'}>
                        {op.diff}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          op.status === 'Cocok'
                            ? 'bg-emerald-100 text-[#16845B]'
                            : 'bg-rose-100 text-[#C62828]'
                        }`}
                      >
                        {op.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          if (products.length > 0) handleOpenAdjust(products[0]);
                          else setIsAdjustModalOpen(true);
                        }}
                        className="px-2 py-1 rounded bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] font-bold text-[#234536]"
                      >
                        Sesuaikan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tambah Transaksi Barang Masuk */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-lg w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-[#234536]" />
                <h3 className="font-extrabold text-base text-[#252922]">
                  Tambah Transaksi Barang Masuk (PO)
                </h3>
              </div>
              <button
                onClick={() => setIsStockInModalOpen(false)}
                className="text-[#8C877D] hover:text-[#252922] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {stockInError && (
              <div className="p-2.5 bg-red-50 text-[#C62828] text-xs font-bold rounded-control border border-red-200">
                {stockInError}
              </div>
            )}

            <form onSubmit={handleStockInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Tanggal Masuk</label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Supplier *</label>
                <select
                  value={poSupplier}
                  onChange={(e) => setPoSupplier(e.target.value)}
                  required
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                >
                  <option value="">-- Pilih Supplier Pengirim --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {poItems.length > 0 && (
                <div className="p-3 bg-[#F7F4ED] rounded-control border border-[#DEDCCF] space-y-2">
                  <div className="font-bold text-[#252922]">Barang yang Diterima:</div>
                  <div className="font-extrabold text-sm">{poItems[0].productName}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] text-[#625D53] block">Jumlah Masuk</label>
                      <input
                        type="number"
                        min="1"
                        value={poItems[0].qty}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[0].qty = e.target.value;
                          setPoItems(updated);
                        }}
                        className="w-full p-1.5 bg-white border border-[#DEDCCF] rounded font-bold"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[11px] text-[#625D53] block">Satuan</label>
                      <div className="p-1.5 bg-stone-100 rounded text-center font-bold">
                        {poItems[0].unitName}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-[#252922] block mb-1">Catatan / No. Surat Jalan Supplier</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Pengiriman tahap 1, kondisi baik..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={stockInMutation.isPending}
                  className="px-5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{stockInMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Penyesuaian Stok / Opname */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#234536]" />
                <h3 className="font-extrabold text-base text-[#252922]">
                  Opname / Penyesuaian Stok Fisik
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-[#8C877D] hover:text-[#252922] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adjustError && (
              <div className="p-2.5 bg-red-50 text-[#C62828] text-xs font-bold rounded-control border border-red-200">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F4ED] rounded-control border border-[#DEDCCF]">
                <div className="font-bold text-[#252922]">{selectedProduct.name}</div>
                <div className="text-[11px] text-[#625D53]">
                  Stok di Sistem: <span className="font-bold text-[#234536]">{selectedProduct.currentStockBase} {selectedProduct.baseUnit}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">
                  Jumlah Stok Fisik Riil di Gudang ({selectedProduct.baseUnit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full p-2.5 text-base font-black bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-[#252922] focus:outline-none focus:border-[#234536]"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">
                  Alasan Selisih / Catatan Koreksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Rusak kemasan, selisih hitung fisik bulanan..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="px-5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{adjustMutation.isPending ? 'Menyimpan...' : 'Perbarui Stok Fisik'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
