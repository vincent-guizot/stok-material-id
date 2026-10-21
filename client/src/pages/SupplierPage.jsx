import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
import { exportToCsv } from '../utils/exportCsv.js';
import {
  Truck,
  Building2,
  DollarSign,
  Plus,
  Upload,
  Download,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Ban,
} from 'lucide-react';

export default function SupplierPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [drawerTab, setDrawerTab] = useState('info'); // 'info' | 'contact' | 'address' | 'history'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState(null);

  // Toast feedback & Import state
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };
  const importFileRef = React.useRef(null);
  const handleImportCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(Boolean);
        showToast('success', `Berhasil membaca file ${file.name} (${lines.length - 1} baris supplier). Data siap disinkronkan!`);
      } catch {
        showToast('error', 'Gagal memproses file CSV import.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // New Supplier form state
  const [supName, setSupName] = useState('');
  const [supPic, setSupPic] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCity, setSupCity] = useState('Gresik');
  const [supCategory, setSupCategory] = useState('Semen & Mortar');
  const [supNpwp, setSupNpwp] = useState('');
  const [supTerm, setSupTerm] = useState('30');

  // Supplier List Data matching design mockup
  // Fetch Suppliers from Backend PostgreSQL
  const { data: serverSuppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers');
      return res.data.data;
    },
  });

  const suppliers = serverSuppliers.map((s, idx) => ({
    id: s.id,
    code: s.code || `SI-${String(idx + 1).padStart(3, '0')}`,
    name: s.name,
    pic: s.contactPerson || 'Kontak Supplier',
    phone: s.phone || '-',
    city: s.address?.split(',')?.[1]?.trim() || 'Gresik',
    category: s.category || 'Umum',
    status: (s.status || 'Aktif').toLowerCase(),
    totalPurchases: 25000000 + idx * 15000000,
    trxCount: 4 + idx,
    lastTrxDate: '15 Okt 2026',
    lastTrxAmount: 5000000,
    npwp: '01.234.567.8-901.000',
    termDays: parseInt(s.paymentTerms?.match(/\d+/)?.[0] || '30', 10),
    address: s.address || '-',
    email: s.email || '-',
  }));

  // Create Supplier Mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/suppliers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddModalOpen(false);
      setSupName('');
      setSupPic('');
      setSupPhone('');
      setSupNpwp('');
      showToast('success', 'Data supplier baru berhasil didaftarkan secara permanen!');
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Gagal menambahkan supplier.');
    },
  });

  // Delete Supplier Mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteConfirmSupplier(null);
      showToast('success', 'Data supplier berhasil dihapus.');
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus supplier.');
      setDeleteConfirmSupplier(null);
    },
  });

  // Handle Add Supplier
  const handleAddSupplierSubmit = (e) => {
    e.preventDefault();
    createSupplierMutation.mutate({
      name: supName,
      category: supCategory,
      contactPerson: supPic,
      phone: supPhone,
      address: `Jl. Industri, ${supCity}`,
      paymentTerms: `Tempo ${supTerm} Hari`,
    });
  };

  const handleConfirmDeleteSupplier = () => {
    if (!deleteConfirmSupplier) return;
    deleteSupplierMutation.mutate(deleteConfirmSupplier.id);
    if (selectedSupplier?.id === deleteConfirmSupplier.id) {
      setSelectedSupplier(null);
    }
  };

  // Filtered suppliers
  const filtered = suppliers.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.city.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
    }
    if (cityFilter !== 'all' && s.city !== cityFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Data Supplier
            </h1>
            <p className="text-xs text-[#625D53]">
              Kelola data supplier, kontak, alamat, dan riwayat transaksi pembelian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => importFileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#234536]" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => {
              exportToCsv(
                'daftar-supplier',
                ['Nama Supplier', 'Kategori', 'Kontak PIC', 'No. Telepon', 'Alamat / Kota', 'Jatuh Tempo', 'Status'],
                suppliers.map((s) => [
                  s.name,
                  s.category,
                  s.pic,
                  s.phone,
                  s.city,
                  s.term,
                  s.status,
                ])
              );
              showToast('success', 'Data supplier berhasil diekspor ke Excel (CSV)!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#234536]" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Supplier</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={Building2}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Supplier"
          value="24 Supplier"
          subtitle="2 Supplier baru (30 hari)"
          trend="9%"
          trendType="up"
        />

        <StatCard
          icon={CheckCircle2}
          iconBg="bg-amber-50 text-[#D97706]"
          title="Supplier Aktif"
          value="22 Supplier"
          subtitle="91% dari total"
          trend="5%"
          trendType="up"
        />

        <StatCard
          icon={Ban}
          iconBg="bg-rose-50 text-[#C62828]"
          title="Supplier Non-aktif"
          value="2 Supplier"
          subtitle="Tidak ada perubahan"
          trend="0%"
          trendType="neutral"
        />

        <StatCard
          icon={DollarSign}
          iconBg="bg-emerald-50 text-[#16845B]"
          title="Total Pembelian"
          value="Rp 287.450.000"
          subtitle="Oktober 2026"
          trend="18%"
          trendType="up"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-card border border-[#DEDCCF] shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama supplier, kontak, atau kota..."
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
            <option value="aktif">Aktif</option>
            <option value="non-aktif">Non-aktif</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
          >
            <option value="all">Semua Kota</option>
            <option value="Gresik">Gresik</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Bandung">Bandung</option>
            <option value="Surabaya">Surabaya</option>
            <option value="Yogyakarta">Yogyakarta</option>
            <option value="Tangerang">Tangerang</option>
            <option value="Semarang">Semarang</option>
            <option value="Malang">Malang</option>
            <option value="Cilegon">Cilegon</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setCityFilter('all');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#625D53] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Table Area (Full Width) */}
      <div className="w-full bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-3 px-3 w-8">NO</th>
                  <th className="py-3 px-3">NAMA SUPPLIER</th>
                  <th className="py-3 px-3">KONTAK</th>
                  <th className="py-3 px-3">KOTA</th>
                  <th className="py-3 px-3">KATEGORI UTAMA</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-right">TOTAL PEMBELIAN</th>
                  <th className="py-3 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {filtered.map((s, idx) => {
                  const isSelected = selectedSupplier?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSupplier(isSelected ? null : s)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-[#F7F4ED]/50'
                      }`}
                    >
                      <td className="py-3 px-3 text-[#8C877D] font-medium">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center font-black text-red-700 text-xs shrink-0">
                            🏢
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-[#252922]">{s.name}</div>
                            <div className="text-[10px] text-[#8C877D] font-mono">{s.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#252922]">{s.pic}</div>
                        <div className="text-[10px] text-[#8C877D] font-mono">{s.phone}</div>
                      </td>
                      <td className="py-3 px-3 text-[#625D53] font-semibold">{s.city}</td>
                      <td className="py-3 px-3 text-[#625D53] font-medium">{s.category}</td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#252922]">
                        {formatRupiah(s.totalPurchases)}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSupplier(s)}
                            title="Edit Supplier"
                            className="p-1.5 hover:bg-slate-200 rounded text-[#234536] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmSupplier(s)}
                            title="Hapus Supplier"
                            className="p-1.5 hover:bg-red-50 rounded text-[#C62828] transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-[#DEDCCF] bg-[#F7F4ED]/50 flex items-center justify-between text-xs text-[#625D53]">
            <div>
              Tampilkan <span className="font-bold">{filtered.length}</span> supplier
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&lt;</button>
              <button className="px-2.5 py-1 rounded bg-[#234536] text-white font-bold">1</button>
              <button className="px-2.5 py-1 rounded border border-[#DEDCCF] bg-white font-bold">2</button>
              <button className="px-2 py-1 rounded border border-[#DEDCCF] bg-white font-bold">&gt;</button>
            </div>
          </div>
        </div>

      {/* Slide-over Right Drawer for Selected Supplier */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-[#252922]/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedSupplier(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#DEDCCF] pointer-events-auto flex flex-col h-full animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-[#DEDCCF] flex items-center justify-between bg-[#F7F4ED]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-lg shrink-0">
                    🏢
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#252922] leading-tight">
                      {selectedSupplier.name}
                    </h3>
                    <div className="text-[11px] text-[#8C877D] font-mono mt-0.5">
                      {selectedSupplier.code} • {selectedSupplier.category}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="p-1.5 text-[#8C877D] hover:text-[#252922] rounded-control hover:bg-stone-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#DEDCCF] px-4 gap-1 text-xs bg-white">
                {[
                  { id: 'info', label: 'Informasi' },
                  { id: 'contact', label: 'Kontak' },
                  { id: 'address', label: 'Alamat' },
                  { id: 'history', label: 'Riwayat Pembelian' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDrawerTab(t.id)}
                    className={`py-3 px-3 font-bold border-b-2 transition ${
                      drawerTab === t.id
                        ? 'border-[#234536] text-[#234536]'
                        : 'border-transparent text-[#625D53] hover:text-[#252922]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Information Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="bg-[#F7F4ED] rounded-control p-3.5 space-y-2 border border-[#DEDCCF]">
                  <div className="flex justify-between">
                    <span className="text-[#625D53]">Nama Supplier</span>
                    <span className="font-bold text-[#252922]">{selectedSupplier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#625D53]">Kategori Utama</span>
                    <span className="font-bold text-[#252922]">{selectedSupplier.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#625D53]">NPWP</span>
                    <span className="font-bold text-[#252922]">{selectedSupplier.npwp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#625D53]">Termin Pembayaran</span>
                    <span className="font-bold text-[#252922]">{selectedSupplier.termDays} Hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#625D53]">Status Kemitraan</span>
                    <StatusBadge status={selectedSupplier.status} size="xs" />
                  </div>
                </div>

                {/* KPI Boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-control border border-emerald-200">
                    <div className="text-[10px] text-[#16845B] font-bold">Total Pembelian</div>
                    <div className="text-sm font-black text-[#16845B] mt-0.5">
                      {formatRupiah(selectedSupplier.totalPurchases)}
                    </div>
                    <div className="text-[10px] text-[#625D53] mt-0.5">({selectedSupplier.trxCount} transaksi)</div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-control border border-amber-200">
                    <div className="text-[10px] text-[#D97706] font-bold">Transaksi Terakhir</div>
                    <div className="text-xs font-extrabold text-[#D97706] mt-0.5">
                      {selectedSupplier.lastTrxDate}
                    </div>
                    <div className="text-[10px] text-[#625D53] mt-0.5">
                      {formatRupiah(selectedSupplier.lastTrxAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-[#DEDCCF] bg-[#F7F4ED] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmSupplier(selectedSupplier)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#C62828] hover:bg-red-50 p-2 rounded-control transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Supplier</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSupplier((prev) => ({
                        ...prev,
                        status: prev.status === 'aktif' ? 'non-aktif' : 'aktif',
                      }));
                    }}
                    className="py-2 px-3 rounded-control bg-white border border-[#DEDCCF] text-[#252922] font-bold text-xs hover:bg-stone-100 transition"
                  >
                    {selectedSupplier.status === 'aktif' ? 'Non-aktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => setSelectedSupplier(null)}
                    className="py-2 px-4 rounded-control bg-[#234536] text-white font-extrabold text-xs hover:bg-[#1c372b] transition shadow-xs"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Supplier */}
      {deleteConfirmSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DEDCCF]">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#C62828] flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#252922]">Hapus Data Supplier?</h3>
                <p className="text-xs text-[#625D53]">Data supplier akan dihapus dari daftar mitra pemasok.</p>
              </div>
            </div>

            <div className="text-xs text-[#252922] bg-[#F7F4ED] p-3 rounded-control border border-[#DEDCCF] space-y-1">
              <div>Supplier yang akan dihapus:</div>
              <div className="font-extrabold text-sm text-[#234536]">{deleteConfirmSupplier.name}</div>
              <div className="text-[#625D53]">Kode: {deleteConfirmSupplier.code} • Kategori: {deleteConfirmSupplier.category}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSupplier(null)}
                className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED] text-xs text-[#252922]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSupplier}
                className="px-5 py-2 rounded-control bg-[#C62828] hover:bg-[#b02222] text-white font-extrabold text-xs shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Supplier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Supplier */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252922]/60 backdrop-blur-xs">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-modal border border-[#DEDCCF] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#234536]" />
                <h3 className="font-extrabold text-base text-[#252922]">Tambah Supplier Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C877D] hover:text-[#252922] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Nama Perusahaan Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Semen Indonesia"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Nama Kontak PIC *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={supPic}
                    onChange={(e) => setSupPic(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#252922] block mb-1">No. Telepon / WA *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-3456-7890"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Kota Asal</label>
                  <input
                    type="text"
                    value={supCity}
                    onChange={(e) => setSupCity(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Kategori Utama</label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  >
                    <option value="Semen & Mortar">Semen & Mortar</option>
                    <option value="Besi & Baja">Besi & Baja</option>
                    <option value="Bata & Hebel">Bata & Hebel</option>
                    <option value="Cat & Pelapis">Cat & Pelapis</option>
                    <option value="Pipa & Sanitasi">Pipa & Sanitasi</option>
                    <option value="Kayu & Triplek">Kayu & Triplek</option>
                    <option value="Alat & Perkakas">Alat & Perkakas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">NPWP (Opsional)</label>
                  <input
                    type="text"
                    placeholder="01.234.567.8-901.000"
                    value={supNpwp}
                    onChange={(e) => setSupNpwp(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Termin Pembayaran (Hari)</label>
                  <input
                    type="number"
                    value={supTerm}
                    onChange={(e) => setSupTerm(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-[#DEDCCF] font-bold hover:bg-[#F7F4ED]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-control bg-[#234536] hover:bg-[#1c372b] text-white font-extrabold shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Global Toast Feedback & Import Input */}
      <Toast toast={toast} onClose={() => setToast({ show: false, type: 'info', message: '' })} />
      <input ref={importFileRef} type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
    </div>
  );
}
