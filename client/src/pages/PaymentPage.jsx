import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useCartStore } from '../store/useCartStore.js';
import { formatRupiah } from '../utils/formatters.js';
import MaterialImage from '../components/MaterialImage.jsx';
import PrintReceiptModal from '../components/PrintReceiptModal.jsx';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  Users,
  Printer,
  Trash2,
  Plus,
  Minus,
  Info,
} from 'lucide-react';

export default function PaymentPage({ onBackToPOS }) {
  const navigate = useNavigate();
  const handleBackToPOS = onBackToPOS || (() => navigate('/pos'));
  const queryClient = useQueryClient();
  const {
    items,
    selectedCustomer,
    discount,
    notes,
    updateQty,
    removeItem,
    clearCart,
    getSubtotal,
    getItemCount,
    setCustomer,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'transfer' | 'card' | 'kasbon'
  const [cashGiven, setCashGiven] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [localError, setLocalError] = useState(null);
  const [successTransaction, setSuccessTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = Math.round(subtotal * (discount / 100));
  const taxAmount = Math.round((subtotal - discountAmount) * 0.11);
  const total = subtotal - discountAmount + taxAmount;

  // Generate invoice number preview
  const [invoiceNumber] = useState(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${rand}`;
  });

  const numCashGiven = parseFloat(cashGiven) || 0;
  const changeAmount = Math.max(0, numCashGiven - total);
  const isCashSufficient = paymentMethod !== 'cash' || numCashGiven >= total;

  // Customers query for Kasbon
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    },
  });

  // Calculate kasbon limit status
  const currentMandor = customers.find((c) => c.id === selectedCustomer?.id);
  const mandorCreditLimit = parseFloat(currentMandor?.creditLimit) || 0;
  const mandorCurrentDebt = parseFloat(currentMandor?.currentDebt) || 0;
  const mandorRemainingLimit = Math.max(0, mandorCreditLimit - mandorCurrentDebt);
  const isKasbonExceeded = paymentMethod === 'kasbon' && total > mandorRemainingLimit;

  // Handle Submit Checkout
  const handleCheckout = useCallback(async () => {
    if (items.length === 0) return;
    if (isSubmitting) return;

    setLocalError(null);

    if (paymentMethod === 'cash' && numCashGiven < total) {
      setLocalError(`Uang diterima kurang Rp ${(total - numCashGiven).toLocaleString('id-ID')}`);
      return;
    }

    if (paymentMethod === 'kasbon') {
      if (!selectedCustomer) {
        setLocalError('Wajib memilih Mandor / Pelanggan untuk metode Kasbon.');
        return;
      }
      if (isKasbonExceeded) {
        setLocalError(`Plafon kasbon tidak mencukupi. Sisa limit: Rp ${mandorRemainingLimit.toLocaleString('id-ID')}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        discountPercent: discount,
        notes: notes || '',
        items: items.map((item) => ({
          productId: item.productId,
          unitId: item.unitId,
          qty: item.qty,
        })),
        paymentMethod: (paymentMethod === 'kasbon' ? 'DEBT' : paymentMethod).toUpperCase(),
        payments: [
          {
            method: (paymentMethod === 'kasbon' ? 'DEBT' : paymentMethod).toUpperCase(),
            paymentMethod: (paymentMethod === 'kasbon' ? 'DEBT' : paymentMethod).toUpperCase(),
            amount: total,
            referenceNo: referenceNumber || null,
            referenceNumber: referenceNumber || null,
          },
        ],
      };

      const res = await api.post('/transactions', payload);
      const transactionData = res.data.data;

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSuccessTransaction({
        ...transactionData,
        cashGiven: numCashGiven,
        change: changeAmount,
        customerName: selectedCustomer ? selectedCustomer.name : 'Pembeli Umum',
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });

      clearCart();
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Gagal menyelesaikan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    items,
    isSubmitting,
    paymentMethod,
    numCashGiven,
    total,
    selectedCustomer,
    isKasbonExceeded,
    mandorRemainingLimit,
    discount,
    notes,
    referenceNumber,
    changeAmount,
    queryClient,
    clearCart,
  ]);

  // Keyboard shortcut F5 to submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F10' || e.key === 'F5' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCheckout]);

  if (items.length === 0 && !successTransaction) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-16 bg-white rounded-card border border-[#DEDCCF] shadow-card">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-2xl mb-3">
          🛒
        </div>
        <h2 className="text-lg font-bold text-[#252922]">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-[#625D53] mt-1 mb-5">
          Silakan pilih barang material terlebih dahulu dari katalog kasir.
        </p>
        <button
          onClick={handleBackToPOS}
          className="w-full py-2.5 px-4 rounded-control bg-[#234536] text-white text-xs font-bold hover:bg-[#1c372b] transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Kasir Penjualan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Pembayaran
            </h1>
            <p className="text-xs text-[#625D53]">
              Pilih metode pembayaran, pastikan jumlah sesuai, lalu selesaikan transaksi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white border border-[#DEDCCF] rounded-control text-xs font-mono font-bold text-[#252922] shadow-xs">
            <span className="text-[#8C877D] font-normal mr-1">No. Transaksi:</span>
            {invoiceNumber}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] hover:bg-[#F7F4ED] transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#234536]" />
            <span>Cetak Nota</span>
          </button>
        </div>
      </div>

      {localError && (
        <div className="p-3.5 rounded-control bg-red-50 border border-red-200 text-xs font-bold text-[#C62828] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {/* Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Detail Transaksi & Metode Pembayaran */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detail Transaksi Card */}
          <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF] mb-4">
              <div className="text-sm font-extrabold text-[#252922] flex items-center gap-2">
                <span>🛒</span>
                <span>Detail Transaksi</span>
              </div>
              <span className="text-xs font-semibold text-[#625D53]">
                {items.length} Produk ({getItemCount()} Item)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                    <th className="pb-2.5 w-8">No</th>
                    <th className="pb-2.5">Produk</th>
                    <th className="pb-2.5 text-center">Satuan</th>
                    <th className="pb-2.5 text-right">Harga</th>
                    <th className="pb-2.5 text-center">Jumlah</th>
                    <th className="pb-2.5 text-right">Subtotal</th>
                    <th className="pb-2.5 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEDCCF]/60">
                  {items.map((item, idx) => (
                    <tr key={`${item.productId}-${item.unitId}`} className="hover:bg-[#F7F4ED]/40 transition">
                      <td className="py-3 text-[#8C877D] font-medium">{idx + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <MaterialImage name={item.productName} sku={item.sku} className="w-8 h-8 shrink-0" />
                          <div>
                            <div className="font-bold text-[#252922]">{item.productName}</div>
                            <div className="text-[10px] text-[#8C877D] font-mono">{item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#F7F4ED] border border-[#DEDCCF] font-semibold text-[11px] text-[#252922]">
                          {item.unitName}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-[#252922]">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => updateQty(item.productId, item.unitId, item.qty - 1)}
                            className="w-6 h-6 rounded bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] flex items-center justify-center text-[#252922] font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.productId, item.unitId, item.qty + 1)}
                            className="w-6 h-6 rounded bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] flex items-center justify-center text-[#252922] font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-right font-extrabold text-[#234536]">
                        {formatRupiah(item.subtotal)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => removeItem(item.productId, item.unitId)}
                          className="text-[#C62828] hover:bg-red-50 p-1 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-[#DEDCCF] mt-4 flex items-center justify-between">
              <button
                onClick={handleBackToPOS}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Produk</span>
              </button>

              <button
                onClick={clearCart}
                className="flex items-center gap-1.5 text-xs font-bold text-[#C62828] hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            </div>
          </div>

          {/* Metode Pembayaran Card */}
          <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#252922] flex items-center gap-2">
                  <span>💳</span>
                  <span>Metode Pembayaran</span>
                </h3>
                <p className="text-xs text-[#625D53]">Pilih metode pembayaran yang digunakan pelanggan.</p>
              </div>
            </div>

            {/* 4 Method Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'cash', label: 'Tunai', desc: 'Bayar dengan uang tunai', icon: Banknote },
                { id: 'transfer', label: 'Transfer / QRIS', desc: 'Pembayaran digital', icon: QrCode },
                { id: 'card', label: 'Kartu', desc: 'Debit / Kredit', icon: CreditCard },
                { id: 'kasbon', label: 'Kasbon Mandor', desc: 'Piutang mandor', icon: Users },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3.5 rounded-card text-left border transition relative flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'bg-[#234536] text-white border-[#234536] shadow-sm'
                        : 'bg-white hover:bg-[#F7F4ED] border-[#DEDCCF] text-[#252922]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-white text-[#234536] flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#234536]'}`} />
                    <div>
                      <div className="text-xs font-extrabold">{m.label}</div>
                      <div className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-white/80' : 'text-[#625D53]'}`}>
                        {m.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-control bg-amber-50/60 border border-amber-200/80 flex items-start gap-2 text-xs text-[#625D53]">
              <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                {paymentMethod === 'cash'
                  ? 'Pembayaran tunai akan otomatis menghitung kembalian.'
                  : paymentMethod === 'kasbon'
                  ? 'Kasbon akan menambah saldo hutang mandor dan memvalidasi batas plafon kredit toko.'
                  : 'Pastikan bukti transfer/slip EDC telah diverifikasi sebelum menyelesaikan transaksi.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Ringkasan & Form Input Bayar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ringkasan Pembayaran */}
          <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
            <h3 className="text-sm font-extrabold text-[#252922] pb-3 border-b border-[#DEDCCF] flex items-center gap-2">
              <span>🧮</span>
              <span>Ringkasan Pembayaran</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#625D53]">
                <span>Subtotal</span>
                <span className="font-bold text-[#252922]">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#625D53]">
                <span>Diskon ({discount}%)</span>
                <span className="font-bold text-[#C62828]">- {formatRupiah(discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-[#625D53]">
                <span>Pajak (PPN 11%)</span>
                <span className="font-bold text-[#252922]">{formatRupiah(taxAmount)}</span>
              </div>

              <div className="pt-3 border-t border-[#DEDCCF] flex items-baseline justify-between">
                <div>
                  <div className="text-xs font-extrabold text-[#252922] uppercase tracking-wider">
                    Total Belanja
                  </div>
                  <div className="text-[10px] text-[#625D53]">Sudah termasuk PPN 11%</div>
                </div>
                <div className="text-2xl font-black text-[#234536] tracking-tight">
                  {formatRupiah(total)}
                </div>
              </div>
            </div>

            {/* Payment Method Specific Inputs */}
            {paymentMethod === 'cash' && (
              <div className="pt-4 border-t border-[#DEDCCF] space-y-3">
                <div className="text-xs font-bold text-[#252922]">Pembayaran Tunai</div>
                <div>
                  <label className="text-[11px] font-semibold text-[#625D53] block mb-1">
                    Uang Diterima
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#8C877D]">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2.5 text-base font-extrabold text-[#252922] bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:outline-none focus:border-[#234536] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Uang Pas', value: total },
                    { label: 'Rp 50.000', value: 50000 },
                    { label: 'Rp 100.000', value: 100000 },
                    { label: 'Rp 500.000', value: 500000 },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCashGiven(btn.value.toString())}
                      className="py-1 px-1.5 text-center text-[10px] font-bold bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded text-[#252922] transition"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Kembalian Display Box */}
                <div className="p-3 rounded-control bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#16845B]">Kembalian</span>
                  <span className="text-lg font-black text-[#16845B]">
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'kasbon' && (
              <div className="pt-4 border-t border-[#DEDCCF] space-y-3">
                <div className="text-xs font-bold text-[#252922]">Pilih Mandor / Kontraktor</div>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === parseInt(e.target.value, 10));
                    setCustomer(c || null);
                  }}
                  className="w-full p-2.5 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
                >
                  <option value="">-- Pilih Mandor Terdaftar --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Sisa Plafon: {formatRupiah(c.creditLimit - c.currentDebt)})
                    </option>
                  ))}
                </select>

                {currentMandor && (
                  <div className="p-3 bg-[#F7F4ED] rounded-control border border-[#DEDCCF] text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Limit Kredit:</span>
                      <span className="font-bold">{formatRupiah(mandorCreditLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Hutang Berjalan:</span>
                      <span className="font-bold text-[#D97706]">{formatRupiah(mandorCurrentDebt)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#DEDCCF] pt-1">
                      <span className="text-[#625D53]">Sisa Plafon:</span>
                      <span className={`font-extrabold ${isKasbonExceeded ? 'text-[#C62828]' : 'text-[#16845B]'}`}>
                        {formatRupiah(mandorRemainingLimit)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(paymentMethod === 'transfer' || paymentMethod === 'card') && (
              <div className="pt-4 border-t border-[#DEDCCF] space-y-2">
                <label className="text-[11px] font-semibold text-[#625D53] block">
                  Nomor Referensi / No. Bukti Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: BCA-TRX-98129 / Approval Code EDC"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold text-[#252922] focus:outline-none focus:border-[#234536]"
                />
              </div>
            )}

            {/* Readiness Card */}
            <div className="p-3 rounded-control bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#16845B] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#16845B]">
                  Transaksi Siap Diselesaikan
                </div>
                <div className="text-[11px] text-[#625D53]">
                  Pastikan jumlah uang sudah sesuai sebelum menyelesaikan.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCheckout}
                disabled={isSubmitting || !isCashSufficient || isKasbonExceeded}
                className="w-full py-3.5 px-4 rounded-control bg-[#234536] hover:bg-[#1c372b] active:scale-[0.99] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Memproses Transaksi...' : 'Selesaikan Transaksi (F10)'}
                </span>
              </button>

              <button
                onClick={handleBackToPOS}
                className="w-full py-2.5 px-4 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] text-[#252922] font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Keranjang</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal with Print Receipts (Thermal & Surat Jalan) */}
      {successTransaction && (
        <PrintReceiptModal
          transaction={successTransaction}
          onClose={() => {
            setSuccessTransaction(null);
            handleBackToPOS();
          }}
        />
      )}
    </div>
  );
}
