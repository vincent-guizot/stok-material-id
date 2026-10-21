import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import MaterialImage from '../components/MaterialImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
import { exportToCsv } from '../utils/exportCsv.js';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  ShoppingCart,
  Boxes,
  Users,
  DollarSign,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';

export default function ReportsPage({ subTab, setSubTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [localTab, setLocalTab] = useState(urlTab || subTab || 'summary');
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

  const [timeframe, setTimeframe] = useState('month'); // 'day' | 'week' | 'month' | 'year'
  const [reportType, setReportType] = useState('sales');
  const [exportFormat, setExportFormat] = useState('pdf');

  // Toast feedback state
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch report summary
  const { data: summaryData = {} } = useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: async () => {
      const res = await api.get('/reports/summary');
      return res.data.data;
    },
  });

  const subTabs = [
    { id: 'summary', label: 'Ringkasan' },
    { id: 'sales', label: 'Penjualan' },
    { id: 'purchases', label: 'Pembelian' },
    { id: 'debts-report', label: 'Piutang Mandor' },
    { id: 'stocks-report', label: 'Stok Barang' },
    { id: 'profit-loss', label: 'Laba Rugi' },
    { id: 'cash-flow', label: 'Arus Kas' },
  ];

  // Mock bar chart data for 1 Okt - 20 Okt
  const chartBars = [
    { day: '1 Okt', sales: 15, purchase: 11 },
    { day: '3 Okt', sales: 17, purchase: 8 },
    { day: '5 Okt', sales: 12, purchase: 6 },
    { day: '7 Okt', sales: 20, purchase: 9 },
    { day: '9 Okt', sales: 10, purchase: 10 },
    { day: '11 Okt', sales: 22, purchase: 14 },
    { day: '13 Okt', sales: 11, purchase: 7 },
    { day: '15 Okt', sales: 14, purchase: 9 },
    { day: '17 Okt', sales: 17, purchase: 12 },
    { day: '19 Okt', sales: 21, purchase: 13 },
  ];

  // Category sales share
  const categoryShare = [
    { name: 'Semen & Mortar', percent: 28, value: 'Rp 34,8 jt', color: '#234536' },
    { name: 'Bata & Hebel', percent: 18, value: 'Rp 22,4 jt', color: '#5F7147' },
    { name: 'Besi & Baja Ringan', percent: 16, value: 'Rp 19,9 jt', color: '#C6A46A' },
    { name: 'Cat & Pelapis', percent: 12, value: 'Rp 14,9 jt', color: '#D97706' },
    { name: 'Pipa & Sanitasi', percent: 10, value: 'Rp 12,4 jt', color: '#3B6E8F' },
    { name: 'Lainnya', percent: 16, value: 'Rp 20,1 jt', color: '#8C877D' },
  ];

  // Top products
  const topProducts = [
    { name: 'Semen Portland 50kg', sku: 'SMN-PRT-50', qty: '850 Sak', val: 'Rp 57.800.000' },
    { name: 'Bata Ringan Hebel 7.5cm', sku: 'BTA-HBL-75', qty: '620 Pcs', val: 'Rp 5.890.000' },
    { name: 'Besi Beton Polos 8mm', sku: 'BSI-BTN-08', qty: '1.194 Meter', val: 'Rp 6.567.000' },
    { name: 'Cat Tembok Dulux Putih', sku: 'CAT-DLX-WHT', qty: '320 Kaleng', val: 'Rp 12.160.000' },
    { name: 'Pipa PVC AW 3 Inch', sku: 'PPA-PVC-03', qty: '280 Batang', val: 'Rp 15.400.000' },
  ];

  // Recent transactions
  const recentTransactions = [
    { date: '20 Okt 2026, 14:32', invoice: 'INV-20261020-1246', customer: 'Pelanggan Umum', method: 'Tunai', total: 'Rp 933.510', status: 'selesai' },
    { date: '20 Okt 2026, 13:15', invoice: 'INV-20261020-1245', customer: 'Pak Joko (Ruko Sentosa)', method: 'Kasbon', total: 'Rp 1.250.000', status: 'selesai' },
    { date: '20 Okt 2026, 11:08', invoice: 'INV-20261020-1244', customer: 'Pelanggan Umum', method: 'QRIS', total: 'Rp 487.000', status: 'selesai' },
    { date: '19 Okt 2026, 16:21', invoice: 'INV-20261019-1243', customer: 'Pak Tono', method: 'Transfer', total: 'Rp 2.350.000', status: 'selesai' },
    { date: '19 Okt 2026, 14:10', invoice: 'INV-20261019-1242', customer: 'Pelanggan Umum', method: 'Tunai', total: 'Rp 275.000', status: 'selesai' },
  ];

  // Detailed sales records for 'sales' tab
  const salesRecords = [
    { date: '20 Okt 2026, 15:10', invoice: 'INV-20261020-1250', customer: 'Pelanggan Umum', cashier: 'Kasir 1', itemsCount: 4, subtotal: 'Rp 650.000', discount: 'Rp 0', total: 'Rp 650.000', method: 'CASH' },
    { date: '20 Okt 2026, 14:32', invoice: 'INV-20261020-1246', customer: 'Pelanggan Umum', cashier: 'Kasir 1', itemsCount: 6, subtotal: 'Rp 933.510', discount: 'Rp 0', total: 'Rp 933.510', method: 'CASH' },
    { date: '20 Okt 2026, 13:15', invoice: 'INV-20261020-1245', customer: 'Pak Joko (Ruko Sentosa)', cashier: 'Admin', itemsCount: 15, subtotal: 'Rp 1.250.000', discount: 'Rp 0', total: 'Rp 1.250.000', method: 'KASBON' },
    { date: '20 Okt 2026, 11:08', invoice: 'INV-20261020-1244', customer: 'Pelanggan Umum', cashier: 'Kasir 1', itemsCount: 2, subtotal: 'Rp 487.000', discount: 'Rp 0', total: 'Rp 487.000', method: 'QRIS' },
    { date: '19 Okt 2026, 16:21', invoice: 'INV-20261019-1243', customer: 'Pak Tono', cashier: 'Kasir 2', itemsCount: 8, subtotal: 'Rp 2.350.000', discount: 'Rp 50.000', total: 'Rp 2.300.000', method: 'TRANSFER' },
  ];

  // Purchases records for 'purchases' tab
  const purchaseRecords = [
    { date: '20 Okt 2026', poNo: 'PO-20261020-01', supplier: 'PT Semen Indonesia', items: 'Semen Portland 50kg (200 Sak)', total: 'Rp 11.600.000', paymentTerm: 'Tempo 30 Hari', status: 'Lunas' },
    { date: '19 Okt 2026', poNo: 'PO-20261019-02', supplier: 'CV Sumber Bangunan', items: 'Bata Ringan Hebel (400 Pcs)', total: 'Rp 3.800.000', paymentTerm: 'Tunai / COD', status: 'Lunas' },
    { date: '18 Okt 2026', poNo: 'PO-20261018-03', supplier: 'Toko Besi Jaya', items: 'Besi Beton Polos 8mm (500 Btg)', total: 'Rp 27.500.000', paymentTerm: 'Tempo 45 Hari', status: 'Belum Lunas' },
    { date: '17 Okt 2026', poNo: 'PO-20261017-04', supplier: 'PT Rucika Indonesia', items: 'Pipa PVC AW 3 Inch (120 Btg)', total: 'Rp 6.600.000', paymentTerm: 'Tempo 14 Hari', status: 'Lunas' },
  ];

  // Debt reports for 'debts-report' tab
  const debtReports = [
    { mandor: 'Pak Joko (Ruko Sentosa)', phone: '0812-3456-7890', creditLimit: 'Rp 50.000.000', currentDebt: 'Rp 22.000.000', availableLimit: 'Rp 28.000.000', dueDate: '25 Okt 2026', status: 'Aman' },
    { mandor: 'Pak Tono (Perum Graha)', phone: '0813-9876-5432', creditLimit: 'Rp 30.000.000', currentDebt: 'Rp 18.500.000', availableLimit: 'Rp 11.500.000', dueDate: '28 Okt 2026', status: 'Aman' },
    { mandor: 'Pak Haji Wahyu (Kantor BRI)', phone: '0821-5555-1234', creditLimit: 'Rp 75.000.000', currentDebt: 'Rp 73.500.000', availableLimit: 'Rp 1.500.000', dueDate: '18 Okt 2026', status: 'Lewat Jatuh Tempo' },
    { mandor: 'CV Mandiri Karya', phone: '0857-1111-2222', creditLimit: 'Rp 40.000.000', currentDebt: 'Rp 38.450.000', availableLimit: 'Rp 1.550.000', dueDate: '22 Okt 2026', status: 'Mendekati Limit' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Laporan Keuangan
            </h1>
            <p className="text-xs text-[#625D53]">
              Pantau penjualan, pembelian, piutang, dan kondisi laba rugi toko.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#234536]" />
            <span>01 Okt 2026 — 20 Okt 2026</span>
          </div>

          <div className="flex bg-white border border-[#DEDCCF] rounded-control p-0.5 shadow-xs text-xs font-bold">
            {['Hari', 'Minggu', 'Bulan', 'Tahun'].map((t, idx) => {
              const ids = ['day', 'week', 'month', 'year'];
              const isSelected = timeframe === ids[idx];
              return (
                <button
                  key={t}
                  onClick={() => setTimeframe(ids[idx])}
                  className={`px-3 py-1 rounded-md transition ${
                    isSelected
                      ? 'bg-[#234536] text-white shadow-xs'
                      : 'text-[#625D53] hover:text-[#252922]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Stat Cards - Responsive Grid without horizontal overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={ShoppingCart}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Penjualan"
          value={formatRupiah(summaryData.totalRevenue || 124580000)}
          subtitle={`${summaryData.transactionCount || 1852} Transaksi`}
          trend="12%"
          trendType="up"
        />

        <StatCard
          icon={Boxes}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Total Pembelian"
          value="Rp 78.320.000"
          subtitle="24 Transaksi Supplier"
          trend="8%"
          trendType="up"
        />

        <StatCard
          icon={DollarSign}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Laba Kotor"
          value="Rp 46.260.000"
          subtitle="Margin 37,1%"
          trend="18%"
          trendType="up"
        />

        <StatCard
          icon={Users}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Piutang Mandor"
          value={formatRupiah(summaryData.totalOutstandingDebt || 152450000)}
          subtitle={`${summaryData.totalCustomers || 12} Mandor aktif`}
          trend="10%"
          trendType="up"
        />
      </div>

      {/* Subtabs Bar - Fully Interactive */}
      <div className="flex border-b border-[#DEDCCF] gap-2 overflow-x-auto pb-1">
        {subTabs.map((tab) => {
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
      {/* TAB 1: RINGKASAN                                         */}
      {/* ======================================================== */}
      {activeTabKey === 'summary' && (
        <div className="space-y-6">
          {/* Charts Row: Bar Chart & Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Bar Chart Penjualan vs Pembelian */}
            <div className="lg:col-span-8 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#252922]">
                    Grafik Penjualan & Pembelian
                  </h3>
                  <p className="text-xs text-[#625D53]">Perbandingan omzet dan belanja stok material</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#234536]" />
                    <span className="text-[#252922]">Penjualan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#C6A46A]" />
                    <span className="text-[#252922]">Pembelian</span>
                  </div>
                </div>
              </div>

              {/* SVG Bar Chart */}
              <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 px-2 border-b border-l border-[#DEDCCF]">
                {chartBars.map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-48">
                      <div
                        className="w-1/2 bg-[#234536] hover:bg-[#1c372b] rounded-t transition-all relative"
                        style={{ height: `${(bar.sales / 25) * 100}%` }}
                        title={`Penjualan: Rp ${bar.sales} Juta`}
                      />
                      <div
                        className="w-1/2 bg-[#C6A46A] hover:bg-[#ad8b53] rounded-t transition-all relative"
                        style={{ height: `${(bar.purchase / 25) * 100}%` }}
                        title={`Pembelian: Rp ${bar.purchase} Juta`}
                      />
                    </div>
                    <div className="text-[10px] font-bold text-[#8C877D] mt-2 whitespace-nowrap">
                      {bar.day}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Donut Chart Penjualan per Kategori */}
            <div className="lg:col-span-4 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#252922]">
                  Penjualan per Kategori
                </h3>
                <PieChart className="w-4 h-4 text-[#8C877D]" />
              </div>

              <div className="flex items-center justify-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-stone-100"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#234536]"
                      strokeDasharray="28, 100"
                      strokeWidth="6"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#5F7147]"
                      strokeDasharray="18, 100"
                      strokeDashoffset="-28"
                      strokeWidth="6"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#C6A46A]"
                      strokeDasharray="16, 100"
                      strokeDashoffset="-46"
                      strokeWidth="6"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-[10px] text-[#625D53] font-bold">Total Omzet</div>
                    <div className="text-sm font-black text-[#252922]">Rp 124,6 jt</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {categoryShare.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-[#252922]">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8C877D] font-bold">{cat.percent}%</span>
                      <span className="font-bold text-[#252922]">{cat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle 3 Cards: Ringkasan Keuangan, Arus Kas, Metode Pembayaran */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-card border border-[#DEDCCF] p-4 shadow-card space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]">
                <span>⚙️</span>
                <h4 className="font-extrabold text-xs text-[#252922]">Ringkasan Keuangan</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Total Penjualan</span>
                  <span className="font-bold text-[#252922]">Rp 124.580.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Total Pembelian</span>
                  <span className="font-bold text-[#252922]">Rp 78.320.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Laba Kotor</span>
                  <span className="font-bold text-[#252922]">Rp 46.260.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Biaya Operasional</span>
                  <span className="font-bold text-[#252922]">Rp 7.850.000</span>
                </div>
                <div className="pt-2 border-t border-[#DEDCCF] flex justify-between items-center bg-emerald-50/70 p-2 rounded-control">
                  <span className="font-extrabold text-[#16845B]">Laba Bersih</span>
                  <span className="font-black text-sm text-[#16845B]">Rp 38.410.000</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-card border border-[#DEDCCF] p-4 shadow-card space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]">
                <span>💸</span>
                <h4 className="font-extrabold text-xs text-[#252922]">Arus Kas</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Kas Masuk (Penjualan)</span>
                  <span className="font-bold text-[#16845B]">Rp 118.450.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Kas Masuk (Pelunasan Kasbon)</span>
                  <span className="font-bold text-[#16845B]">Rp 42.300.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Kas Keluar (Pembelian)</span>
                  <span className="font-bold text-[#C62828]">-Rp 78.320.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#625D53]">Kas Keluar (Operasional)</span>
                  <span className="font-bold text-[#C62828]">-Rp 7.850.000</span>
                </div>
                <div className="pt-2 border-t border-[#DEDCCF] flex justify-between items-center bg-[#F7F4ED] p-2 rounded-control">
                  <span className="font-extrabold text-[#234536]">Saldo Kas Saat Ini</span>
                  <span className="font-black text-sm text-[#234536]">Rp 74.580.000</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-card border border-[#DEDCCF] p-4 shadow-card space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]">
                <span>💳</span>
                <h4 className="font-extrabold text-xs text-[#252922]">Metode Pembayaran</h4>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Tunai (Cash)', share: '62%', val: 'Rp 77,2 jt', color: 'bg-[#234536]' },
                  { label: 'Transfer Bank / QRIS', share: '25%', val: 'Rp 31,1 jt', color: 'bg-[#C6A46A]' },
                  { label: 'Kasbon Mandor', share: '10%', val: 'Rp 12,5 jt', color: 'bg-[#D97706]' },
                  { label: 'Kartu Debit / EDC', share: '3%', val: 'Rp 3,8 jt', color: 'bg-[#8C877D]' },
                ].map((m, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[11px] mb-1 font-bold">
                      <span className="text-[#252922]">{m.label}</span>
                      <span className="text-[#625D53]">{m.share} ({m.val})</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.color}`} style={{ width: m.share }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section: Transaksi Terbaru & Top 5 Produk Terlaris & Cetak Laporan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
                <h3 className="font-extrabold text-sm text-[#252922]">
                  Transaksi Penjualan Terbaru
                </h3>
                <button
                  onClick={() => handleTabChange('sales')}
                  className="text-xs font-bold text-[#234536] hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">TANGGAL</th>
                      <th className="py-2.5 px-3">NO. TRANSAKSI</th>
                      <th className="py-2.5 px-3">PELANGGAN</th>
                      <th className="py-2.5 px-3">METODE</th>
                      <th className="py-2.5 px-3 text-right">TOTAL</th>
                      <th className="py-2.5 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDCCF]/70">
                    {recentTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                        <td className="py-2.5 px-3 text-[#625D53]">{tx.date}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#234536]">
                          {tx.invoice}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#252922]">{tx.customer}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-[#F7F4ED] border border-[#DEDCCF] font-bold text-[10px]">
                            {tx.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-[#252922]">
                          {tx.total}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge status="selesai" size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DEDCCF]">
                  <div className="flex items-center gap-2">
                    <span>🏆</span>
                    <h3 className="font-extrabold text-sm text-[#252922]">Top 5 Produk Terlaris</h3>
                  </div>
                  <span className="text-xs text-[#8C877D] font-bold">Oktober 2026</span>
                </div>

                <div className="divide-y divide-[#DEDCCF]/70">
                  {topProducts.map((p, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#F7F4ED] text-[#252922] font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <MaterialImage name={p.name} sku={p.sku} className="w-8 h-8 shrink-0" />
                        <div>
                          <div className="font-bold text-[#252922]">{p.name}</div>
                          <div className="text-[10px] text-[#8C877D] font-mono">{p.sku}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-[#234536]">{p.qty}</div>
                        <div className="text-[10px] text-[#8C877D] font-semibold">{p.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]">
                  <Printer className="w-4 h-4 text-[#234536]" />
                  <h3 className="font-extrabold text-sm text-[#252922]">Cetak & Export Laporan</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-[#252922] block mb-1">Jenis Laporan</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold text-[#252922]"
                    >
                      <option value="sales">Laporan Penjualan (Harian / Bulanan)</option>
                      <option value="purchases">Laporan Pembelian & Barang Masuk</option>
                      <option value="debts">Laporan Rekap Piutang Mandor</option>
                      <option value="stock">Laporan Nilai Stok & Opname Material</option>
                      <option value="profit">Laporan Laba Rugi Bersih</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#252922] block mb-1">Format Berkas</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'pdf', label: 'PDF Document' },
                        { id: 'excel', label: 'Excel (XLSX)' },
                        { id: 'print', label: 'Cetak Langsung' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          onClick={() => setExportFormat(fmt.id)}
                          className={`p-2 rounded-control text-center font-bold border transition ${
                            exportFormat === fmt.id
                              ? 'bg-[#234536] text-white border-[#234536]'
                              : 'bg-[#F7F4ED] text-[#252922] border-[#DEDCCF] hover:bg-white'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (exportFormat === 'pdf' || exportFormat === 'print') {
                        window.print();
                      } else {
                        if (reportType === 'sales') {
                          exportToCsv(
                            'laporan-penjualan-toko',
                            ['Waktu', 'No. Invoice', 'Pelanggan', 'Kasir', 'Item', 'Subtotal', 'Total', 'Metode'],
                            salesRecords.map((s) => [s.date, s.invoice, s.customer, s.cashier, s.itemsCount, s.subtotal, s.total, s.method])
                          );
                        } else if (reportType === 'purchases') {
                          exportToCsv(
                            'laporan-pembelian-distributor',
                            ['Tanggal', 'No. PO', 'Supplier', 'Item Material', 'Total Nilai', 'Syarat Bayar', 'Status'],
                            purchaseRecords.map((p) => [p.date, p.poNo, p.supplier, p.items, p.total, p.paymentTerm, p.status])
                          );
                        } else if (reportType === 'debts') {
                          exportToCsv(
                            'laporan-piutang-mandor',
                            ['Mandor', 'No. HP', 'Plafon Kredit', 'Total Kasbon', 'Sisa Plafon', 'Jatuh Tempo', 'Status'],
                            debtReports.map((d) => [d.mandor, d.phone, d.creditLimit, d.currentDebt, d.availableLimit, d.dueDate, d.status])
                          );
                        } else {
                          exportToCsv(
                            'laporan-stok-valuasi',
                            ['Kategori Material', 'Jumlah Item SKU', 'Nilai Valuasi Modal'],
                            valuationByCategory.map((v) => [v.category, v.items, v.value])
                          );
                        }
                        showToast('success', `Laporan ${reportType.toUpperCase()} berhasil diekspor ke Excel (CSV)!`);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Generate & Download Laporan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LAPORAN PENJUALAN                                 */}
      {/* ======================================================== */}
      {activeTabKey === 'sales' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Laporan Rincian Penjualan Material
              </h3>
              <p className="text-xs text-[#625D53]">
                Daftar semua transaksi kasir per invoice, pelanggan, dan metode pembayaran.
              </p>
            </div>
            <button
              onClick={() => {
                exportToCsv(
                  'laporan-penjualan-rincian',
                  ['Waktu', 'No. Invoice', 'Pelanggan', 'Kasir', 'Item', 'Subtotal', 'Total', 'Metode'],
                  salesRecords.map((s) => [s.date, s.invoice, s.customer, s.cashier, s.itemsCount, s.subtotal, s.total, s.method])
                );
                showToast('success', 'Laporan rincian penjualan berhasil diekspor ke Excel (CSV)!');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Laporan Penjualan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">WAKTU</th>
                  <th className="py-2.5 px-3">NO. INVOICE</th>
                  <th className="py-2.5 px-3">PELANGGAN</th>
                  <th className="py-2.5 px-3">KASIR</th>
                  <th className="py-2.5 px-3 text-center">ITEM</th>
                  <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                  <th className="py-2.5 px-3 text-right">TOTAL</th>
                  <th className="py-2.5 px-3 text-center">METODE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {salesRecords.map((s, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 text-[#625D53]">{s.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{s.invoice}</td>
                    <td className="py-3 px-3 font-semibold text-[#252922]">{s.customer}</td>
                    <td className="py-3 px-3 text-[#625D53]">{s.cashier}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#252922]">{s.itemsCount}</td>
                    <td className="py-3 px-3 text-right text-[#625D53]">{s.subtotal}</td>
                    <td className="py-3 px-3 text-right font-black text-[#252922]">{s.total}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-[#252922] font-mono text-[10px] font-bold">
                        {s.method}
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
      {/* TAB 3: LAPORAN PEMBELIAN                                 */}
      {/* ======================================================== */}
      {activeTabKey === 'purchases' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Laporan Belanja & Pembelian ke Supplier
              </h3>
              <p className="text-xs text-[#625D53]">
                Rekapitulasi tagihan faktur belanja semen, pasir, bata, besi, dan pipa dari distributor.
              </p>
            </div>
            <button
              onClick={() => {
                exportToCsv(
                  'rekap-pembelian-supplier',
                  ['Tanggal', 'No. PO', 'Supplier', 'Deskripsi Material', 'Total Nilai', 'Syarat Pembayaran', 'Status'],
                  purchaseRecords.map((p) => [p.date, p.poNo, p.supplier, p.items, p.total, p.paymentTerm, p.status])
                );
                showToast('success', 'Rekap pembelian supplier berhasil diekspor ke Excel (CSV)!');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Rekap Pembelian</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">TANGGAL</th>
                  <th className="py-2.5 px-3">NO. PO</th>
                  <th className="py-2.5 px-3">SUPPLIER</th>
                  <th className="py-2.5 px-3">DESKRIPSI MATERIAL</th>
                  <th className="py-2.5 px-3 text-right">TOTAL NILAI</th>
                  <th className="py-2.5 px-3">SYARAT PEMBAYARAN</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {purchaseRecords.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 text-[#625D53]">{p.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{p.poNo}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{p.supplier}</td>
                    <td className="py-3 px-3 text-[#252922]">{p.items}</td>
                    <td className="py-3 px-3 text-right font-black text-[#252922]">{p.total}</td>
                    <td className="py-3 px-3 text-[#625D53]">{p.paymentTerm}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Lunas' ? 'bg-emerald-100 text-[#16845B]' : 'bg-amber-100 text-[#D97706]'
                        }`}
                      >
                        {p.status}
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
      {/* TAB 4: PIUTANG MANDOR                                   */}
      {/* ======================================================== */}
      {activeTabKey === 'debts-report' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Laporan Rekapitulasi Piutang & Kasbon Mandor
              </h3>
              <p className="text-xs text-[#625D53]">
                Status plafon limit, sisa hutang bon, dan tanggal jatuh tempo mandor.
              </p>
            </div>
            <button
              onClick={() => {
                exportToCsv(
                  'rekap-piutang-mandor',
                  ['Nama Mandor', 'No. Telepon', 'Plafon Limit', 'Total Kasbon', 'Sisa Limit', 'Jatuh Tempo', 'Status'],
                  debtReports.map((d) => [d.mandor, d.phone, d.creditLimit, d.currentDebt, d.availableLimit, d.dueDate, d.status])
                );
                showToast('success', 'Laporan piutang mandor berhasil diekspor ke Excel (CSV)!');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Piutang Mandor</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">NAMA MANDOR / PROYEK</th>
                  <th className="py-2.5 px-3">NO. TELEPON</th>
                  <th className="py-2.5 px-3 text-right">PLAFON LIMIT</th>
                  <th className="py-2.5 px-3 text-right">TOTAL KASBON</th>
                  <th className="py-2.5 px-3 text-right">SISA LIMIT</th>
                  <th className="py-2.5 px-3">JATUH TEMPO</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {debtReports.map((d, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-bold text-[#252922]">{d.mandor}</td>
                    <td className="py-3 px-3 text-[#625D53] font-mono">{d.phone}</td>
                    <td className="py-3 px-3 text-right font-medium text-[#625D53]">{d.creditLimit}</td>
                    <td className="py-3 px-3 text-right font-black text-[#C62828]">{d.currentDebt}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#16845B]">{d.availableLimit}</td>
                    <td className="py-3 px-3 text-[#625D53]">{d.dueDate}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Aman'
                            ? 'bg-emerald-100 text-[#16845B]'
                            : d.status.includes('Lewat')
                            ? 'bg-rose-100 text-[#C62828]'
                            : 'bg-amber-100 text-[#D97706]'
                        }`}
                      >
                        {d.status}
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
      {/* TAB 5: STOK BARANG                                       */}
      {/* ======================================================== */}
      {activeTabKey === 'stocks-report' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Laporan Valuasi & Perputaran Stok Material
              </h3>
              <p className="text-xs text-[#625D53]">
                Nilai aset inventaris riil di toko dan gudang berdasarkan harga modal beli.
              </p>
            </div>
            <button
              onClick={() => {
                exportToCsv(
                  'valuasi-stok-material',
                  ['Kategori Material', 'Jumlah Item SKU', 'Nilai Valuasi Modal'],
                  valuationByCategory.map((v) => [v.category, v.items, v.value])
                );
                showToast('success', 'Laporan valuasi stok berhasil diekspor ke Excel (CSV)!');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Laporan Stok</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-card bg-[#F7F4ED] border border-[#DEDCCF]">
              <div className="text-xs text-[#625D53] font-bold">Total Nilai Valuasi Material</div>
              <div className="text-xl font-black text-[#234536] mt-1">Rp 1.245.800.000</div>
              <div className="text-[11px] text-[#8C877D] mt-0.5">Berdasarkan HPP rata-rata berjalan</div>
            </div>

            <div className="p-4 rounded-card bg-amber-50 border border-amber-200">
              <div className="text-xs text-[#D97706] font-bold">Material Slow-Moving (&gt; 45 Hari)</div>
              <div className="text-xl font-black text-[#D97706] mt-1">14 Produk (Rp 42,5 jt)</div>
              <div className="text-[11px] text-[#8C877D] mt-0.5">Perlu diskon promo atau penataan rak</div>
            </div>

            <div className="p-4 rounded-card bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-[#16845B] font-bold">Perputaran Stok Rata-rata</div>
              <div className="text-xl font-black text-[#16845B] mt-1">18,5 Hari</div>
              <div className="text-[11px] text-[#8C877D] mt-0.5">Perputaran cepat untuk Semen & Besi</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: LABA RUGI                                         */}
      {/* ======================================================== */}
      {activeTabKey === 'profit-loss' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4 max-w-3xl">
          <div className="pb-3 border-b border-[#DEDCCF]">
            <h3 className="font-extrabold text-sm text-[#252922]">
              Laporan Laba Rugi Komprehensif
            </h3>
            <p className="text-xs text-[#625D53]">
              Periode 01 Oktober 2026 — 20 Oktober 2026
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="font-extrabold text-sm text-[#252922] pb-1 border-b border-[#DEDCCF]">
              1. PENDAPATAN OPERASIONAL
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Penjualan Material Bangunan</span>
              <span className="font-bold text-[#252922]">Rp 124.580.000</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Pendapatan Ongkos Angkut / Delivery</span>
              <span className="font-bold text-[#252922]">Rp 3.250.000</span>
            </div>
            <div className="flex justify-between font-bold bg-[#F7F4ED] p-2 rounded">
              <span className="text-[#252922]">TOTAL PENDAPATAN</span>
              <span className="text-[#234536]">Rp 127.830.000</span>
            </div>

            <div className="font-extrabold text-sm text-[#252922] pt-2 pb-1 border-b border-[#DEDCCF]">
              2. HARGA POKOK PENJUALAN (HPP)
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Biaya Pembelian Material Pokok</span>
              <span className="font-bold text-[#C62828]">-Rp 78.320.000</span>
            </div>
            <div className="flex justify-between font-bold bg-[#F7F4ED] p-2 rounded">
              <span className="text-[#252922]">LABA KOTOR (GROSS PROFIT)</span>
              <span className="text-[#16845B] font-black">Rp 49.510.000</span>
            </div>

            <div className="font-extrabold text-sm text-[#252922] pt-2 pb-1 border-b border-[#DEDCCF]">
              3. BIAYA OPERASIONAL TOKO
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Gaji Karyawan Toko & Gudang (3 Org)</span>
              <span className="font-bold text-[#C62828]">-Rp 5.200.000</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Listrik, Internet, & Operasional</span>
              <span className="font-bold text-[#C62828]">-Rp 1.150.000</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">BBM & Perawatan Armada Truk/Pickup</span>
              <span className="font-bold text-[#C62828]">-Rp 1.500.000</span>
            </div>

            <div className="flex justify-between font-black text-sm bg-emerald-50 border border-emerald-200 p-3 rounded-control mt-4">
              <span className="text-[#16845B]">LABA BERSIH BERJALAN (NET PROFIT)</span>
              <span className="text-[#16845B]">Rp 41.660.000</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: ARUS KAS                                          */}
      {/* ======================================================== */}
      {activeTabKey === 'cash-flow' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4 max-w-3xl">
          <div className="pb-3 border-b border-[#DEDCCF]">
            <h3 className="font-extrabold text-sm text-[#252922]">
              Laporan Arus Kas (Cash Flow)
            </h3>
            <p className="text-xs text-[#625D53]">
              Pencatatan kas riil masuk dan keluar dari kasir & rekening operasional toko.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F7F4ED] rounded-control border border-[#DEDCCF] flex justify-between font-bold">
              <span className="text-[#625D53]">Saldo Kas Awal (01 Okt 2026)</span>
              <span className="text-[#252922]">Rp 25.000.000</span>
            </div>

            <div className="font-extrabold text-sm text-[#16845B] pt-2">
              (+) ARUS KAS MASUK
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Penerimaan Tunai & Transfer Kasir</span>
              <span className="font-bold text-[#16845B]">+Rp 118.450.000</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Pelunasan Tagihan Kasbon Mandor</span>
              <span className="font-bold text-[#16845B]">+Rp 42.300.000</span>
            </div>

            <div className="font-extrabold text-sm text-[#C62828] pt-2">
              (-) ARUS KAS KELUAR
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Pembayaran Belanja Stok ke Supplier</span>
              <span className="font-bold text-[#C62828]">-Rp 78.320.000</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-[#625D53]">Biaya Operasional Toko & Armada</span>
              <span className="font-bold text-[#C62828]">-Rp 7.850.000</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-control border border-emerald-200 flex justify-between font-black text-sm mt-3">
              <span className="text-[#234536]">SALDO KAS AKHIR (20 Okt 2026)</span>
              <span className="text-[#16845B]">Rp 99.580.000</span>
            </div>
          </div>
        </div>
      )}
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast({ show: false, type: 'info', message: '' })} />
    </div>
  );
}
