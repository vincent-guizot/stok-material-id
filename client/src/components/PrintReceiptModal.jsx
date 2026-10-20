import React, { useState } from 'react';
import { formatRupiah, formatDateIndo, formatDateOnly } from '../utils/formatters.js';
import { Printer, X, FileText, Receipt, CheckCircle2 } from 'lucide-react';

export default function PrintReceiptModal({ transaction, onClose }) {
  const [printMode, setPrintMode] = useState('thermal'); // 'thermal' atau 'faktur'

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="font-bold text-base">Transaksi Berhasil Disimpan!</div>
              <div className="text-xs text-slate-400">Nota: {transaction.invoiceNumber}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Thermal vs Faktur A5) */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setPrintMode('thermal')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              printMode === 'thermal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Struk Kasir Thermal (80mm)</span>
          </button>
          <button
            onClick={() => setPrintMode('faktur')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              printMode === 'faktur'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Faktur Surat Jalan (Ukuran A5)</span>
          </button>
        </div>

        {/* Live Preview Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 flex justify-center">
          
          <div id="printable-receipt" className="bg-white text-slate-900 shadow-md">
            
            {/* TAMPILAN 1: STRUK THERMAL 80MM */}
            {printMode === 'thermal' && (
              <div className="w-[300px] sm:w-[320px] p-4 text-[12px] font-mono leading-relaxed">
                <div className="text-center pb-2 border-b border-dashed border-slate-400">
                  <div className="font-black text-base uppercase">STOKMATERIAL.ID</div>
                  <div>TOKO BAHAN BANGUNAN & DEPO</div>
                  <div className="text-[10px] text-slate-600">Jl. Raya Konstruksi No. 123 | 0812-3456-7890</div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-bold">{transaction.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{formatDateIndo(transaction.createdAt || transaction.transactionDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{transaction.cashier?.name || 'Kasir 1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-bold">{transaction.customer?.name || 'Pembeli Umum'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-2 border-b border-dashed border-slate-400 space-y-2">
                  {transaction.items?.map((it, idx) => (
                    <div key={idx}>
                      <div className="font-bold">{it.productName}</div>
                      <div className="flex justify-between text-slate-600">
                        <span>{it.qty} {it.unitName} x {formatRupiah(it.unitPrice)}</span>
                        <span className="font-bold text-slate-900">{formatRupiah(it.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-2 border-b border-dashed border-slate-400 text-right space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(transaction.subtotal)}</span>
                  </div>
                  {parseFloat(transaction.discount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(transaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Dibayar Tunai/Non-Tunai:</span>
                    <span>{formatRupiah(transaction.paidAmount)}</span>
                  </div>
                  {parseFloat(transaction.debtAmount) > 0 && (
                    <div className="flex justify-between text-red-700 font-bold">
                      <span>MASUK KASBON (TEMPO):</span>
                      <span>{formatRupiah(transaction.debtAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
                  <div>Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian.</div>
                  <div className="font-bold">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</div>
                </div>
              </div>
            )}

            {/* TAMPILAN 2: FAKTUR SURAT JALAN A5 (UNTUK ARMADA TRUK / MANDOR) */}
            {printMode === 'faktur' && (
              <div className="w-[480px] sm:w-[540px] p-6 text-[12px] font-sans">
                {/* Header Kop Surat */}
                <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">TB. STOKMATERIAL.ID</h2>
                    <p className="text-xs text-slate-600">Pusat Suplai Pasir, Semen, Besi, Cat, & Alat Tukang</p>
                    <p className="text-xs text-slate-500">Jl. Raya Konstruksi Kav. 123 | Telp/WA: 0812-3456-7890</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-sm tracking-wider uppercase rounded">
                      SURAT JALAN & FAKTUR
                    </span>
                    <div className="font-mono font-bold text-sm text-slate-800 mt-1">{transaction.invoiceNumber}</div>
                    <div className="text-xs text-slate-600">{formatDateOnly(transaction.createdAt || transaction.transactionDate)}</div>
                  </div>
                </div>

                {/* Customer & Delivery Info */}
                <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300 text-xs">
                  <div>
                    <div className="text-slate-500 uppercase font-bold text-[10px]">Tujuan Pengiriman / Mandor:</div>
                    <div className="font-black text-sm text-slate-900">{transaction.customer?.name || 'Pelanggan Umum'}</div>
                    <div className="text-slate-600">{transaction.customer?.phone || '-'}</div>
                    <div className="text-slate-600">{transaction.customer?.address || 'Ambil Sendiri di Toko'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500 uppercase font-bold text-[10px]">Status Pembayaran:</div>
                    <div className="font-bold text-slate-900">
                      {transaction.paymentStatus === 'PAID' && <span className="text-emerald-700">LUNAS DI KASIR</span>}
                      {transaction.paymentStatus === 'PARTIAL' && <span className="text-amber-700">DP SEBAGIAN (TEMPO)</span>}
                      {transaction.paymentStatus === 'UNPAID' && <span className="text-red-700">KASBON / TEMPO PENUH</span>}
                    </div>
                    {transaction.dueDate && (
                      <div className="text-xs text-red-600 font-semibold mt-1">
                        Jatuh Tempo: {formatDateOnly(transaction.dueDate)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left my-4 text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                      <th className="p-2 border-r border-slate-300">Nama Material Bahan Bangunan</th>
                      <th className="p-2 border-r border-slate-300 text-center w-24">Banyaknya</th>
                      <th className="p-2 border-r border-slate-300 text-right w-24">Harga Satuan</th>
                      <th className="p-2 text-right w-28">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transaction.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                        <td className="p-2 font-semibold border-r border-slate-200">{it.productName}</td>
                        <td className="p-2 text-center font-bold border-r border-slate-200">
                          {it.qty} {it.unitName}
                        </td>
                        <td className="p-2 text-right border-r border-slate-200">{formatRupiah(it.unitPrice)}</td>
                        <td className="p-2 text-right font-bold">{formatRupiah(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 font-bold bg-slate-50">
                    <tr>
                      <td colSpan={4} className="p-2 text-right uppercase">Total Nilai Barang:</td>
                      <td className="p-2 text-right font-black text-sm">{formatRupiah(transaction.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* 3 Kotak Tanda Tangan Resmi Toko Bangunan */}
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-300 text-center text-xs">
                  <div>
                    <div className="font-semibold text-slate-700">Hormat Kami,</div>
                    <div className="text-[10px] text-slate-500 mb-12">Kasir / Toko</div>
                    <div className="font-bold border-t border-slate-400 mx-4 pt-1">
                      ( {transaction.cashier?.name || 'Kasir'} )
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">Pengemudi / Armada,</div>
                    <div className="text-[10px] text-slate-500 mb-12">Sopir Truk / Pikap</div>
                    <div className="font-bold border-t border-slate-400 mx-4 pt-1">( ............................ )</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">Tanda Terima,</div>
                    <div className="text-[10px] text-slate-500 mb-12">Mandor / Penerima Proyek</div>
                    <div className="font-bold border-t border-slate-400 mx-4 pt-1">
                      ( {transaction.customer?.name ? transaction.customer.name.split(' ')[0] : '............................'} )
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Tutup (Selesai)
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <Printer className="w-5 h-5" />
            <span>CETAK {printMode === 'thermal' ? 'STRUK KASIR' : 'FAKTUR SURAT JALAN'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
