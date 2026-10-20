import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import {
  Truck,
  Building2,
  DollarSign,
  Plus,
  Upload,
  Download,
  Search,
  RotateCcw,
  Edit2,
  MoreHorizontal,
  X,
  CheckCircle2,
  History,
  Ban,
} from 'lucide-react';

export default function SupplierPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [drawerTab, setDrawerTab] = useState('info'); // 'info' | 'contact' | 'address' | 'history'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Supplier form state
  const [supName, setSupName] = useState('');
  const [supPic, setSupPic] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCity, setSupCity] = useState('Gresik');
  const [supCategory, setSupCategory] = useState('Semen & Mortar');
  const [supNpwp, setSupNpwp] = useState('');
  const [supTerm, setSupTerm] = useState('30');

  // Supplier List Data matching design mockup
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      code: 'SI-001',
      name: 'PT Semen Indonesia',
      pic: 'Budi Santoso',
      phone: '0812-3456-7890',
      city: 'Gresik',
      category: 'Semen & Mortar',
      status: 'aktif',
      totalPurchases: 125450000,
      trxCount: 12,
      lastTrxDate: '15 Okt 2026',
      lastTrxAmount: 12450000,
      npwp: '01.234.567.8-901.000',
      termDays: 30,
    },
    {
      id: 2,
      code: 'SI-002',
      name: 'Toko Besi Jaya',
      pic: 'Hendra Wijaya',
      phone: '0813-2288-7766',
      city: 'Jakarta',
      category: 'Besi & Baja',
      status: 'aktif',
      totalPurchases: 48260000,
      trxCount: 8,
      lastTrxDate: '12 Okt 2026',
      lastTrxAmount: 8320000,
      npwp: '02.456.789.1-102.000',
      termDays: 14,
    },
    {
      id: 3,
      code: 'SI-003',
      name: 'CV Sumber Bangunan',
      pic: 'Siti Rahma',
      phone: '0812-9988-4455',
      city: 'Bandung',
      category: 'Bata & Hebel',
      status: 'aktif',
      totalPurchases: 32180000,
      trxCount: 6,
      lastTrxDate: '10 Okt 2026',
      lastTrxAmount: 5670000,
      npwp: '03.789.012.3-203.000',
      termDays: 14,
    },
    {
      id: 4,
      code: 'SI-004',
      name: 'Distributor Cat Maju',
      pic: 'Agus Pratama',
      phone: '0819-4555-6677',
      city: 'Surabaya',
      category: 'Cat & Pelapis',
      status: 'aktif',
      totalPurchases: 28450000,
      trxCount: 5,
      lastTrxDate: '08 Okt 2026',
      lastTrxAmount: 18250000,
      npwp: '04.123.456.7-304.000',
      termDays: 30,
    },
    {
      id: 5,
      code: 'SI-005',
      name: 'PT Rucika Indonesia',
      pic: 'Dewi Lestari',
      phone: '0812-7766-3344',
      city: 'Jakarta',
      category: 'Pipa & Sanitasi',
      status: 'aktif',
      totalPurchases: 21780000,
      trxCount: 4,
      lastTrxDate: '05 Okt 2026',
      lastTrxAmount: 7560000,
      npwp: '05.234.567.8-405.000',
      termDays: 30,
    },
    {
      id: 6,
      code: 'SI-006',
      name: 'UD Makmur Jaya',
      pic: 'Yanto',
      phone: '0813-6677-9988',
      city: 'Yogyakarta',
      category: 'Material Lainnya',
      status: 'aktif',
      totalPurchases: 18360000,
      trxCount: 5,
      lastTrxDate: '02 Okt 2026',
      lastTrxAmount: 6780000,
      npwp: '06.345.678.9-506.000',
      termDays: 14,
    },
    {
      id: 7,
      code: 'SI-007',
      name: 'PT Kawan Lama',
      pic: 'Rudi Hartono',
      phone: '0812-5566-2211',
      city: 'Tangerang',
      category: 'Alat & Perkakas',
      status: 'aktif',
      totalPurchases: 16450000,
      trxCount: 3,
      lastTrxDate: '28 Sep 2026',
      lastTrxAmount: 12500000,
      npwp: '07.456.789.0-607.000',
      termDays: 45,
    },
    {
      id: 8,
      code: 'SI-008',
      name: 'CV Mitra Abadi',
      pic: 'Indah Puspita',
      phone: '0813-3344-8899',
      city: 'Semarang',
      category: 'Kayu & Triplek',
      status: 'non-aktif',
      totalPurchases: 9120000,
      trxCount: 2,
      lastTrxDate: '15 Sep 2026',
      lastTrxAmount: 4350000,
      npwp: '08.567.890.1-708.000',
      termDays: 14,
    },
    {
      id: 9,
      code: 'SI-009',
      name: 'Toko Cat Sentosa',
      pic: 'Firman',
      phone: '0812-9988-1234',
      city: 'Malang',
      category: 'Cat & Pelapis',
      status: 'aktif',
      totalPurchases: 6750000,
      trxCount: 2,
      lastTrxDate: '10 Sep 2026',
      lastTrxAmount: 3200000,
      npwp: '09.678.901.2-809.000',
      termDays: 14,
    },
    {
      id: 10,
      code: 'SI-010',
      name: 'PT Krakatau Steel',
      pic: 'Ahmad Fauzi',
      phone: '0813-4455-9900',
      city: 'Cilegon',
      category: 'Besi & Baja',
      status: 'aktif',
      totalPurchases: 4380000,
      trxCount: 1,
      lastTrxDate: '01 Sep 2026',
      lastTrxAmount: 4380000,
      npwp: '10.789.012.3-910.000',
      termDays: 60,
    },
  ]);

  // Handle Add Supplier
  const handleAddSupplierSubmit = (e) => {
    e.preventDefault();
    const newCode = `SI-${String(suppliers.length + 1).padStart(3, '0')}`;
    const newSup = {
      id: suppliers.length + 1,
      code: newCode,
      name: supName,
      pic: supPic,
      phone: supPhone,
      city: supCity,
      category: supCategory,
      status: 'aktif',
      totalPurchases: 0,
      trxCount: 0,
      lastTrxDate: '-',
      lastTrxAmount: 0,
      npwp: supNpwp || 'Belum terdaftar',
      termDays: parseInt(supTerm, 10) || 30,
    };
    setSuppliers([newSup, ...suppliers]);
    setIsAddModalOpen(false);
    setSupName('');
    setSupPic('');
    setSupPhone('');
    alert(`Supplier baru ${supName} berhasil didaftarkan!`);
  };

  // Filtered suppliers
  const filtered = suppliers.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.city.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
    }
    if (cityFilter !== 'all' && s.city !== cityFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Data Supplier
            </h1>
            <p className="text-xs text-[#625D53]">
              Kelola data supplier, kontak, alamat, dan riwayat transaksi pembelian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('Mengimpor data supplier dari file Excel...')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#234536]" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => alert('Mengekspor data supplier ke Excel...')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#234536]" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Supplier</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={Building2}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Supplier"
          value="24 Supplier"
          subtitle="2 Supplier baru (30 hari)"
          trend="9%"
          trendType="up"
        />

        <StatCard
          icon={CheckCircle2}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Supplier Aktif"
          value="22 Supplier"
          subtitle="91% dari total"
          trend="5%"
          trendType="up"
        />

        <StatCard
          icon={Ban}
          iconBg="bg-rose-50 text-[#C62828]"
          title="Supplier Non-aktif"
          value="2 Supplier"
          subtitle="Tidak ada perubahan"
          trend="0%"
          trendType="neutral"
        />

        <StatCard
          icon={DollarSign}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Pembelian"
          value="Rp 287.450.000"
          subtitle="Oktober 2026"
          trend="18%"
          trendType="up"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-card border border-[#DEDCCF] shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama supplier, kontak, atau kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold text-[#252922] focus:outline-none focus:border-[#234536] focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="non-aktif">Non-aktif</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
          >
            <option value="all">Semua Kota</option>
            <option value="Gresik">Gresik</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Bandung">Bandung</option>
            <option value="Surabaya">Surabaya</option>
            <option value="Yogyakarta">Yogyakarta</option>
            <option value="Tangerang">Tangerang</option>
            <option value="Semarang">Semarang</option>
            <option value="Malang">Malang</option>
            <option value="Cilegon">Cilegon</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setCityFilter('all');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#625D53] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Table & Selected Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Area */}
        <div className={`${selectedSupplier ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-3 px-3 w-8">NO</th>
                  <th className="py-3 px-3">NAMA SUPPLIER</th>
                  <th className="py-3 px-3">KONTAK</th>
                  <th className="py-3 px-3">KOTA</th>
                  <th className="py-3 px-3">KATEGORI UTAMA</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-right">TOTAL PEMBELIAN</th>
                  <th className="py-3 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {filtered.map((s, idx) => {
                  const isSelected = selectedSupplier?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSupplier(isSelected ? null : s)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-[#F7F4ED]/50'
                      }`}
                    >
                      <td className="py-3 px-3 text-[#8C877D] font-medium">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center font-black text-red-700 text-xs shrink-0">
                            🏢
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-[#252922]">{s.name}</div>
                            <div className="text-[10px] text-[#8C877D] font-mono">{s.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#252922]">{s.pic}</div>
                        <div className="text-[10px] text-[#8C877D] font-mono">{s.phone}</div>
                      </td>
                      <td className="py-3 px-3 text-[#625D53] font-semibold">{s.city}</td>
                      <td className="py-3 px-3 text-[#625D53] font-medium">{s.category}</td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#252922]">
                        {formatRupiah(s.totalPurchases)}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSupplier(s)}
                            className="p-1 hover:bg-slate-200 rounded text-[#234536] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedSupplier(s)}
                            className="p-1 hover:bg-slate-200 rounded text-[#8C877D] transition"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED]/50 flex items-center justify-between text-xs text-[#625D53]">
            <div>
              Tampilkan <span className="font-bold">{filtered.length}</span> supplier
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&lt;</button>
              <button className="px-2.5 py-1 rounded bg-[#234536] text-white font-bold">1</button>
              <button className="px-2.5 py-1 rounded border border-[#DEDCCF] bg-white font-bold">2</button>
              <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&gt;</button>
            </div>
          </div>
        </div>

        {/* Selected Supplier Detail Drawer */}
        {selectedSupplier && (
          <div className="lg:col-span-4 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-xl shrink-0">
                  🏢
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#252922] leading-tight">
                    {selectedSupplier.name}
                  </h3>
                  <div className="text-[11px] text-[#8C877D] font-mono mt-0.5">
                    {selectedSupplier.code} • {selectedSupplier.category}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={selectedSupplier.status} size="xs" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1 text-[#8C877D] hover:text-[#252922] rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#DEDCCF] gap-1 text-xs">
              {[
                { id: 'info', label: 'Informasi' },
                { id: 'contact', label: 'Kontak' },
                { id: 'address', label: 'Alamat' },
                { id: 'history', label: 'Riwayat Pembelian' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id)}
                  className={`py-1.5 px-2.5 font-bold border-b-2 transition ${
                    drawerTab === t.id
                      ? 'border-[#234536] text-[#234536]'
                      : 'border-transparent text-[#625D53] hover:text-[#252922]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Information Body */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#F7F4ED] rounded-control p-3.5 space-y-2 border border-[#DEDCCF]">
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Nama Supplier</span>
                  <span className="font-bold text-[#252922]">{selectedSupplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Kategori Utama</span>
                  <span className="font-bold text-[#252922]">{selectedSupplier.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">NPWP</span>
                  <span className="font-bold text-[#252922]">{selectedSupplier.npwp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Termin Pembayaran</span>
                  <span className="font-bold text-[#252922]">{selectedSupplier.termDays} Hari</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Mata Uang</span>
                  <span className="font-bold text-[#252922]">Rupiah (IDR)</span>
                </div>
              </div>

              {/* KPI Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-control border border-emerald-200">
                  <div className="text-[10px] text-[#16845B] font-bold">Total Pembelian</div>
                  <div className="text-sm font-black text-[#16845B] mt-0.5">
                    {formatRupiah(selectedSupplier.totalPurchases)}
                  </div>
                  <div className="text-[10px] text-[#625D53] mt-0.5">({selectedSupplier.trxCount} transaksi)</div>
                </div>

                <div className="p-3 bg-amber-50 rounded-control border border-amber-200">
                  <div className="text-[10px] text-[#D97706] font-bold">Transaksi Terakhir</div>
                  <div className="text-xs font-extrabold text-[#D97706] mt-0.5">
                    {selectedSupplier.lastTrxDate}
                  </div>
                  <div className="text-[10px] text-[#625D53] mt-0.5">
                    {formatRupiah(selectedSupplier.lastTrxAmount)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-3 gap-2">
                <button
                  onClick={() => alert('Membuka riwayat PO barang masuk supplier ini...')}
                  className="py-2 px-2 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] text-[#252922] font-bold text-[11px] flex items-center justify-center gap-1 transition"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat</span>
                </button>

                <button
                  onClick={() => alert('Edit data supplier')}
                  className="py-2 px-2 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] text-[#252922] font-bold text-[11px] flex items-center justify-center gap-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSupplier((prev) => ({
                      ...prev,
                      status: prev.status === 'aktif' ? 'non-aktif' : 'aktif',
                    }));
                  }}
                  className="py-2 px-2 rounded-control bg-rose-50 hover:bg-rose-100 text-[#C62828] font-bold text-[11px] flex items-center justify-center gap-1 transition"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{selectedSupplier.status === 'aktif' ? 'Non-aktif' : 'Aktifkan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Tambah Supplier */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#234536]" />
                <h3 className="font-extrabold text-base text-[#252922]">Tambah Supplier Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C877D] hover:text-[#252922] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Nama Perusahaan Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Semen Indonesia"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Nama Kontak PIC *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={supPic}
                    onChange={(e) => setSupPic(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#252922] block mb-1">No. Telepon / WA *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-3456-7890"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Kota Asal</label>
                  <input
                    type="text"
                    value={supCity}
                    onChange={(e) => setSupCity(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Kategori Utama</label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  >
                    <option value="Semen & Mortar">Semen & Mortar</option>
                    <option value="Besi & Baja">Besi & Baja</option>
                    <option value="Bata & Hebel">Bata & Hebel</option>
                    <option value="Cat & Pelapis">Cat & Pelapis</option>
                    <option value="Pipa & Sanitasi">Pipa & Sanitasi</option>
                    <option value="Kayu & Triplek">Kayu & Triplek</option>
                    <option value="Alat & Perkakas">Alat & Perkakas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">NPWP (Opsional)</label>
                  <input
                    type="text"
                    placeholder="01.234.567.8-901.000"
                    value={supNpwp}
                    onChange={(e) => setSupNpwp(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Termin Pembayaran (Hari)</label>
                  <input
                    type="number"
                    value={supTerm}
                    onChange={(e) => setSupTerm(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
