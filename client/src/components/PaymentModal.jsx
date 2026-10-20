import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore.js';
import { formatRupiah } from '../utils/formatters.js';
import api from '../services/api.js';
import confetti from 'canvas-confetti';
import { Banknote, QrCode, FileText, Split, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const { items, selectedCustomer, discount, notes, getTotal, clearCart } = useCartStore();

  const total = getTotal();
  const [paymentType, setPaymentType] = useState('CASH'); // 'CASH', 'TRANSFER', 'DEBT', 'SPLIT'
  const [cashInput, setCashInput] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitDebt, setSplitDebt] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  // Nilai tunai efektif
  const receivedAmount = parseFloat(cashInput) || 0;
  const changeAmount = Math.max(0, receivedAmount - total);

  // Quick cash buttons
  const quickButtons = [
    { label: 'Uang Pas', value: total },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
    { label: '200.000', value: 200000 },
    { label: '500.000', value: 500000 },
    { label: '1.000.000', value: 1000000 },
  ].filter(b => b.value >= total || b.label === 'Uang Pas');

  const handleQuickCash = (val) => {
    setCashInput(val.toString());
  };

  const handleProcessPayment = async () => {
    setErrorMessage(null);

    // Validasi
    if (paymentType === 'CASH') {
      if (receivedAmount < total) {
        setErrorMessage(`Uang pembayaran kurang Rp ${formatRupiah(total - receivedAmount)}. Silakan masukkan uang yang cukup.`);
        return;
      }
    }

    if (paymentType === 'DEBT' || paymentType === 'SPLIT') {
      if (!selectedCustomer) {
        setErrorMessage('Transaksi Kasbon / Tempo wajib memilih nama Mandor / Pelanggan!');
        return;
      }
    }

    let paymentsPayload = [];
    if (paymentType === 'CASH') {
      paymentsPayload = [{ method: 'CASH', amount: total }];
    } else if (paymentType === 'TRANSFER') {
      paymentsPayload = [{ method: 'TRANSFER', amount: total, referenceNo }];
    } else if (paymentType === 'DEBT') {
      paymentsPayload = [{ method: 'DEBT', amount: total }];
    } else if (paymentType === 'SPLIT') {
      const sCash = parseFloat(splitCash) || 0;
      const sDebt = parseFloat(splitDebt) || (total - sCash);
      if (sCash + sDebt < total) {
        setErrorMessage('Total uang tunai + kasbon harus sama dengan total belanja!');
        return;
      }
      paymentsPayload = [
        { method: 'CASH', amount: sCash },
        { method: 'DEBT', amount: sDebt },
      ];
    }

    const payload = {
      customerId: selectedCustomer?.id || null,
      items: items.map(it => ({
        productId: it.productId,
        unitId: it.unitId,
        qty: it.qty,
        unitPrice: it.unitPrice,
      })),
      discount,
      notes,
      paymentMethod: paymentType,
      payments: paymentsPayload,
    };

    setIsSubmitting(true);
    try {
      const res = await api.post('/transactions/checkout', payload);
      
      // Ledakan konfeti mikro yang menyenangkan kasir
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      clearCart();
      onClose();
      if (onSuccess) {
        onSuccess(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Gagal memproses transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="font-black text-lg">PEMBAYARAN NOTA KASIR</div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Price Banner (Super Besar & Jelas) */}
        <div className="bg-blue-600 text-white p-5 text-center shadow-inner">
          <div className="text-xs uppercase font-bold text-blue-200 tracking-wider">TOTAL YANG HARUS DIBAYAR</div>
          <div className="text-3xl sm:text-4xl font-black mt-1 tracking-tight">
            {formatRupiah(total)}
          </div>
          {selectedCustomer && (
            <div className="mt-1 text-xs text-blue-100 font-medium">
              Pelanggan: <span className="font-bold underline">{selectedCustomer.name}</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          
          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-2xl flex items-start gap-2 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 4 Pilihan Metode Pembayaran (Chunky Cards) */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
              Pilih Cara Bayar:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('CASH')}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center gap-1.5 transition ${
                  paymentType === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span>TUNAI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('TRANSFER')}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center gap-1.5 transition ${
                  paymentType === 'TRANSFER'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <QrCode className="w-6 h-6 text-blue-600" />
                <span>TRANSFER / QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('DEBT')}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center gap-1.5 transition ${
                  paymentType === 'DEBT'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <FileText className="w-6 h-6 text-amber-600" />
                <span>KASBON (TEMPO)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType('SPLIT');
                  setSplitCash((total / 2).toString());
                  setSplitDebt((total / 2).toString());
                }}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center gap-1.5 transition ${
                  paymentType === 'SPLIT'
                    ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Split className="w-6 h-6 text-purple-600" />
                <span>SPLIT (DP + BON)</span>
              </button>
            </div>
          </div>

          {/* KONTEN JIKA PILIH TUNAI (CASH) */}
          {paymentType === 'CASH' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">
                  Uang Diterima dari Pembeli:
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                  <input
                    type="number"
                    autoFocus
                    placeholder="0"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 text-2xl font-black rounded-2xl border-2 border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Tombol Pecahan Uang Cepat */}
              <div className="flex flex-wrap gap-1.5">
                {quickButtons.map((qb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickCash(qb.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition"
                  >
                    {qb.label}
                  </button>
                ))}
              </div>

              {/* KOTAK KEMBALIAN BESAR ANTI-SALAH HITUNG */}
              {receivedAmount > 0 && (
                <div className={`p-4 rounded-2xl text-center border-2 transition ${
                  receivedAmount >= total
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {receivedAmount >= total ? 'KEMBALIAN UNTUK PEMBELI:' : 'UANG MASIH KURANG:'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black mt-0.5">
                    {receivedAmount >= total ? formatRupiah(changeAmount) : formatRupiah(total - receivedAmount)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KONTEN JIKA PILIH TRANSFER / QRIS */}
          {paymentType === 'TRANSFER' && (
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
                <div className="font-bold mb-1">Pemberitahuan Transfer / QRIS:</div>
                Pastikan uang telah masuk ke rekening BCA / Mandiri / QRIS Toko Bangunan sebelum menekan tombol Selesai.
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">
                  Nomor Referensi / Nama Pengirim (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ref-123456 / Pak Budi"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>
            </div>
          )}

          {/* KONTEN JIKA PILIH KASBON (TEMPO) */}
          {paymentType === 'DEBT' && (
            <div className="space-y-2 pt-2">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900">
                <div className="font-black text-sm mb-1">Pencatatan Bon Proyek (Tempo):</div>
                Seluruh nilai nota <strong>{formatRupiah(total)}</strong> akan dimasukkan ke saldo piutang mandor{' '}
                <strong>{selectedCustomer ? selectedCustomer.name : '(Pilih Pelanggan Dulu di Kasir)'}</strong>.
              </div>
            </div>
          )}

          {/* KONTEN JIKA PILIH SPLIT PAYMENT */}
          {paymentType === 'SPLIT' && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Bayar Tunai Sekarang (DP):
                  </label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSplitCash(v);
                      const sVal = parseFloat(v) || 0;
                      setSplitDebt(Math.max(0, total - sVal).toString());
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Masuk Kasbon (Tempo):
                  </label>
                  <input
                    type="number"
                    value={splitDebt}
                    onChange={(e) => setSplitDebt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-red-600"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Tombol Eksekusi Jumbo di Bawah */}
        <div className="p-5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleProcessPayment}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-lg shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <CheckCircle className="w-6 h-6" />
            <span>{isSubmitting ? 'MEMPROSES NOTA...' : 'SELESAIKAN & SIMPAN NOTA (F2)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
