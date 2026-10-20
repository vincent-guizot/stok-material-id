import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah, formatDateIndo } from '../utils/formatters.js';
import PrintReceiptModal from '../components/PrintReceiptModal.jsx';
import { BarChart3, TrendingUp, DollarSign, AlertTriangle, Receipt, Printer, Users } from 'lucide-react';

export default function ReportsPage() {
  const [selectedTxForPrint, setSelectedTxForPrint] = useState(null);

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await api.get('/reports/summary');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 font-bold">
        Memuat laporan toko bangunan...
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalCashReceived = 0,
    totalDebtGiven = 0,
    totalOutstandingDebt = 0,
    transactionCount = 0,
    lowStockCount = 0,
    lowStockProducts = [],
    topItems = [],
    recentTransactions = [],
  } = summaryData || {};

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-purple-600" />
          <span>Laporan Keuangan & Analitik Toko Bangunan</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Ringkasan omset penjualan, perputaran kasbon mandor, dan analisis material terlaris
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>TOTAL OMSET PENJUALAN</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatRupiah(totalRevenue)}</div>
          <div className="text-xs text-slate-400 mt-1">{transactionCount} Total Transaksi Kasir</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>UANG KAS RIIL DITERIMA</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatRupiah(totalCashReceived)}</div>
          <div className="text-xs text-slate-400 mt-1">Pembayaran Tunai & QRIS/Transfer</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>TOTAL KASBON PROYEK</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{formatRupiah(totalOutstandingDebt)}</div>
          <div className="text-xs text-slate-400 mt-1">Piutang berjalan di mandor</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>MATERIAL HAMPIR HABIS</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockCount} Produk</div>
          <div className="text-xs text-slate-400 mt-1">Perlu segera order ke supplier</div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Material Paling Laris (Fast Moving Items) */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900">🏆 5 Material Paling Laris</h3>
            <span className="text-xs text-slate-400 font-semibold">Berdasarkan Nilai Penjualan</span>
          </div>

          {topItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              Belum ada riwayat transaksi penjualan.
            </div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item.productName}</span>
                    </span>
                    <span className="font-black text-slate-900">{formatRupiah(item.totalGrossSales)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pl-6">
                    <span>Terjual: {item.totalSoldQty} {item.unitName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peringatan Stok Menipis */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900">⚠️ Peringatan Stok Menipis</h3>
            <span className="text-xs text-slate-400 font-semibold">Gudang & Display</span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-emerald-600 text-xs font-bold bg-emerald-50 rounded-2xl border border-emerald-200">
              ✅ Seluruh stok material berada di atas batas aman!
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="p-3 bg-red-50/70 border border-red-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-black text-slate-900 text-xs">{p.name}</div>
                    <div className="text-[10px] text-slate-500">Batas Minimal: {p.minStock} {p.baseUnit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-red-600 text-sm">
                      {p.currentStockBase} {p.baseUnit}
                    </div>
                    <span className="text-[10px] font-bold text-red-700">SEGERA ORDER</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Riwayat Transaksi Penjualan Terakhir */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-black text-base text-slate-900">🧾 5 Transaksi Kasir Terakhir</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">No. Nota</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Pelanggan</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Total Transaksi</th>
                <th className="p-3 text-right">Cetak Ulang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-800">{tx.invoiceNumber}</td>
                  <td className="p-3 text-slate-500">{formatDateIndo(tx.createdAt)}</td>
                  <td className="p-3 font-bold text-slate-800">{tx.customer?.name || 'Pembeli Umum'}</td>
                  <td className="p-3 text-center">
                    {tx.paymentStatus === 'PAID' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">LUNAS</span>
                    )}
                    {tx.paymentStatus === 'PARTIAL' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">DP (TEMPO)</span>
                    )}
                    {tx.paymentStatus === 'UNPAID' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">KASBON</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">{formatRupiah(tx.totalAmount)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedTxForPrint(tx)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 ml-auto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cetak Ulang Nota */}
      {selectedTxForPrint && (
        <PrintReceiptModal
          transaction={selectedTxForPrint}
          onClose={() => setSelectedTxForPrint(null)}
        />
      )}

    </div>
  );
}
