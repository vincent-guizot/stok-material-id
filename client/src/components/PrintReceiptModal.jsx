import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, Receipt, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings.js';
import ReceiptThermal from './print/ReceiptThermal.jsx';
import InvoiceA5 from './print/InvoiceA5.jsx';
import { money } from './print/receiptUtils.js';

const PX_PER_MM = 96 / 25.4;

export default function PrintReceiptModal({ transaction, onClose }) {
  const { settings } = useSettings();
  const [printMode, setPrintMode] = useState('thermal'); // 'thermal' | 'faktur'
  const previewRef = useRef(null);

  if (!transaction) return null;

  const change = parseFloat(transaction.changeAmount) || 0;

  const handlePrint = () => {
    // Ukuran kertas mengikuti jenis dokumen. Margin 0 menghilangkan header/footer browser
    // ("localhost:3000", tanggal, dst); jarak tepi diatur lewat padding di komponen cetak.
    let pageCss;
    if (printMode === 'thermal') {
      const heightMm = Math.ceil((previewRef.current?.scrollHeight || 600) / PX_PER_MM) + 6;
      pageCss = `@page { size: 80mm ${heightMm}mm; margin: 0; }`;
    } else {
      pageCss = '@page { size: A5 portrait; margin: 0; }';
    }

    const style = document.createElement('style');
    style.id = 'print-page-size';
    style.textContent = pageCss;
    document.head.appendChild(style);
    document.body.classList.add('printing-receipt');

    const cleanup = () => {
      document.body.classList.remove('printing-receipt');
      style.remove();
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };

  const Doc = printMode === 'thermal' ? ReceiptThermal : InvoiceA5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
      <div className="bg-white rounded-card max-w-3xl w-full max-h-[92vh] flex flex-col shadow-modal overflow-hidden border border-[#DEDCCF]">
        {/* Header Modal */}
        <div className="p-4 bg-[#234536] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
            <div className="min-w-0">
              <div className="font-extrabold text-base">Transaksi Berhasil Diselesaikan!</div>
              <div className="text-xs text-white/70">No. Nota: {transaction.invoiceNumber}</div>
            </div>
          </div>
          {change > 0 && (
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Kembalian</div>
              <div className="text-2xl font-black text-emerald-200 leading-none">{money(change)}</div>
            </div>
          )}
          <button onClick={onClose} aria-label="Tutup" className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pilihan jenis dokumen */}
        <div className="p-3 bg-[#F7F4ED] border-b border-[#DEDCCF] flex gap-2">
          {[
            ['thermal', Receipt, 'Struk Kasir Thermal (80mm)'],
            ['faktur', FileText, 'Faktur Surat Jalan (A5)'],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setPrintMode(key)}
              className={`flex-1 py-2.5 px-3 rounded-control font-extrabold text-xs flex items-center justify-center gap-2 transition ${
                printMode === key
                  ? 'bg-[#234536] text-white shadow-xs'
                  : 'bg-white text-[#252922] hover:bg-[#ECEAE2] border border-[#DEDCCF]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Pratinjau */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#ECEAE2] flex justify-center">
          <div ref={previewRef} className="bg-white shadow-card border border-[#DEDCCF] h-fit" style={{ maxWidth: '100%' }}>
            <Doc transaction={transaction} settings={settings} />
          </div>
        </div>

        {/* Aksi */}
        <div className="p-3 bg-white border-t border-[#DEDCCF] flex items-center justify-between gap-3">
          <div className="text-xs text-[#625D53]">
            Di jendela cetak pilih printer. Untuk menyimpan PDF, pilih "Simpan sebagai PDF".
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose} className="py-2.5 px-4 rounded-control border border-[#DEDCCF] text-xs font-bold text-[#252922] hover:bg-[#F7F4ED] transition">
              Tutup
            </button>
            <button onClick={handlePrint} className="py-2.5 px-5 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition">
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Salinan khusus cetak, langsung di bawah <body> */}
      {createPortal(
        <div id="print-root">
          <Doc transaction={transaction} settings={settings} />
        </div>,
        document.body,
      )}
    </div>
  );
}
