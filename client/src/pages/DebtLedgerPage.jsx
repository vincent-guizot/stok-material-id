import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah, formatDateIndo } from '../utils/formatters.js';
import { BookOpen, UserPlus, DollarSign, Phone, MapPin, AlertOctagon, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DebtLedgerPage() {
  const queryClient = useQueryClient();
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Form states untuk bayar cicilan
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState(null);
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Form states untuk tambah mandor
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('10000000');
  const [newTermDays, setNewTermDays] = useState('14');
  const [addError, setAddError] = useState(null);

  // Fetch daftar pelanggan
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    },
  });

  // Mutasi Pembayaran Cicilan
  const payMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/debts/pay', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch (_) {}
      setSuccessReceipt(data.data);
      setPayAmount('');
      setPayNotes('');
    },
    onError: (err) => {
      setPayError(err.response?.data?.message || 'Gagal memproses pembayaran cicilan.');
    },
  });

  // Mutasi Tambah Mandor
  const addCustomerMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/customers', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddCustomerOpen(false);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
    },
    onError: (err) => {
      setAddError(err.response?.data?.message || 'Gagal menambahkan mandor.');
    },
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + (parseFloat(c.currentDebt) || 0), 0);
  const totalLimit = customers.reduce((sum, c) => sum + (parseFloat(c.creditLimit) || 0), 0);

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setPayError(null);
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      setPayError('Masukkan jumlah cicilan yang valid!');
      return;
    }
    payMutation.mutate({
      customerId: selectedCustomerForPay.id,
      amount: amt,
      paymentMethod: payMethod,
      notes: payNotes,
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setAddError(null);
    if (!newName) {
      setAddError('Nama mandor/pelanggan wajib diisi!');
      return;
    }
    addCustomerMutation.mutate({
      name: newName,
      phone: newPhone,
      address: newAddress,
      creditLimit: parseFloat(newCreditLimit) || 0,
      termDays: parseInt(newTermDays, 10) || 14,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-amber-600" />
            <span>Buku Kasbon Mandor & Piutang Proyek</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Kelola plafon kredit, pantau batas tempo nota, dan catat cicilan pembayaran mandor
          </p>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Mandor Baru</span>
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kasbon Belum Lunas</div>
          <div className="text-2xl font-black text-red-600 mt-1">{formatRupiah(totalOutstanding)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Uang toko yang masih berputar di proyek</div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Plafon Dipercaya</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{formatRupiah(totalLimit)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Batas maksimal hutang seluruh langganan</div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Mandor Terdaftar</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{customers.length} Orang</div>
          <div className="text-xs text-slate-400 mt-0.5">Kontraktor & tukang aktif</div>
        </div>
      </div>

      {/* Daftar Mandor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold">
            Memuat buku kasbon...
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold">
            Belum ada data mandor langganan.
          </div>
        ) : (
          customers.map((c) => {
            const limit = parseFloat(c.creditLimit) || 0;
            const debt = parseFloat(c.currentDebt) || 0;
            const percent = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;
            const isOver = debt >= limit && limit > 0;
            const isWarning = percent >= 75 && !isOver;

            return (
              <div
                key={c.id}
                className={`p-5 rounded-3xl bg-white border-2 shadow-sm transition flex flex-col justify-between ${
                  isOver
                    ? 'border-red-300 ring-2 ring-red-100'
                    : isWarning
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400 font-semibold">
                      Tenor: {c.termDays || 14} Hari
                    </span>
                    {isOver ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" />
                        PLAFON HABIS
                      </span>
                    ) : isWarning ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                        WASPADAI ({percent}%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        KASBON AMAN
                      </span>
                    )}
                  </div>

                  {/* Name & Contact */}
                  <h3 className="font-black text-slate-900 text-base leading-tight">{c.name}</h3>
                  <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Credit Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Kasbon Berjalan:</span>
                      <span className={debt > 0 ? 'text-red-600 font-black' : 'text-slate-800'}>
                        {formatRupiah(debt)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Batas: {formatRupiah(limit)}</span>
                      <span>Sisa: {formatRupiah(Math.max(0, limit - debt))}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    disabled={debt <= 0}
                    onClick={() => {
                      setSelectedCustomerForPay(c);
                      setSuccessReceipt(null);
                      setPayError(null);
                      setPayAmount('');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{debt > 0 ? 'Terima Cicilan Kasbon' : 'Kasbon Sudah Lunas'}</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL TERIMA PEMBAYARAN CICILAN KASBON                      */}
      {/* ============================================================ */}
      {selectedCustomerForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Terima Cicilan Kasbon</h3>
                <p className="text-xs text-slate-500">Mandor: {selectedCustomerForPay.name}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerForPay(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Jika Sukses Bayar -> Tampilkan Tanda Terima Kuitansi */}
            {successReceipt ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-900">Pembayaran Berhasil Dicatat!</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Cicilan sebesar{' '}
                    <strong className="text-emerald-700">
                      {formatRupiah(successReceipt.payment?.amount)}
                    </strong>{' '}
                    telah memotong kasbon.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Sisa Kasbon {selectedCustomerForPay.name}:{' '}
                    <strong className="text-slate-900">
                      {formatRupiah(successReceipt.remainingDebt)}
                    </strong>
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedCustomerForPay(null)}
                    className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaySubmit} className="py-4 space-y-4">
                
                {payError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                    {payError}
                  </div>
                )}

                {/* Info Hutang */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Total Kasbon Saat Ini:</span>
                  <span className="font-black text-red-600 text-base">
                    {formatRupiah(selectedCustomerForPay.currentDebt)}
                  </span>
                </div>

                {/* Input Jumlah Uang */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Nominal Uang yang Diterima (Rp):
                  </label>
                  <input
                    type="number"
                    autoFocus
                    placeholder="Contoh: 1000000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-4 py-3 text-xl font-black rounded-2xl border-2 border-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPayAmount(selectedCustomerForPay.currentDebt.toString())}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    >
                      Lunasi Semua ({formatRupiah(selectedCustomerForPay.currentDebt)})
                    </button>
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Cara Terima Uang:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CASH', 'TRANSFER', 'QRIS'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          payMethod === m
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m === 'CASH' ? 'Tunai' : m === 'TRANSFER' ? 'Transfer Bank' : 'QRIS'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Catatan Kuitansi:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembayaran termin proyek plesteran"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={payMutation.isPending}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg transition disabled:opacity-50"
                  >
                    {payMutation.isPending ? 'Menyimpan...' : 'TERIMA CICILAN SEKARANG'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL TAMBAH MANDOR BARU                                   */}
      {/* ============================================================ */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-black text-slate-900">Daftarkan Mandor / Kontraktor Baru</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="py-4 space-y-3.5">
              {addError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                  {addError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Mandor / Kontraktor:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Supri (Mandor CV Bangun Jaya)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor HP / WhatsApp:
                </label>
                <input
                  type="text"
                  placeholder="0812..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alamat / Lokasi Proyek:
                </label>
                <input
                  type="text"
                  placeholder="Alamat rumah atau lokasi proyek yang dikerjakan"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Batas Plafon Kredit (Rp):
                  </label>
                  <input
                    type="number"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jatuh Tempo (Hari):
                  </label>
                  <input
                    type="number"
                    value={newTermDays}
                    onChange={(e) => setNewTermDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={addCustomerMutation.isPending}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {addCustomerMutation.isPending ? 'Menyimpan...' : 'SIMPAN MANDOR BARU'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
