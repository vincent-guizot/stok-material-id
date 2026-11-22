import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
import WorkerAvatar from '../components/WorkerAvatar.jsx';
import { paletteFor } from '../components/avatarPalette.js';
import { useCartStore } from '../store/useCartStore.js';
import { exportToCsv } from '../utils/exportCsv.js';
import {
  Users,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Plus,
  Search,
  RotateCcw,
  Trash2,
  X,
  Phone,
  MapPin,
  Banknote,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function DebtLedgerPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('debt-high');
  const navigate = useNavigate();
  const setCartCustomer = useCartStore((st) => st.setCustomer);
  const [selectedId, setSelectedId] = useState(null);
  const [locationFilter, setLocationFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingMandor, setEditingMandor] = useState(null);
  const [deleteConfirmMandor, setDeleteConfirmMandor] = useState(null);
  const [drawerTab, setDrawerTab] = useState('summary'); // 'summary' | 'history' | 'payments' | 'projects'

  // Toast feedback state
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNewMandorModalOpen, setIsNewMandorModalOpen] = useState(false);

  // Form states for Catat Pembayaran Cicilan
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState(null);

  // Form states for Tambah Mandor
  const [newMandorName, setNewMandorName] = useState('');
  const [newMandorPhone, setNewMandorPhone] = useState('');
  const [newMandorAddress, setNewMandorAddress] = useState('');
  const [newMandorLimit, setNewMandorLimit] = useState('');
  const [newMandorTerm, setNewMandorTerm] = useState('30');
  const [newMandorError, setNewMandorError] = useState(null);

  // Fetch Customers (Mandor)
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    },
  });

  // Ringkasan piutang (jatuh tempo, lunas bulan ini, dst.) dihitung server dari data nyata
  const { data: summary } = useQuery({
    queryKey: ['debt_summary'],
    queryFn: async () => (await api.get('/debts/summary')).data.data,
  });
  const totals = summary?.totals || {};
  const extra = summary?.customers || {};

  const projectOf = (c) => (c.address || '').trim();
  const locations = [...new Set(customers.map(projectOf).filter(Boolean))];

  // Filter & sort
  const filteredCustomers = customers
    .filter((c) => {
      const debt = parseFloat(c.currentDebt) || 0;
      const limit = parseFloat(c.creditLimit) || 1;
      const ratio = debt / limit;
      const q = (search || '').toLowerCase();

      if (q && !`${c.name} ${c.address || ''}`.toLowerCase().includes(q)) return false;
      if (locationFilter !== 'all' && projectOf(c) !== locationFilter) return false;
      if (statusFilter === 'over' && ratio <= 1) return false;
      if (statusFilter === 'near' && (ratio < 0.75 || ratio > 1)) return false;
      if (statusFilter === 'active' && ratio >= 0.75) return false;
      return true;
    })
    .sort((a, b) => {
      const debtA = parseFloat(a.currentDebt) || 0;
      const debtB = parseFloat(b.currentDebt) || 0;
      if (sortOrder === 'debt-high') return debtB - debtA;
      if (sortOrder === 'debt-low') return debtA - debtB;
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Mandor terpilih (otomatis yang pertama, seperti di mockup)
  const selectedMandor = customers.find((c) => c.id === selectedId) || filteredCustomers[0] || null;
  const setSelectedMandor = (c) => setSelectedId(c ? c.id : null);
  const selExtra = selectedMandor ? extra[selectedMandor.id] || {} : {};

  const { data: selTransactions = [] } = useQuery({
    queryKey: ['customer_transactions', selectedMandor?.id],
    enabled: !!selectedMandor && drawerTab === 'history',
    queryFn: async () => (await api.get(`/transactions?customerId=${selectedMandor.id}&limit=20`)).data.data,
  });
  const { data: selPayments = [] } = useQuery({
    queryKey: ['customer_payments', selectedMandor?.id],
    enabled: !!selectedMandor && drawerTab === 'payments',
    queryFn: async () => (await api.get(`/debts/history?customerId=${selectedMandor.id}`)).data.data,
  });

  const fmtWhen = (v) =>
    v
      ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(v))
      : 'Belum ada';

  // Mutation Catat Pembayaran Cicilan
  const payMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/debts/pay', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['debt_summary'] });
      queryClient.invalidateQueries({ queryKey: ['customer_payments'] });
      setIsPaymentModalOpen(false);
      setPayAmount('');
      setPayNotes('');
      showToast('success', 'Pembayaran cicilan kasbon berhasil dicatat dan saldo hutang mandor otomatis berkurang!');
    },
    onError: (err) => {
      setPayError(err.response?.data?.message || 'Gagal mencatat pembayaran cicilan.');
    },
  });

  // Mutation Tambah Mandor Baru
  const createMandorMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/customers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['debt_summary'] });
      queryClient.invalidateQueries({ queryKey: ['customer_payments'] });
      setIsNewMandorModalOpen(false);
      setNewMandorName('');
      setNewMandorPhone('');
      setNewMandorAddress('');
      setNewMandorLimit('');
      showToast('success', 'Data mandor baru berhasil didaftarkan!');
    },
    onError: (err) => {
      setNewMandorError(err.response?.data?.message || 'Gagal menambahkan mandor.');
    },
  });

  // Mutation Ubah Data Mandor
  const updateMandorMutation = useMutation({
    mutationFn: async ({ id, payload }) => api.put(`/customers/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['debt_summary'] });
      setIsNewMandorModalOpen(false);
      setEditingMandor(null);
      showToast('success', 'Data mandor berhasil diperbarui!');
    },
    onError: (err) => {
      setNewMandorError(err.response?.data?.message || 'Gagal memperbarui data mandor.');
    },
  });

  const openEditMandor = (c) => {
    setEditingMandor(c);
    setNewMandorName(c.name || '');
    setNewMandorPhone(c.phone || '');
    setNewMandorAddress(c.address || '');
    setNewMandorLimit(String(parseFloat(c.creditLimit) || ''));
    setNewMandorTerm(String(c.termDays || 14));
    setNewMandorError(null);
    setIsNewMandorModalOpen(true);
  };

  // Mutation Hapus Mandor
  const deleteMandorMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['debt_summary'] });
      queryClient.invalidateQueries({ queryKey: ['customer_payments'] });
      setDeleteConfirmMandor(null);
      showToast('success', 'Data mandor berhasil dihapus.');
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus mandor.');
      setDeleteConfirmMandor(null);
    },
  });

  const handleConfirmDeleteMandor = () => {
    if (!deleteConfirmMandor) return;
    deleteMandorMutation.mutate(deleteConfirmMandor.id);
    if (selectedMandor?.id === deleteConfirmMandor.id) {
      setSelectedMandor(null);
    }
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setPayError(null);
    if (!selectedMandor) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }
    payMutation.mutate({
      customerId: selectedMandor.id,
      amount,
      paymentMethod: payMethod,
      notes: payNotes,
    });
  };

  const handleCreateMandorSubmit = (e) => {
    e.preventDefault();
    setNewMandorError(null);
    const payload = {
      name: newMandorName,
      phone: newMandorPhone,
      address: newMandorAddress,
      creditLimit: parseFloat(newMandorLimit) || 10000000,
      termDays: parseInt(newMandorTerm, 10) || 14,
    };
    if (editingMandor) {
      updateMandorMutation.mutate({ id: editingMandor.id, payload });
    } else {
      createMandorMutation.mutate(payload);
    }
  };

  const pctOf = (c) => Math.round(((parseFloat(c.currentDebt) || 0) / (parseFloat(c.creditLimit) || 1)) * 100);
  const toneOf = (pct) => (pct > 100 ? 'bg-[#C62828]' : pct >= 75 ? 'bg-[#D97706]' : 'bg-[#16845B]');
  const textToneOf = (pct) => (pct > 100 ? 'text-[#C62828]' : pct >= 75 ? 'text-[#D97706]' : 'text-[#16845B]');
  const avatarOf = (c, size) => <WorkerAvatar size={size} {...paletteFor(c.id)} title={c.name} />;

  const startKasbon = (c) => {
    setCartCustomer(c);
    navigate('/pos');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Buku Kasbon Mandor
            </h1>
            <p className="text-xs text-[#625D53]">
              Kelola piutang mandor, catat pengambilan material, dan pantau pembayaran.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              exportToCsv(
                'buku-kasbon-mandor',
                ['Nama Mandor', 'No. WhatsApp', 'Alamat Proyek', 'Plafon Kredit', 'Hutang Saat Ini', 'Sisa Plafon'],
                customers.map((c) => [
                  c.name,
                  c.phone || '-',
                  c.address || '-',
                  c.creditLimit || 0,
                  c.currentDebt || 0,
                  (c.creditLimit || 0) - (c.currentDebt || 0),
                ])
              );
              showToast('success', 'Data buku kasbon mandor berhasil diekspor ke Excel (CSV)!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#234536]" />
            <span>Export Data</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#234536]" />
            <span>Cetak Daftar</span>
          </button>

          <button
            onClick={() => { setEditingMandor(null); setNewMandorName(''); setNewMandorPhone(''); setNewMandorAddress(''); setNewMandorLimit(''); setNewMandorError(null); setIsNewMandorModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Mandor</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards (data nyata dari server) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={BookOpen}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Piutang Mandor"
          value={formatRupiah(totals.outstanding ?? 0)}
          subtitle={`${totals.customerCount ?? customers.length} Mandor aktif`}
        />
        <StatCard
          icon={Clock}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Piutang Jatuh Tempo"
          value={formatRupiah(totals.overdue ?? 0)}
          subtitle={`${totals.overdueCustomers ?? 0} Mandor`}
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Lunas Bulan Ini"
          value={formatRupiah(totals.paidThisMonthAmount ?? 0)}
          subtitle={`${totals.paidThisMonthCount ?? 0} Pembayaran`}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg="bg-rose-50 text-[#C62828]"
          title="Melebihi Limit"
          value={`${totals.overLimitCount ?? 0} Mandor`}
          subtitle="Perlu segera ditindaklanjuti"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        {/* Daftar mandor */}
        <div className="bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden">
          <div className="p-3.5 flex flex-wrap items-center gap-2 border-b border-[#DEDCCF]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#8C877D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama mandor atau proyek..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold focus:outline-none focus:border-[#234536]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Normal</option>
              <option value="near">Mendekati Limit</option>
              <option value="over">Melebihi Limit</option>
            </select>
            <select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold max-w-[160px]"
            >
              <option value="all">Semua Proyek</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2.5 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold"
            >
              <option value="debt-high">Saldo Tertinggi</option>
              <option value="debt-low">Saldo Terendah</option>
              <option value="name-asc">Nama A-Z</option>
            </select>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setLocationFilter('all'); setSortOrder('debt-high'); setPage(1); }}
              title="Reset filter"
              className="p-2 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control text-[#625D53]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-3 px-2.5">NAMA MANDOR</th>
                  <th className="py-3 px-2.5">PROYEK</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">LIMIT</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">SALDO</th>
                  <th className="py-3 px-2.5 w-24">PAKAI</th>
                  <th className="py-3 px-2.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center font-bold text-[#625D53]">Memuat data buku kasbon mandor...</td></tr>
                ) : pagedCustomers.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-[#8C877D]">Tidak ada mandor yang cocok dengan pencarian.</td></tr>
                ) : (
                  pagedCustomers.map((c) => {
                    const isSelected = selectedMandor?.id === c.id;
                    const percent = pctOf(c);
                    const status = percent > 100 ? 'melebihi' : percent >= 75 ? 'mendekati' : 'aktif';
                    const statusText = percent > 100 ? 'Melebihi Limit' : percent >= 75 ? 'Mendekati Limit' : 'Aktif';
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedMandor(c)}
                        className={`cursor-pointer transition ${isSelected ? 'bg-emerald-50/70' : 'hover:bg-[#F7F4ED]/60'}`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            {avatarOf(c, 34)}
                            <div className="min-w-0 max-w-[190px]">
                              <div className="font-extrabold text-[#252922] truncate">{c.name}</div>
                              <div className="text-[11px] text-[#8C877D]">{c.phone || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#625D53] max-w-[110px] truncate">{c.address || '-'}</td>
                        <td className="py-2.5 px-3 text-right text-[#625D53] whitespace-nowrap">{formatRupiah(parseFloat(c.creditLimit) || 0)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-[#252922] whitespace-nowrap">{formatRupiah(parseFloat(c.currentDebt) || 0)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${toneOf(percent)}`} style={{ width: `${Math.min(100, percent)}%` }} />
                            </div>
                            <span className={`text-[11px] font-black w-9 text-right ${textToneOf(percent)}`}>{percent}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center"><StatusBadge status={status} label={statusText} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED]/50 flex flex-wrap items-center justify-between gap-2 text-xs text-[#625D53]">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filteredCustomers.length)} dari {filteredCustomers.length} mandor
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-1.5 py-1 border border-[#DEDCCF] rounded bg-white font-bold"
              >
                {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / halaman</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="p-1.5 rounded border border-[#DEDCCF] bg-white disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="px-2.5 py-1 rounded bg-[#234536] text-white font-bold">{currentPage}</span>
              <span className="px-1 text-[#8C877D]">/ {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="p-1.5 rounded border border-[#DEDCCF] bg-white disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

        {/* Panel detail (selalu tampil, mandor pertama otomatis terpilih) */}
        <aside className="bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden xl:sticky xl:top-4">
          {!selectedMandor ? (
            <div className="p-10 text-center text-xs text-[#8C877D]">Belum ada mandor. Klik “Tambah Mandor” untuk mulai.</div>
          ) : (
            <>
              <div className="p-4 flex items-start justify-between gap-3 border-b border-[#DEDCCF]">
                <div className="flex items-center gap-3 min-w-0">
                  {avatarOf(selectedMandor, 56)}
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-[#252922] leading-tight truncate">{selectedMandor.name}</h3>
                    <div className="text-[11px] text-[#625D53] flex items-center gap-1 mt-1"><Phone className="w-3 h-3 text-[#8C877D]" />{selectedMandor.phone || '-'}</div>
                    <div className="text-[11px] text-[#8C877D] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /><span className="truncate">{selectedMandor.address || '-'}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditMandor(selectedMandor)} title="Ubah data" className="p-1.5 rounded-control border border-[#DEDCCF] text-[#234536] hover:bg-[#F7F4ED]"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteConfirmMandor(selectedMandor)} title="Hapus mandor" className="p-1.5 rounded-control border border-[#DEDCCF] text-[#C62828] hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex border-b border-[#DEDCCF] px-3 gap-0.5 text-xs">
                {[
                  { id: 'summary', label: 'Ringkasan' },
                  { id: 'history', label: 'Riwayat Transaksi' },
                  { id: 'payments', label: 'Pembayaran' },
                  { id: 'projects', label: 'Proyek' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    className={`py-2.5 px-2 font-bold border-b-2 transition whitespace-nowrap ${drawerTab === tab.id ? 'border-[#234536] text-[#234536]' : 'border-transparent text-[#625D53] hover:text-[#252922]'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-4 text-xs max-h-[calc(100vh-380px)] overflow-y-auto">
                {drawerTab === 'summary' && (() => {
                  const limit = parseFloat(selectedMandor.creditLimit) || 0;
                  const debt = parseFloat(selectedMandor.currentDebt) || 0;
                  const percent = pctOf(selectedMandor);
                  return (
                    <>
                      <div className="bg-[#F7F4ED] p-3.5 rounded-card border border-[#DEDCCF] space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><div className="text-[10px] text-[#625D53]">Limit Kredit</div><div className="font-extrabold mt-0.5">{formatRupiah(limit)}</div></div>
                          <div><div className="text-[10px] text-[#625D53]">Saldo Piutang</div><div className="font-black text-[#D97706] mt-0.5">{formatRupiah(debt)}</div></div>
                          <div><div className="text-[10px] text-[#625D53]">Sisa Limit</div><div className="font-extrabold text-[#16845B] mt-0.5">{formatRupiah(Math.max(0, limit - debt))}</div></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] font-bold mb-1"><span className="text-[#625D53]">Pemakaian Limit</span><span className={textToneOf(percent)}>{percent}%</span></div>
                          <div className="h-2 bg-stone-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${toneOf(percent)}`} style={{ width: `${Math.min(100, percent)}%` }} /></div>
                        </div>
                      </div>

                      <div>
                        <div className="font-bold text-[#252922] mb-1.5">Informasi Tambahan</div>
                        <div className="bg-[#F7F4ED] rounded-control p-3 space-y-1.5 border border-[#DEDCCF]">
                          <div className="flex justify-between"><span className="text-[#625D53]">Jumlah Transaksi</span><span className="font-bold">{selExtra.txCount ?? 0} Transaksi</span></div>
                          <div className="flex justify-between"><span className="text-[#625D53]">Terakhir Transaksi</span><span className="font-bold">{fmtWhen(selExtra.lastTransactionAt)}</span></div>
                          <div className="flex justify-between"><span className="text-[#625D53]">Terakhir Pembayaran</span><span className="font-bold">{fmtWhen(selExtra.lastPaymentAt)}</span></div>
                          <div className="flex justify-between"><span className="text-[#625D53]">Jatuh Tempo (tenor)</span><span className="font-bold">{selectedMandor.termDays || 14} hari</span></div>
                          {(selExtra.overdue || 0) > 0 && (
                            <div className="flex justify-between"><span className="text-[#625D53]">Sudah Jatuh Tempo</span><span className="font-bold text-[#C62828]">{formatRupiah(selExtra.overdue)}</span></div>
                          )}
                        </div>
                      </div>

                      {percent >= 75 && (
                        <div className="p-2.5 rounded-control bg-amber-50 border border-amber-200 text-[#D97706] font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{percent > 100 ? 'Melebihi limit kredit! Kasbon berikutnya akan ditolak sistem.' : `Mendekati limit kredit (${percent}%). Ingatkan mandor untuk mencicil.`}</span>
                        </div>
                      )}
                    </>
                  );
                })()}

                {drawerTab === 'history' && (
                  selTransactions.length === 0 ? (
                    <div className="py-8 text-center text-[#8C877D]">Belum ada transaksi.</div>
                  ) : (
                    <div className="divide-y divide-[#DEDCCF]/70">
                      {selTransactions.map((t) => (
                        <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-[#252922] truncate">{t.invoiceNumber}</div>
                            <div className="text-[10px] text-[#8C877D]">{fmtWhen(t.createdAt)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black">{formatRupiah(parseFloat(t.totalAmount) || 0)}</div>
                            {(parseFloat(t.debtAmount) || 0) > 0 && <div className="text-[10px] text-[#D97706] font-bold">Kasbon {formatRupiah(parseFloat(t.debtAmount))}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {drawerTab === 'payments' && (
                  selPayments.length === 0 ? (
                    <div className="py-8 text-center text-[#8C877D]">Belum ada pembayaran cicilan.</div>
                  ) : (
                    <div className="divide-y divide-[#DEDCCF]/70">
                      {selPayments.map((p) => (
                        <div key={p.id} className="py-2 flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-[#252922]">{fmtWhen(p.paymentDate || p.createdAt)}</div>
                            <div className="text-[10px] text-[#8C877D]">{p.paymentMethod}{p.notes ? ` · ${p.notes}` : ''}</div>
                          </div>
                          <div className="font-black text-[#16845B]">{formatRupiah(parseFloat(p.amount) || 0)}</div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {drawerTab === 'projects' && (
                  <div className="bg-[#F7F4ED] rounded-control p-3 border border-[#DEDCCF] space-y-1">
                    <div className="text-[#625D53]">Proyek / Lokasi</div>
                    <div className="font-bold text-[#252922]">{selectedMandor.address || 'Belum diisi'}</div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED] flex flex-wrap gap-2">
                <button onClick={() => startKasbon(selectedMandor)} className="flex-1 whitespace-nowrap px-2.5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white text-xs font-bold flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" />Tambah Kasbon</button>
                <button onClick={() => { setPayError(null); setIsPaymentModalOpen(true); }} className="flex-1 whitespace-nowrap px-2.5 py-2 rounded-control bg-[#C6A46A] hover:bg-[#ad8b53] text-white text-xs font-bold flex items-center justify-center gap-1.5"><Banknote className="w-3.5 h-3.5" />Catat Pembayaran</button>
                <button onClick={() => window.print()} className="flex-1 whitespace-nowrap px-2.5 py-2 rounded-control bg-white hover:bg-[#ECEAE2] border border-[#DEDCCF] text-xs font-bold flex items-center justify-center gap-1.5"><Printer className="w-3.5 h-3.5" />Cetak Rekap</button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Modal: Konfirmasi Hapus Mandor */}
      {deleteConfirmMandor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DEDCCF]">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#C62828] flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#252922]">Hapus Data Mandor?</h3>
                <p className="text-xs text-[#625D53]">Data mandor akan dihapus dari buku piutang kasbon.</p>
              </div>
            </div>

            <div className="text-xs text-[#252922] bg-[#F7F4ED] p-3 rounded-control border border-[#DEDCCF] space-y-1">
              <div>Mandor yang akan dihapus:</div>
              <div className="font-extrabold text-sm text-[#234536]">{deleteConfirmMandor.name}</div>
              <div className="text-[#625D53]">
                Kontak: {deleteConfirmMandor.phone || '-'} • Saldo Piutang: {formatRupiah(deleteConfirmMandor.currentDebt || 0)}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMandor(null)}
                className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED] text-xs text-[#252922]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMandor}
                className="px-5 py-2 rounded-control bg-[#C62828] hover:bg-[#b02222] text-white font-extrabold text-xs shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Mandor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Catat Pembayaran Cicilan Kasbon */}
      {isPaymentModalOpen && selectedMandor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#234536]" />
                <h3 className="font-extrabold text-base text-[#252922]">
                  Catat Pembayaran Cicilan Kasbon
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-[#8C877D] hover:text-[#252922] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payError && (
              <div className="p-2.5 bg-red-50 text-[#C62828] text-xs font-bold rounded-control border border-red-200">
                {payError}
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F4ED] rounded-control border border-[#DEDCCF]">
                <div className="font-bold text-[#252922]">{selectedMandor.name}</div>
                <div className="text-[11px] text-[#625D53]">
                  Saldo Hutang Saat Ini:{' '}
                  <span className="font-black text-[#D97706]">
                    {formatRupiah(selectedMandor.currentDebt)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">
                  Nominal Pembayaran (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#8C877D]">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Contoh: 5000000"
                    className="w-full pl-9 pr-3 py-2 text-base font-black bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-[#252922] focus:outline-none focus:border-[#234536]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Metode Bayar</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                >
                  <option value="cash">Tunai (Cash di Toko)</option>
                  <option value="transfer">Transfer Bank (BCA / Mandiri / BRI)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Misal: Cicilan termin 1 proyek ruko..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="px-5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{payMutation.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Mandor Baru */}
      {isNewMandorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#234536]" />
                <h3 className="font-extrabold text-base text-[#252922]">{editingMandor ? 'Ubah Data Mandor' : 'Tambah Mandor / Pelanggan Baru'}</h3>
              </div>
              <button
                onClick={() => { setIsNewMandorModalOpen(false); setEditingMandor(null); }}
                className="text-[#8C877D] hover:text-[#252922] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newMandorError && (
              <div className="p-2.5 bg-red-50 text-[#C62828] text-xs font-bold rounded-control border border-red-200">
                {newMandorError}
              </div>
            )}

            <form onSubmit={handleCreateMandorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Nama Lengkap Mandor / Proyek *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Joko (Proyek Ruko Sentosa)"
                  value={newMandorName}
                  onChange={(e) => setNewMandorName(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={newMandorPhone}
                  onChange={(e) => setNewMandorPhone(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Alamat Proyek / Lokasi Pengiriman</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Merdeka No. 12, Proyek Ruko 2 Lantai"
                  value={newMandorAddress}
                  onChange={(e) => setNewMandorAddress(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Plafon Batas Kredit (Rp)</label>
                  <input
                    type="number"
                    placeholder="25000000"
                    value={newMandorLimit}
                    onChange={(e) => setNewMandorLimit(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Tenor Jatuh Tempo (Hari)</label>
                  <input
                    type="number"
                    value={newMandorTerm}
                    onChange={(e) => setNewMandorTerm(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsNewMandorModalOpen(false); setEditingMandor(null); }}
                  className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMandorMutation.isPending}
                  className="px-5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{createMandorMutation.isPending || updateMandorMutation.isPending ? 'Menyimpan...' : 'Simpan Mandor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast({ show: false, type: 'info', message: '' })} />
    </div>
  );
}
