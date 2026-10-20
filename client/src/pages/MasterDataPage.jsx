import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import MaterialImage from '../components/MaterialImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import {
  Database,
  Layers,
  Tags,
  Ruler,
  Plus,
  Upload,
  Download,
  Search,
  RotateCcw,
  Edit2,
  MoreHorizontal,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Building2,
  Users,
  Percent,
} from 'lucide-react';

export default function MasterDataPage({ subTab = 'products', setSubTab }) {
  const queryClient = useQueryClient();
  const [localTab, setLocalTab] = useState(subTab || 'products');
  const activeTabKey = subTab || localTab;

  const handleTabChange = (tabId) => {
    setLocalTab(tabId);
    if (setSubTab) setSubTab(tabId);
  };

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [formTab, setFormTab] = useState('basic'); // 'basic' | 'price' | 'units' | 'other'

  // Form states for Tambah Produk
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodBaseUnit, setProdBaseUnit] = useState('Pcs');
  const [prodBuyPrice, setProdBuyPrice] = useState('');
  const [prodSellPrice, setProdSellPrice] = useState('');
  const [prodMinStock, setProdMinStock] = useState('50');
  const [prodInitialStock, setProdInitialStock] = useState('100');
  const [prodDesc, setProdDesc] = useState('');
  const [formError, setFormError] = useState(null);

  // Fetch Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search } });
      return res.data.data;
    },
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddDrawerOpen(false);
      resetForm();
      alert('Produk material baru berhasil ditambahkan!');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Gagal menambahkan produk.');
    },
  });

  const resetForm = () => {
    setProdName('');
    setProdSku('');
    setProdCatId('');
    setProdBrand('');
    setProdBaseUnit('Pcs');
    setProdBuyPrice('');
    setProdSellPrice('');
    setProdMinStock('50');
    setProdInitialStock('100');
    setProdDesc('');
    setFormError(null);
  };

  const handleGenerateSku = () => {
    const prefix = prodName
      ? prodName.substring(0, 3).toUpperCase()
      : 'MAT';
    const rand = Math.floor(100 + Math.random() * 900);
    setProdSku(`${prefix}-${rand}`);
  };

  const handleCreateProductSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!prodName || !prodSku) {
      setFormError('Nama produk dan SKU wajib diisi.');
      return;
    }

    const payload = {
      name: prodName,
      sku: prodSku,
      categoryId: prodCatId || (categories[0]?.id || 1),
      baseUnit: prodBaseUnit,
      minStock: parseFloat(prodMinStock) || 10,
      initialStock: parseFloat(prodInitialStock) || 0,
      units: [
        {
          unitName: prodBaseUnit,
          conversionFactor: 1,
          buyPrice: parseFloat(prodBuyPrice) || 1000,
          sellPrice: parseFloat(prodSellPrice) || 1500,
          level: 1,
        },
      ],
    };

    createProductMutation.mutate(payload);
  };

  const subMenus = [
    { id: 'products', label: 'Data Produk' },
    { id: 'categories', label: 'Kategori' },
    { id: 'brands', label: 'Merek' },
    { id: 'units', label: 'Satuan & Konversi' },
    { id: 'wholesale', label: 'Harga Grosir' },
    { id: 'customers', label: 'Pelanggan' },
    { id: 'suppliers', label: 'Supplier' },
  ];

  // Mock data for master data tabs
  const brandList = [
    { name: 'Semen Gresik', category: 'Semen & Mortar', count: 8, origin: 'PT Semen Indonesia' },
    { name: 'Tiga Roda', category: 'Semen & Mortar', count: 6, origin: 'PT Indocement Tunggal Prakarsa' },
    { name: 'Citicon', category: 'Bata & Hebel', count: 12, origin: 'PT Citicon Nusantara Industries' },
    { name: 'Krakatau Steel (KS)', category: 'Besi & Baja', count: 18, origin: 'PT Krakatau Steel' },
    { name: 'Rucika', category: 'Pipa & Sanitasi', count: 24, origin: 'PT Wahana Duta Jaya Rucika' },
    { name: 'Dulux', category: 'Cat & Pelapis', count: 32, origin: 'PT ICI Paints Indonesia' },
    { name: 'Avian', category: 'Cat & Pelapis', count: 28, origin: 'PT Avia Avian Tbk' },
  ];

  const unitConversions = [
    { baseUnit: 'Kg (Kilogram)', upperUnit: 'Sak (50 Kg)', factor: 50, category: 'Semen', description: '1 Sak = 50 Kg semen murni' },
    { baseUnit: 'Meter', upperUnit: 'Batang (12 Meter)', factor: 12, category: 'Besi Beton', description: '1 Batang SNI = 12 Meter' },
    { baseUnit: 'Pcs', upperUnit: 'Palet (100 Pcs)', factor: 100, category: 'Bata Ringan Hebel', description: '1 Palet pabrik = 100 Pcs hebel' },
    { baseUnit: 'Batang', upperUnit: 'Ikat (25 Batang)', factor: 25, category: 'Baja Ringan / Reng', description: '1 Ikat = 25 Batang profil C / Reng' },
    { baseUnit: 'Liter', upperUnit: 'Pail (20 Liter)', factor: 20, category: 'Cat Tembok', description: '1 Pail besar = 20 Liter' },
  ];

  const wholesaleRules = [
    { name: 'Grosir Semen Partai Besar', minQty: '50 Sak', discount: 'Diskon Rp 2.000 / Sak', target: 'Mandor & Kontraktor' },
    { name: 'Grosir Bata Ringan Hebel', minQty: '5 Palet (500 Pcs)', discount: 'Diskon 5%', target: 'Proyek Ruko & Rumah' },
    { name: 'Grosir Besi Beton SNI', minQty: '100 Batang', discount: 'Diskon Rp 3.500 / Btg', target: 'Mandor Struktur' },
    { name: 'Grosir Pipa PVC AW', minQty: '20 Batang', discount: 'Diskon 8%', target: 'Instalatir Plumbing' },
  ];

  const customerList = [
    { name: 'Pak Joko (Ruko Sentosa)', phone: '0812-3456-7890', address: 'Jl. Ahmad Yani No. 45, Gresik', limit: 'Rp 50.000.000', type: 'Mandor Prioritas' },
    { name: 'Pak Tono (Perum Graha Asri)', phone: '0813-9876-5432', address: 'Perum Graha Asri Blok B-12', limit: 'Rp 30.000.000', type: 'Mandor Kontraktor' },
    { name: 'Pak Haji Wahyu', phone: '0821-5555-1234', address: 'Proyek Renovasi Kantor BRI', limit: 'Rp 75.000.000', type: 'Mandor Proyek' },
    { name: 'CV Mandiri Karya', phone: '0857-1111-2222', address: 'Kawasan Industri Gresik', limit: 'Rp 40.000.000', type: 'Perusahaan Konstruksi' },
    { name: 'Pembeli Retail Umum', phone: '-', address: 'Area Toko', limit: 'Rp 0 (Cash)', type: 'Pelanggan Umum' },
  ];

  const supplierList = [
    { name: 'PT Semen Indonesia', code: 'SUP-001', category: 'Semen & Mortar', phone: '031-3981732', address: 'Gresik, Jawa Timur' },
    { name: 'Toko Besi Jaya', code: 'SUP-002', category: 'Besi & Baja', phone: '031-7482910', address: 'Surabaya Barat' },
    { name: 'CV Sumber Bangunan', code: 'SUP-003', category: 'Bata & Hebel', phone: '031-8923011', address: 'Krian, Sidoarjo' },
    { name: 'Distributor Cat Maju', code: 'SUP-004', category: 'Cat & Pelapis', phone: '031-5619283', address: 'Surabaya Pusat' },
    { name: 'PT Rucika Indonesia', code: 'SUP-005', category: 'Pipa & Sanitasi', phone: '021-8930129', address: 'Cikarang, Jawa Barat' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Master Data Toko
            </h1>
            <p className="text-xs text-[#625D53]">
              Kelola data produk, kategori, satuan konversi, harga grosir, dan relasi mitra.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('Mengimpor data dari Excel...')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#234536]" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => alert('Mengekspor data ke Excel...')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#234536]" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards - Responsive Grid without horizontal overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={Database}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Produk"
          value={`${products.length || 256} Item`}
          subtitle="180 Aktif • 76 Non-aktif"
        />

        <StatCard
          icon={Layers}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Kategori Aktif"
          value={`${categories.length || 27} Kategori`}
          subtitle="Aktif digunakan"
        />

        <StatCard
          icon={Tags}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Merek Terdaftar"
          value={`${brandList.length} Merek`}
          subtitle="Tiga Roda, Gresik, KS, dll"
        />

        <StatCard
          icon={Ruler}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Satuan Multi-Tingkat"
          value={`${unitConversions.length} Aturan`}
          subtitle="Sak, Batang, Palet, Meter, dll"
        />
      </div>

      {/* Subtabs Bar - Fully Interactive */}
      <div className="flex border-b border-[#DEDCCF] gap-2 overflow-x-auto pb-1">
        {subMenus.map((tab) => {
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
      {/* TAB 1: DATA PRODUK (Default)                             */}
      {/* ======================================================== */}
      {activeTabKey === 'products' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-card border border-[#DEDCCF] shadow-card flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari produk, SKU, atau kategori..."
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

              <select className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]">
                <option value="all">Semua Merek</option>
                <option value="indocement">Tiga Roda</option>
                <option value="semen-gresik">Semen Gresik</option>
                <option value="citicon">Citicon</option>
                <option value="rucika">Rucika</option>
                <option value="dulux">Dulux</option>
              </select>

              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#625D53] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>

          {/* Main Table & Add Product Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`${isAddDrawerOpen ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                    <tr>
                      <th className="py-3 px-3 w-8">NO</th>
                      <th className="py-3 px-3">PRODUK</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">KATEGORI</th>
                      <th className="py-3 px-3">MEREK</th>
                      <th className="py-3 px-3 text-center">SATUAN</th>
                      <th className="py-3 px-3 text-right">HARGA JUAL</th>
                      <th className="py-3 px-3 text-center">STOK</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-3 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDCCF]/70">
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-xs font-bold text-[#625D53]">
                          Memuat master data produk...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-xs text-[#8C877D]">
                          Belum ada data produk material.
                        </td>
                      </tr>
                    ) : (
                      products.map((p, idx) => {
                        const primaryUnit = p.units?.[p.units.length - 1] || p.units?.[0] || {};
                        const isOutOfStock = p.currentStockBase <= 0;
                        const isLow = p.isLowStock;

                        const status = isOutOfStock
                          ? 'habis'
                          : isLow
                          ? 'menipis'
                          : 'aktif';

                        return (
                          <tr key={p.id} className="hover:bg-[#F7F4ED]/50 transition">
                            <td className="py-3 px-3 text-[#8C877D] font-medium">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <MaterialImage name={p.name} sku={p.sku} className="w-8 h-8 shrink-0" />
                                <div className="font-extrabold text-xs text-[#252922]">{p.name}</div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#8C877D]">{p.sku}</td>
                            <td className="py-3 px-3 text-[#625D53] font-medium">
                              {p.category?.name || 'Material Bangunan'}
                            </td>
                            <td className="py-3 px-3 text-[#625D53] font-medium">
                              {p.name.includes('Gresik')
                                ? 'Semen Gresik'
                                : p.name.includes('Roda')
                                ? 'Tiga Roda'
                                : p.name.includes('Hebel')
                                ? 'Citicon'
                                : p.name.includes('Besi')
                                ? 'KS'
                                : p.name.includes('Dulux')
                                ? 'Dulux'
                                : 'Standard'}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-[#252922]">
                              {primaryUnit.unitName || p.baseUnit}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-[#252922]">
                              {formatRupiah(primaryUnit.sellPrice || 0)}
                            </td>
                            <td className="py-3 px-3 text-center font-black">
                              <span
                                className={
                                  isOutOfStock
                                    ? 'text-[#C62828]'
                                    : isLow
                                    ? 'text-[#D97706]'
                                    : 'text-[#16845B]'
                                }
                              >
                                {p.currentStockBase}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <StatusBadge status={status} />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setProdName(p.name);
                                    setProdSku(p.sku);
                                    setIsAddDrawerOpen(true);
                                  }}
                                  className="p-1 hover:bg-slate-200 rounded text-[#234536] transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1 hover:bg-slate-200 rounded text-[#8C877D] transition">
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

              <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED]/50 flex items-center justify-between text-xs text-[#625D53]">
                <div>
                  Tampilkan <span className="font-bold">{products.length}</span> produk
                </div>
                <div className="flex items-center gap-1">
                  <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&lt;</button>
                  <button className="px-2.5 py-1 rounded bg-[#234536] text-white font-bold">1</button>
                  <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&gt;</button>
                </div>
              </div>
            </div>

            {/* Tambah Produk Drawer */}
            {isAddDrawerOpen && (
              <div className="lg:col-span-5 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
                  <h3 className="font-extrabold text-sm text-[#252922]">Tambah Produk</h3>
                  <button
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="text-[#8C877D] hover:text-[#252922] p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex border-b border-[#DEDCCF] gap-1 text-xs">
                  {[
                    { id: 'basic', label: 'Informasi Dasar' },
                    { id: 'price', label: 'Harga & Stok' },
                    { id: 'units', label: 'Satuan & Konversi' },
                    { id: 'other', label: 'Lainnya' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setFormTab(t.id)}
                      className={`py-1.5 px-2.5 font-bold border-b-2 transition ${
                        formTab === t.id
                          ? 'border-[#234536] text-[#234536]'
                          : 'border-transparent text-[#625D53] hover:text-[#252922]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {formError && (
                  <div className="p-2.5 bg-red-50 text-[#C62828] text-xs font-bold rounded-control border border-red-200">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateProductSubmit} className="space-y-3.5 text-xs">
                  {formTab === 'basic' && (
                    <>
                      <div className="p-4 rounded-card border-2 border-dashed border-[#DEDCCF] bg-[#F7F4ED]/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-[#8C877D]">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-[#252922]">Upload Foto Produk</div>
                            <div className="text-[10px] text-[#8C877D]">PNG/JPG, maks 2MB</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert('Pilih berkas foto material bangunan')}
                          className="px-3 py-1.5 rounded-control bg-white border border-[#DEDCCF] font-bold text-xs hover:bg-[#F7F4ED] transition"
                        >
                          Pilih Gambar
                        </button>
                      </div>

                      <div>
                        <label className="font-bold text-[#252922] block mb-1">Nama Produk *</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Semen Portland 50kg"
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-semibold text-[#252922]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[#252922] block mb-1">SKU / Kode Produk *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Contoh: SMN-PRT-50"
                            value={prodSku}
                            onChange={(e) => setProdSku(e.target.value)}
                            className="flex-1 p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-mono font-bold text-[#252922]"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateSku}
                            className="px-3 py-2 bg-white border border-[#DEDCCF] rounded-control font-bold hover:bg-[#F7F4ED] transition"
                          >
                            Generate
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Kategori *</label>
                          <select
                            value={prodCatId}
                            onChange={(e) => setProdCatId(e.target.value)}
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold text-[#252922]"
                          >
                            <option value="">Pilih Kategori</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Merek</label>
                          <select
                            value={prodBrand}
                            onChange={(e) => setProdBrand(e.target.value)}
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold text-[#252922]"
                          >
                            <option value="">Pilih Merek</option>
                            <option value="indocement">Tiga Roda</option>
                            <option value="semen-gresik">Semen Gresik</option>
                            <option value="citicon">Citicon</option>
                            <option value="rucika">Rucika</option>
                            <option value="dulux">Dulux</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Satuan Utama *</label>
                          <select
                            value={prodBaseUnit}
                            onChange={(e) => setProdBaseUnit(e.target.value)}
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold text-[#252922]"
                          >
                            <option value="Pcs">Pcs</option>
                            <option value="Sak">Sak</option>
                            <option value="Meter">Meter</option>
                            <option value="Batang">Batang</option>
                            <option value="Kaleng">Kaleng</option>
                            <option value="m3">m³ (Kubik)</option>
                            <option value="Kg">Kg</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Berat / Isi (Opsional)</label>
                          <input
                            type="text"
                            placeholder="Contoh: 50 Kg"
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-[#252922] block mb-1">Deskripsi Produk</label>
                        <textarea
                          rows={3}
                          placeholder="Contoh: Semen Portland kualitas tinggi untuk konstruksi rumah..."
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                        />
                      </div>
                    </>
                  )}

                  {formTab === 'price' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Harga Beli (Modal)</label>
                          <input
                            type="number"
                            placeholder="58000"
                            value={prodBuyPrice}
                            onChange={(e) => setProdBuyPrice(e.target.value)}
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Harga Jual Kasir</label>
                          <input
                            type="number"
                            placeholder="68000"
                            value={prodSellPrice}
                            onChange={(e) => setProdSellPrice(e.target.value)}
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold text-[#234536]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Stok Awal</label>
                          <input
                            type="number"
                            value={prodInitialStock}
                            onChange={(e) => setProdInitialStock(e.target.value)}
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-[#252922] block mb-1">Peringatan Stok Minimum</label>
                          <input
                            type="number"
                            value={prodMinStock}
                            onChange={(e) => setProdMinStock(e.target.value)}
                            className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {(formTab === 'units' || formTab === 'other') && (
                    <div className="p-4 bg-[#F7F4ED] rounded-control border border-[#DEDCCF] text-[#625D53] text-center">
                      Fitur konversi satuan multi-tingkat otomatis terkonfigurasi pada tab ini saat produk disimpan.
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#DEDCCF] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddDrawerOpen(false)}
                      className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold text-[#252922] hover:bg-[#F7F4ED]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={createProductMutation.isPending}
                      className="px-5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold flex items-center gap-2 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{createProductMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: KATEGORI                                          */}
      {/* ======================================================== */}
      {activeTabKey === 'categories' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Daftar Kategori Material Bangunan
              </h3>
              <p className="text-xs text-[#625D53]">
                Kelompokkan produk material konstruksi untuk kemudahan kasir dan laporan omzet.
              </p>
            </div>
            <button
              onClick={() => alert('Buka dialog tambah kategori')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-card bg-[#F7F4ED]/60 border border-[#DEDCCF] flex items-center justify-between hover:bg-[#F7F4ED] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#DEDCCF] flex items-center justify-center text-lg shadow-2xs">
                    {c.icon || '🧱'}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#252922]">{c.name}</div>
                    <div className="text-[10px] text-[#8C877D]">
                      {products.filter((p) => p.categoryId === c.id).length} Produk Material
                    </div>
                  </div>
                </div>
                <button className="p-1 text-[#625D53] hover:text-[#234536] rounded">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MEREK                                             */}
      {/* ======================================================== */}
      {activeTabKey === 'brands' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Daftar Merek & Pabrikan Terdaftar
              </h3>
              <p className="text-xs text-[#625D53]">
                Kelola merek prinsipal semen, bata ringan, besi, pipa, dan cat.
              </p>
            </div>
            <button
              onClick={() => alert('Buka dialog tambah merek pabrikan')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Merek</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">NAMA MEREK</th>
                  <th className="py-2.5 px-3">KATEGORI UTAMA</th>
                  <th className="py-2.5 px-3">PRODUSEN / PRINSIPAL</th>
                  <th className="py-2.5 px-3 text-center">JUMLAH PRODUK</th>
                  <th className="py-2.5 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {brandList.map((b, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-extrabold text-[#252922]">{b.name}</td>
                    <td className="py-3 px-3 text-[#625D53]">{b.category}</td>
                    <td className="py-3 px-3 text-[#252922]">{b.origin}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#234536]">{b.count} Item</td>
                    <td className="py-3 px-3 text-center">
                      <button className="p-1 hover:bg-slate-200 rounded text-[#234536]">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SATUAN & KONVERSI                                 */}
      {/* ======================================================== */}
      {activeTabKey === 'units' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Satuan & Rumus Konversi Multi-Tingkat
              </h3>
              <p className="text-xs text-[#625D53]">
                Aturan pemotongan otomatis stok dasar saat kasir menjual satuan tingkat atas (Sak, Batang, Palet).
              </p>
            </div>
            <button
              onClick={() => alert('Buka dialog konfigurasi aturan konversi')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rumus Konversi</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">SATUAN JUAL (UPPER)</th>
                  <th className="py-2.5 px-3">SATUAN DASAR (BASE)</th>
                  <th className="py-2.5 px-3 text-center">FAKTOR PENGALI</th>
                  <th className="py-2.5 px-3">KATEGORI MATERIAL</th>
                  <th className="py-2.5 px-3">PENJELASAN KONVERSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {unitConversions.map((u, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-bold text-[#234536]">{u.upperUnit}</td>
                    <td className="py-3 px-3 font-medium text-[#252922]">{u.baseUnit}</td>
                    <td className="py-3 px-3 text-center font-black text-sm text-[#16845B]">
                      {u.factor}x
                    </td>
                    <td className="py-3 px-3 text-[#625D53]">{u.category}</td>
                    <td className="py-3 px-3 text-[#8C877D]">{u.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: HARGA GROSIR                                      */}
      {/* ======================================================== */}
      {activeTabKey === 'wholesale' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Tier & Aturan Harga Grosir Toko
              </h3>
              <p className="text-xs text-[#625D53]">
                Pengurangan harga otomatis saat mandor / kontraktor belanja dalam volume tertentu.
              </p>
            </div>
            <button
              onClick={() => alert('Buka dialog konfigurasi tier grosir baru')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Buat Aturan Grosir Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {wholesaleRules.map((w, idx) => (
              <div
                key={idx}
                className="p-4 rounded-card bg-[#F7F4ED]/60 border border-[#DEDCCF] space-y-2 hover:bg-[#F7F4ED] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-xs text-[#252922]">{w.name}</div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#16845B] font-bold text-[10px]">
                    {w.discount}
                  </span>
                </div>
                <div className="text-xs text-[#625D53]">
                  Minimal Pembelian: <span className="font-bold text-[#252922]">{w.minQty}</span>
                </div>
                <div className="text-[11px] text-[#8C877D]">
                  Berlaku untuk: <span className="font-semibold text-[#234536]">{w.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: PELANGGAN                                         */}
      {/* ======================================================== */}
      {activeTabKey === 'customers' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Daftar Mandor & Pelanggan Terdaftar
              </h3>
              <p className="text-xs text-[#625D53]">
                Kelola kontak mandor proyek, alamat pengiriman, dan pagu kredit kasbon.
              </p>
            </div>
            <button
              onClick={() => alert('Buka dialog tambah mandor / pelanggan')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tambah Mandor Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">NAMA MANDOR / PELANGGAN</th>
                  <th className="py-2.5 px-3">TIPE</th>
                  <th className="py-2.5 px-3">NO. HP</th>
                  <th className="py-2.5 px-3">ALAMAT PROYEK</th>
                  <th className="py-2.5 px-3 text-right">PLAFON KREDIT KASBON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {customerList.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-bold text-[#252922]">{c.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-white border border-[#DEDCCF] font-bold text-[10px]">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#625D53]">{c.phone}</td>
                    <td className="py-3 px-3 text-[#625D53]">{c.address}</td>
                    <td className="py-3 px-3 text-right font-black text-[#234536]">{c.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: SUPPLIER                                          */}
      {/* ======================================================== */}
      {activeTabKey === 'suppliers' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Daftar Supplier & Distributor Bahan Bangunan
              </h3>
              <p className="text-xs text-[#625D53]">
                Mitra penyedia pasokan semen, bata hebel, besi, pipa, dan cat.
              </p>
            </div>
            <button
              onClick={() => alert('Buka dialog tambah supplier')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Tambah Supplier</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">KODE</th>
                  <th className="py-2.5 px-3">NAMA SUPPLIER</th>
                  <th className="py-2.5 px-3">KATEGORI PRODUK</th>
                  <th className="py-2.5 px-3">TELEPON / SALES</th>
                  <th className="py-2.5 px-3">KOTA / ALAMAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {supplierList.map((s, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{s.code}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{s.name}</td>
                    <td className="py-3 px-3 text-[#625D53]">{s.category}</td>
                    <td className="py-3 px-3 font-mono text-[#625D53]">{s.phone}</td>
                    <td className="py-3 px-3 text-[#625D53]">{s.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
