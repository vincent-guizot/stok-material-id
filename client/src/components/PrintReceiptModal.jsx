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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
      <div className="bg-white rounded-card max-w-2xl w-full max-h-[90vh] flex flex-col shadow-modal overflow-hidden border border-[#DEDCCF] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-4 bg-[#234536] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-extrabold text-sm sm:text-base">Transaksi Berhasil Diselesaikan!</div>
              <div className="text-xs text-white/70">No. Nota: {transaction.invoiceNumber}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Thermal vs Faktur A5) */}
        <div className="p-3 bg-[#F7F4ED] border-b border-[#DEDCCF] flex gap-2">
          <button
            onClick={() => setPrintMode('thermal')}
            className={`flex-1 py-2 px-3 rounded-control font-extrabold text-xs flex items-center justify-center gap-2 transition ${
              printMode === 'thermal'
                ? 'bg-[#234536] text-white shadow-xs'
                : 'bg-white text-[#252922] hover:bg-[#ECEAE2] border border-[#DEDCCF]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Struk Kasir Thermal (80mm)</span>
          </button>
          <button
            onClick={() => setPrintMode('faktur')}
            className={`flex-1 py-2 px-3 rounded-control font-extrabold text-xs flex items-center justify-center gap-2 transition ${
              printMode === 'faktur'
                ? 'bg-[#234536] text-white shadow-xs'
                : 'bg-white text-[#252922] hover:bg-[#ECEAE2] border border-[#DEDCCF]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Faktur Surat Jalan (Ukuran A5)</span>
          </button>
        </div>

        {/* Live Preview Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#ECEAE2] flex justify-center">
          
          <div id="printable-receipt" className="bg-white text-[#252922] shadow-card border border-[#DEDCCF]">
            
            {/* TAMPILAN 1: STRUK THERMAL 80MM (matching invoice kasir.pdf) */}
            {printMode === 'thermal' && (
              <div className="w-[300px] sm:w-[320px] p-4 text-[12px] font-mono leading-relaxed">
                <div className="text-center pb-2 border-b border-dashed border-[#8C877D]">
                  <div className="font-black text-base uppercase">TOKO SENTOSA</div>
                  <div className="font-bold text-[11px]">STOKMATERIAL.ID — TOKO BANGUNAN & MATERIAL</div>
                  <div className="text-[10px] text-[#625D53]">Jl. Raya Gresik No. 123 | Telp. 031-1234567</div>
                </div>

                <div className="py-2 border-b border-dashed border-[#8C877D] text-[11px] space-y-0.5">
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
                    <span>{transaction.cashier?.name || 'Kasir Toko'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-bold">{transaction.customer?.name || transaction.customerName || 'Pembeli Umum'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-2 border-b border-dashed border-[#8C877D] space-y-2">
                  {transaction.items?.map((it, idx) => (
                    <div key={idx}>
                      <div className="font-bold">{it.productName}</div>
                      <div className="flex justify-between text-[#625D53]">
                        <span>{it.qty} {it.unitName} x {formatRupiah(it.unitPrice)}</span>
                        <span className="font-bold text-[#252922]">{formatRupiah(it.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Bayar */}
                <div className="py-2 border-b border-dashed border-[#8C877D] text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(transaction.subtotalAmount || transaction.totalAmount)}</span>
                  </div>
                  {transaction.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Diskon ({transaction.discountPercent}%):</span>
                      <span>-{formatRupiah(transaction.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-[#8C877D]">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(transaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[#625D53] pt-1">
                    <span>Dibayar:</span>
                    <span>{formatRupiah(transaction.paidAmount || transaction.cashGiven || transaction.totalAmount)}</span>
                  </div>
                  {(transaction.change || transaction.changeAmount) > 0 && (
                    <div className="flex justify-between font-bold text-[#16845B]">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(transaction.change || transaction.changeAmount)}</span>
                    </div>
                  )}
                  {transaction.debtAmount > 0 && (
                    <div className="flex justify-between font-bold text-amber-700">
                      <span>Kasbon (Hutang):</span>
                      <span>{formatRupiah(transaction.debtAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-3 text-[10px] text-[#625D53] space-y-1">
                  <div>Terima kasih telah berbelanja di Toko Sentosa</div>
                  <div>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
                  <div className="text-[9px] text-[#8C877D]">Powered by StokMaterial.id</div>
                </div>
              </div>
            )}

            {/* TAMPILAN 2: FAKTUR SURAT JALAN A5 (matching faktur jalan.pdf) */}
            {printMode === 'faktur' && (
              <div className="w-[500px] sm:w-[540px] p-6 text-xs font-sans leading-normal">
                {/* Header Faktur */}
                <div className="flex justify-between items-start border-b-2 border-[#252922] pb-3">
                  <div>
                    <div className="font-black text-lg text-[#234536] tracking-tight">TOKO SENTOSA</div>
                    <div className="font-bold text-xs">MATERIAL BANGUNAN & BETON</div>
                    <div className="text-[10px] text-[#625D53]">Jl. Raya Gresik No. 123, Telp: 031-1234567</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm uppercase px-2 py-0.5 bg-[#234536] text-white inline-block rounded">
                      SURAT JALAN & FAKTUR
                    </div>
                    <div className="text-xs font-mono font-bold mt-1">{transaction.invoiceNumber}</div>
                    <div className="text-[10px] text-[#625D53]">Tgl: {formatDateOnly(transaction.createdAt || transaction.transactionDate)}</div>
                  </div>
                </div>

                {/* Info Pengiriman */}
                <div className="grid grid-cols-2 gap-4 my-3 p-2 bg-[#F7F4ED] rounded text-[11px]">
                  <div>
                    <div className="text-[#8C877D] font-bold">KIRIM KEPADA:</div>
                    <div className="font-bold text-[#252922]">{transaction.customer?.name || transaction.customerName || 'Pembeli Umum'}</div>
                    <div className="text-[#625D53]">{transaction.customer?.address || 'Ambil Sendiri di Toko'}</div>
                    <div className="text-[#625D53]">Telp: {transaction.customer?.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[#8C877D] font-bold">INFO OPERASIONAL:</div>
                    <div>Kasir: {transaction.cashier?.name || 'Kasir Toko'}</div>
                    <div>Metode: {transaction.paymentMethod === 'debt' ? 'Kasbon Mandor' : 'Tunai / Transfer'}</div>
                    {transaction.notes && <div>Catatan: {transaction.notes}</div>}
                  </div>
                </div>

                {/* Table Barang */}
                <table className="w-full text-left border-collapse my-3">
                  <thead>
                    <tr className="border-y border-[#252922] text-[11px] font-bold bg-[#F7F4ED]">
                      <th className="py-1 px-1 w-8">No</th>
                      <th className="py-1 px-1">Deskripsi Material</th>
                      <th className="py-1 px-1 text-center w-20">Kuantitas</th>
                      <th className="py-1 px-1 text-center w-20">Satuan</th>
                      <th className="py-1 px-1 text-right w-24">Harga</th>
                      <th className="py-1 px-1 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDCCF] text-[11px]">
                    {transaction.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-1">{idx + 1}</td>
                        <td className="py-1.5 px-1 font-bold">{it.productName}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-sm">{it.qty}</td>
                        <td className="py-1.5 px-1 text-center">{it.unitName}</td>
                        <td className="py-1.5 px-1 text-right">{formatRupiah(it.unitPrice)}</td>
                        <td className="py-1.5 px-1 text-right font-bold">{formatRupiah(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#252922] font-black text-xs">
                      <td colSpan={5} className="py-2 text-right">TOTAL TRANSAKSI:</td>
                      <td className="py-2 px-1 text-right">{formatRupiah(transaction.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Kolom Tanda Tangan */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] mt-6 pt-2">
                  <div>
                    <div className="text-[#625D53]">Penerima / Proyek</div>
                    <div className="h-14"></div>
                    <div className="font-bold border-t border-[#8C877D] mx-4 pt-0.5">(........................)</div>
                  </div>
                  <div>
                    <div className="text-[#625D53]">Sopir / Pengirim</div>
                    <div className="h-14"></div>
                    <div className="font-bold border-t border-[#8C877D] mx-4 pt-0.5">(........................)</div>
                  </div>
                  <div>
                    <div className="text-[#625D53]">Hormat Kami (Toko)</div>
                    <div className="h-14"></div>
                    <div className="font-bold border-t border-[#8C877D] mx-4 pt-0.5">Toko Sentosa</div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-3 bg-white border-t border-[#DEDCCF] flex items-center justify-between">
          <div className="text-xs text-[#625D53]">
            Format cetak langsung responsif untuk printer kasir thermal dan faktur jalan.
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-control border border-[#DEDCCF] text-xs font-bold text-[#252922] hover:bg-[#F7F4ED] transition"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="py-2 px-5 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
