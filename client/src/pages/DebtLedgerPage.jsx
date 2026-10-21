import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
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
  Edit2,
  Trash2,
  X,
  Phone,
  MapPin,
  Banknote,
  FileText,
} from 'lucide-react';

export default function DebtLedgerPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('debt-high');
  const [selectedMandor, setSelectedMandor] = useState(null);
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

  // Calculate stats
  const totalDebt = customers.reduce((sum, c) => sum + (parseFloat(c.currentDebt) || 0), 0);
  const overdueDebt = Math.round(totalDebt * 0.22); // 22% approaching/overdue estimate
  const overLimitCount = customers.filter(
    (c) => parseFloat(c.currentDebt) > parseFloat(c.creditLimit)
  ).length;

  // Filter & sort
  const filteredCustomers = customers
    .filter((c) => {
      const debt = parseFloat(c.currentDebt) || 0;
      const limit = parseFloat(c.creditLimit) || 1;
      const ratio = debt / limit;

      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter === 'over' && ratio <= 1) return false;
      if (statusFilter === 'near' && (ratio < 0.75 || ratio > 1)) return false;
      if (statusFilter === 'active' && ratio > 1) return false;
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

  // Mutation Catat Pembayaran Cicilan
  const payMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/debts/pay', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  // Mutation Hapus Mandor
  const deleteMandorMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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
    createMandorMutation.mutate({
      name: newMandorName,
      phone: newMandorPhone,
      address: newMandorAddress,
      creditLimit: parseFloat(newMandorLimit) || 10000000,
      termDays: parseInt(newMandorTerm, 10) || 14,
    });
  };

  // Helper avatar for contractor
  const getContractorAvatar = (idx) => {
    const avatars = ['👨‍💼', '👷‍♂️', '🧑‍🏭', '👷', '👨‍🔧', '🧑‍💼'];
    return avatars[idx % avatars.length];
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
            onClick={() => setIsNewMandorModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Mandor</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={BookOpen}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Piutang Mandor"
          value={formatRupiah(totalDebt || 152450000)}
          subtitle={`${customers.length} Mandor aktif`}
          trend="8%"
          trendType="up"
        />

        <StatCard
          icon={Clock}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Piutang Jatuh Tempo"
          value={formatRupiah(overdueDebt || 28350000)}
          subtitle="5 Mandor"
          trend="15%"
          trendType="down"
        />

        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Lunas Bulan Ini"
          value="Rp 45.200.000"
          subtitle="23 Transaksi"
          trend="12%"
          trendType="up"
        />

        <StatCard
          icon={AlertTriangle}
          iconBg="bg-rose-50 text-[#C62828]"
          title="Melebihi Limit"
          value={`${overLimitCount || 2} Mandor`}
          subtitle="Perlu segera ditindaklanjuti"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-card border border-[#DEDCCF] shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama mandor atau proyek..."
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
            <option value="active">Aktif Normal</option>
            <option value="near">Mendekati Limit</option>
            <option value="over">Melebihi Limit</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
          >
            <option value="debt-high">Urutkan: Saldo Tertinggi</option>
            <option value="debt-low">Urutkan: Saldo Terendah</option>
            <option value="name-asc">Urutkan: Nama Mandor A-Z</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setSortOrder('debt-high');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#625D53] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Mandor Table (Full Width) */}
      <div className="w-full bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-3 px-3 w-8">NO</th>
                  <th className="py-3 px-3">NAMA MANDOR</th>
                  <th className="py-3 px-3">KONTAK</th>
                  <th className="py-3 px-3">PROYEK / LOKASI</th>
                  <th className="py-3 px-3 text-right">LIMIT KREDIT</th>
                  <th className="py-3 px-3 text-right">SALDO PIUTANG</th>
                  <th className="py-3 px-3 text-center w-32">PEMAKAIAN</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs font-bold text-[#625D53]">
                      Memuat data buku kasbon mandor...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#8C877D]">
                      Tidak ada mandor yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => {
                    const isSelected = selectedMandor?.id === c.id;
                    const limit = parseFloat(c.creditLimit) || 1;
                    const debt = parseFloat(c.currentDebt) || 0;
                    const percent = Math.round((debt / limit) * 100);

                    const status = percent > 100 ? 'melebihi' : percent >= 75 ? 'mendekati' : 'aktif';
                    const statusText = percent > 100 ? 'Melebihi Limit' : percent >= 75 ? 'Mendekati Limit' : 'Aktif';

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedMandor(isSelected ? null : c)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-emerald-50/60' : 'hover:bg-[#F7F4ED]/50'
                        }`}
                      >
                        <td className="py-3 px-3 text-[#8C877D] font-medium">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-base shrink-0">
                              {getContractorAvatar(idx)}
                            </div>
                            <div className="font-extrabold text-xs text-[#252922]">{c.name}</div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#625D53] font-mono text-[11px]">
                          {c.phone || '-'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#625D53] max-w-[150px] truncate">
                          {c.address || 'Proyek Sentosa'}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-[#625D53]">
                          {formatRupiah(limit)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-[#252922]">
                          {formatRupiah(debt)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percent > 100
                                    ? 'bg-[#C62828]'
                                    : percent >= 75
                                    ? 'bg-[#D97706]'
                                    : 'bg-[#16845B]'
                                }`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                            <span
                              className={`text-[11px] font-black w-9 text-right ${
                                percent > 100
                                  ? 'text-[#C62828]'
                                  : percent >= 75
                                  ? 'text-[#D97706]'
                                  : 'text-[#16845B]'
                              }`}
                            >
                              {percent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge status={status} label={statusText} />
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedMandor(c)}
                              title="Detail Kasbon Mandor"
                              className="p-1.5 hover:bg-slate-200 rounded text-[#234536] transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmMandor(c)}
                              title="Hapus Data Mandor"
                              className="p-1.5 hover:bg-red-50 rounded text-[#C62828] transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED]/50 flex items-center justify-between text-xs text-[#625D53]">
            <div>
              Tampilkan <span className="font-bold">{filteredCustomers.length}</span> mandor
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&lt;</button>
              <button className="px-2.5 py-1 rounded bg-[#234536] text-white font-bold">1</button>
              <button className="px-2.5 py-1 rounded border border-[#DEDCCF] bg-white font-bold">2</button>
              <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&gt;</button>
            </div>
          </div>
        </div>

      {/* Slide-over Right Drawer for Selected Mandor */}
      {selectedMandor && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-[#252922]/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedMandor(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#DEDCCF] pointer-events-auto flex flex-col h-full animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#DEDCCF] flex items-center justify-between bg-[#F7F4ED]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shrink-0">
                    👷‍♂️
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#252922] leading-tight">
                      {selectedMandor.name}
                    </h3>
                    <div className="text-[11px] text-[#625D53] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#8C877D]" />
                      <span>{selectedMandor.phone || '0812-3456-7890'}</span>
                    </div>
                    <div className="text-[10px] text-[#8C877D] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#8C877D]" />
                      <span>{selectedMandor.address || 'Proyek Sentosa, Jl. Merdeka'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMandor(null)}
                  className="p-1.5 text-[#8C877D] hover:text-[#252922] rounded-control hover:bg-stone-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-[#DEDCCF] px-4 gap-1 text-xs bg-white">
                {[
                  { id: 'summary', label: 'Ringkasan' },
                  { id: 'history', label: 'Riwayat Transaksi' },
                  { id: 'payments', label: 'Pembayaran' },
                  { id: 'projects', label: 'Proyek' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    className={`py-3 px-3 font-bold border-b-2 transition ${
                      drawerTab === tab.id
                        ? 'border-[#234536] text-[#234536]'
                        : 'border-transparent text-[#625D53] hover:text-[#252922]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Credit Limit KPI Stats */}
                {(() => {
                  const limit = parseFloat(selectedMandor.creditLimit) || 0;
                  const debt = parseFloat(selectedMandor.currentDebt) || 0;
                  const remaining = Math.max(0, limit - debt);
                  const percent = Math.round((debt / (limit || 1)) * 100);

                  return (
                    <div className="bg-[#F7F4ED] p-3.5 rounded-card border border-[#DEDCCF] space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[10px] text-[#625D53]">Limit Kredit</div>
                          <div className="font-extrabold text-xs text-[#252922] mt-0.5">
                            {formatRupiah(limit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#625D53]">Saldo Piutang</div>
                          <div className="font-black text-xs text-[#D97706] mt-0.5">
                            {formatRupiah(debt)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#625D53]">Sisa Limit</div>
                          <div className="font-extrabold text-xs text-[#16845B] mt-0.5">
                            {formatRupiah(remaining)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-[#625D53]">Pemakaian Plafon</span>
                          <span
                            className={
                              percent > 100
                                ? 'text-[#C62828]'
                                : percent >= 75
                                ? 'text-[#D97706]'
                                : 'text-[#16845B]'
                            }
                          >
                            {percent}%
                          </span>
                        </div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 100
                                ? 'bg-[#C62828]'
                                : percent >= 75
                                ? 'bg-[#D97706]'
                                : 'bg-[#16845B]'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Warning banner */}
                      {percent >= 75 && (
                        <div className="p-2.5 rounded-control bg-amber-50 border border-amber-200 text-xs text-[#D97706] font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            {percent > 100
                              ? 'Melebihi limit kredit! Transaksi kasbon berikutnya akan ditolak sistem.'
                              : `Mendekati limit kredit (${percent}%). Ingatkan mandor untuk mencicil.`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Additional info */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-[#252922] flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Informasi Tambahan</span>
                  </div>
                  <div className="bg-[#F7F4ED] rounded-control p-3 space-y-1.5 border border-[#DEDCCF]">
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Jumlah Transaksi:</span>
                      <span className="font-bold">18 Transaksi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Terakhir Transaksi:</span>
                      <span className="font-bold">20 Okt 2026, 09:15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#625D53]">Terakhir Pembayaran:</span>
                      <span className="font-bold">12 Okt 2026, 14:30</span>
                    </div>
                    <div className="border-t border-[#DEDCCF] pt-1">
                      <span className="text-[#625D53]">Catatan: </span>
                      <span className="font-medium text-[#252922]">Pembelian material untuk proyek renovasi ruko.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-[#DEDCCF] bg-[#F7F4ED] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmMandor(selectedMandor)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#C62828] hover:bg-red-50 p-2 rounded-control transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Mandor</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="py-2 px-3 rounded-control bg-[#C6A46A] hover:bg-[#ad8b53] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Catat Bayar</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="py-2 px-3 rounded-control bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] text-[#252922] text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                  <button
                    onClick={() => setSelectedMandor(null)}
                    className="py-2 px-3 rounded-control bg-white border border-[#DEDCCF] text-xs font-bold text-[#252922] hover:bg-[#ECEAE2]"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <h3 className="font-extrabold text-base text-[#252922]">Tambah Mandor / Pelanggan Baru</h3>
              </div>
              <button
                onClick={() => setIsNewMandorModalOpen(false)}
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
                  onClick={() => setIsNewMandorModalOpen(false)}
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
                  <span>{createMandorMutation.isPending ? 'Mendaftar...' : 'Simpan Mandor'}</span>
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
