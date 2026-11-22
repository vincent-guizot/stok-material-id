import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah, formatDateIndo } from '../utils/formatters.js';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  Settings,
  Store,
  Sliders,
  Receipt,
  Boxes,
  Info,
  CheckCircle2,
  Eye,
  Save,
  Upload,
  Printer,
  AlertCircle,
  X,
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import UsersTab from './settings/UsersTab.jsx';
import BranchesTab from './settings/BranchesTab.jsx';
import BackupTab from './settings/BackupTab.jsx';
import SecurityTab from './settings/SecurityTab.jsx';

export default function SettingsPage({ subTab, setSubTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [localTab, setLocalTab] = useState(urlTab || subTab || 'general');
  const activeTabKey = urlTab || subTab || localTab;

  const handleTabChange = (tabId) => {
    setLocalTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
    if (setSubTab) setSubTab(tabId);
  };

  // Load persistent settings from backend PostgreSQL
  const { data: serverSettings } = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
  });

  return (
    <SettingsFormContent
      key={serverSettings ? 'loaded-settings' : 'initial-settings'}
      initialSettings={serverSettings}
      activeTabKey={activeTabKey}
      handleTabChange={handleTabChange}
    />
  );
}

function SettingsFormContent({ initialSettings, activeTabKey, handleTabChange }) {
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((st) => st.user?.role) === 'admin';

  // Tarif PPN (0 = tanpa PPN). Hanya admin yang boleh mengubah; server juga menolak selain admin.
  const [taxRate, setTaxRate] = useState(parseFloat(initialSettings?.taxRate) || 0);

  // Feedback Toast state
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // Store info
  const [storeName, setStoreName] = useState(initialSettings?.storeName || '');
  const [storeAddress, setStoreAddress] = useState(
    initialSettings?.storeAddress || ''
  );
  const [storePhone, setStorePhone] = useState(initialSettings?.storePhone || '');
  const [storeEmail, setStoreEmail] = useState(initialSettings?.storeEmail || '');

  // Logo file upload
  const logoInputRef = useRef(null);
  const [currentLogo, setCurrentLogo] = useState(initialSettings?.logoUrl || logoImg);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('error', 'Berkas logo harus berupa gambar.');
    if (file.size > 300 * 1024) return showToast('error', 'Ukuran logo maksimal 300 KB.');
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentLogo(reader.result);
      showToast('info', `Logo "${file.name}" dipilih. Klik Simpan Perubahan untuk menyimpannya.`);
    };
    reader.readAsDataURL(file);
  };

  // Receipt settings
  const [headerReceipt, setHeaderReceipt] = useState(
    initialSettings?.headerReceipt || ''
  );
  const [footerReceipt, setFooterReceipt] = useState(
    initialSettings?.footerReceipt || ''
  );
  const [showLogo, setShowLogo] = useState(initialSettings?.showLogo ?? true);
  const [showAddress, setShowAddress] = useState(initialSettings?.showAddress ?? true);
  const [showPhone, setShowPhone] = useState(initialSettings?.showPhone ?? true);
  const [showCashier, setShowCashier] = useState(initialSettings?.showCashier ?? true);
  const [showThanks, setShowThanks] = useState(initialSettings?.showThanks ?? true);
  const [autoPrint, setAutoPrint] = useState(initialSettings?.autoPrint ?? false);

  // Stock rules
  const [lowStockAlert, setLowStockAlert] = useState(initialSettings?.lowStockAlert || '50');
  const [emptyStockAlert, setEmptyStockAlert] = useState(initialSettings?.emptyStockAlert || '0');
  const [allowMinusStock, setAllowMinusStock] = useState(initialSettings?.allowMinusStock || 'no');
  const [showHppCashier, setShowHppCashier] = useState(initialSettings?.showHppCashier || 'no');

  const { data: lastTx } = useQuery({
    queryKey: ['transactions', 'latest'],
    queryFn: async () => (await api.get('/transactions?limit=1')).data.data?.[0] || null,
  });
  const { data: helpData } = useQuery({ queryKey: ['help'], queryFn: async () => (await api.get('/help')).data.data });
  const [copyrightYear] = useState(() => new Date().getFullYear());
  const aboutVersion = (helpData?.about || []).find((a) => a.title === 'Versi Aplikasi')?.body || '-';

  // Receipt Preview Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const subTabs = [
    { id: 'general', label: 'Umum' },
    { id: 'users', label: 'Pengguna' },
    { id: 'branches', label: 'Cabang Toko' },
    { id: 'receipt', label: 'Printer & Nota' },
    { id: 'backup', label: 'Backup Data' },
    { id: 'security', label: 'Keamanan' },
    { id: 'other', label: 'Lainnya' },
  ];

  const saveSettingsMutation = useMutation({
    mutationFn: async (payload) => {
      return api.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      showToast('success', 'Konfigurasi pengaturan toko & sistem berhasil disimpan secara permanen di database!');
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan pengaturan ke database.');
    },
  });

  // Save changes handler
  const handleSave = () => {
    saveSettingsMutation.mutate({
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      headerReceipt,
      footerReceipt,
      showLogo,
      showAddress,
      showPhone,
      showCashier,
      showThanks,
      autoPrint,
      lowStockAlert,
      emptyStockAlert,
      allowMinusStock,
      showHppCashier,
      logoUrl: currentLogo !== logoImg ? currentLogo : null,
      ...(isAdmin ? { taxRate } : {}),
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert Notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-xs font-bold transition-all duration-300 animate-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : toast.type === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-[#234536] text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast({ show: false, type: 'success', message: '' })}
            className="ml-2 hover:opacity-75"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden File Input for Store Logo */}
      <input
        type="file"
        ref={logoInputRef}
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 !mt-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
              Pengaturan Sistem
            </h1>
            <p className="text-xs text-[#625D53]">
              Kelola konfigurasi toko, pengguna, perangkat, dan preferensi sistem.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* Subtabs Bar */}
      <div className="flex border-b border-[#DEDCCF] gap-2 overflow-x-auto pb-1">
        {subTabs.map((tab) => {
          const isActive = activeTabKey === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-4 rounded-t-lg font-bold text-xs whitespace-nowrap transition border-b-2 ${
                isActive
                  ? 'border-[#234536] text-[#234536] bg-white shadow-2xs font-extrabold'
                  : 'border-transparent text-[#625D53] hover:text-[#252922] hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: UMUM (Informasi Toko & Preferensi)               */}
      {/* ======================================================== */}
      {activeTabKey === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Informasi Toko */}
          <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
              <Store className="w-5 h-5 text-[#234536]" />
              <div>
                <h3 className="font-extrabold text-sm text-[#252922]">Informasi Toko</h3>
                <p className="text-[11px] text-[#625D53]">Data ini akan digunakan pada nota, laporan, dan identitas sistem.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <label className="font-bold text-[#252922] block mb-1">Nama Toko *</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold text-[#252922] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#252922] block mb-1">Alamat Toko *</label>
                    <textarea
                      rows={2}
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-control border border-[#DEDCCF] bg-[#F7F4ED] text-center space-y-2">
                  <div className="text-[11px] font-bold text-[#625D53]">Logo Toko</div>
                  <div className="w-14 h-14 mx-auto rounded-xl overflow-hidden border border-[#DEDCCF] bg-white flex items-center justify-center shadow-xs">
                    <img src={currentLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                  </div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-1.5 px-2 rounded bg-white border border-[#DEDCCF] text-[10px] font-bold hover:bg-stone-50 flex items-center justify-center gap-1 transition"
                  >
                    <Upload className="w-3 h-3 text-[#234536]" />
                    <span>Pilih Logo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Telepon</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#252922] block mb-1">Email</label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Preferensi Sistem */}
          <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
              <Sliders className="w-5 h-5 text-[#234536]" />
              <div>
                <h3 className="font-extrabold text-sm text-[#252922]">Preferensi Sistem</h3>
                <p className="text-[11px] text-[#625D53]">Atur format mata uang, tanggal, dan PPN.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Mata Uang</label>
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>Rupiah (IDR)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Format Tanggal</label>
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>31/10/2026 (DD/MM/YYYY)</option>
                  <option>2026-10-31 (YYYY-MM-DD)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Format Nomor</label>
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>1.000,00 (Indonesia)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Pajak (PPN)</label>
                <select
                  value={taxRate > 0 ? 'ppn11' : 'none'}
                  onChange={(e) => setTaxRate(e.target.value === 'ppn11' ? 11 : 0)}
                  disabled={!isAdmin}
                  title={isAdmin ? '' : 'Hanya Bos / Admin yang dapat mengubah tarif PPN'}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold disabled:opacity-60"
                >
                  <option value="ppn11">Menggunakan PPN 11%</option>
                  <option value="none">Tidak menggunakan PPN</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Mode Stok</label>
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>Stok per Satuan Utama (Base Unit)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Akses Multi Cabang</label>
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>Aktif (Multi Cabang Depo)</option>
                  <option>Tidak Aktif (1 toko)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTabKey === 'users' && <UsersTab onToast={showToast} />}

      {activeTabKey === 'branches' && <BranchesTab onToast={showToast} />}

      {/* ======================================================== */}
      {/* TAB 4: PRINTER & NOTA                                    */}
      {/* ======================================================== */}
      {activeTabKey === 'receipt' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4 max-w-3xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
            <Receipt className="w-5 h-5 text-[#234536]" />
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">Pengaturan Nota & Printer Thermal</h3>
              <p className="text-[11px] text-[#625D53]">Atur tampilan nota yang akan dicetak untuk mandor dan pelanggan.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Header Nota</label>
                <textarea
                  rows={4}
                  value={headerReceipt}
                  onChange={(e) => setHeaderReceipt(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-mono text-[11px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                />
              </div>

              <div className="space-y-2 pt-1">
                {[
                  { label: 'Tampilkan Logo pada Nota', val: showLogo, set: setShowLogo },
                  { label: 'Tampilkan Alamat pada Nota', val: showAddress, set: setShowAddress },
                  { label: 'Tampilkan Nomor Telepon', val: showPhone, set: setShowPhone },
                  { label: 'Tampilkan Kasir', val: showCashier, set: setShowCashier },
                  { label: 'Tampilkan Terima Kasih', val: showThanks, set: setShowThanks },
                  { label: 'Auto Cetak Nota Setelah Bayar', val: autoPrint, set: setAutoPrint },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-[#252922] text-[11px]">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => item.set(e.target.checked)}
                      className="w-4 h-4 accent-[#234536] rounded"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-[#252922] block mb-1">Footer Nota</label>
              <textarea
                rows={2}
                value={footerReceipt}
                onChange={(e) => setFooterReceipt(e.target.value)}
                className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-mono text-[11px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control font-bold text-xs transition"
              >
                <Eye className="w-3.5 h-3.5 text-[#234536]" />
                <span>Lihat Contoh Nota</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-control bg-[#234536] text-white font-bold text-xs shadow-xs hover:bg-[#1c372b] transition active:scale-95"
              >
                Simpan Desain Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTabKey === 'backup' && <BackupTab onToast={showToast} />}

      {activeTabKey === 'security' && <SecurityTab onToast={showToast} />}

      {/* ======================================================== */}
      {/* TAB 7: LAINNYA (Aturan Stok & Penjualan)                  */}
      {/* ======================================================== */}
      {activeTabKey === 'other' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
              <Boxes className="w-5 h-5 text-[#234536]" />
              <div>
                <h3 className="font-extrabold text-sm text-[#252922]">Pengaturan Stok & Penjualan</h3>
                <p className="text-[11px] text-[#625D53]">Atur perilaku peringatan stok menipis dan toleransi minus.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Peringatan Stok Menipis</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.value)}
                    className="flex-1 p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  />
                  <span className="text-[#625D53] font-bold">Unit</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Metode Harga Jual</label>
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>Harga Tetap (Manual)</option>
                  <option>Markup Otomatis dari HPP</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Peringatan Stok Habis</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={emptyStockAlert}
                    onChange={(e) => setEmptyStockAlert(e.target.value)}
                    className="flex-1 p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  />
                  <span className="text-[#625D53] font-bold">Unit</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Boleh Jual Stok Minus</label>
                <select
                  value={allowMinusStock}
                  onChange={(e) => setAllowMinusStock(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                >
                  <option value="no">Tidak Boleh (Tolak Penjualan)</option>
                  <option value="yes">Boleh (Peringatkan Kasir)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Tampilkan HPP ke Kasir</label>
                <select
                  value={showHppCashier}
                  onChange={(e) => setShowHppCashier(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                >
                  <option value="no">Tidak Tampilkan</option>
                  <option value="yes">Tampilkan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Konfirmasi Hapus Transaksi</label>
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>Ya, tampilkan konfirmasi</option>
                  <option>Langsung hapus</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
              <Info className="w-5 h-5 text-[#234536]" />
              <div>
                <h3 className="font-extrabold text-sm text-[#252922]">Tentang Sistem</h3>
                <p className="text-[11px] text-[#625D53]">Informasi versi dan lisensi aplikasi.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#234536] flex items-center justify-center text-white text-xl shadow-xs shrink-0">🧱</div>
              <div>
                <div className="font-black text-sm text-[#252922]">StokMaterial.id</div>
                <div className="text-xs text-[#625D53]">Versi {aboutVersion}</div>
                <div className="text-[10px] text-[#8C877D]">© {copyrightYear} {storeName || 'Toko'}. Hak Cipta Dilindungi.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Pratinjau Nota Cetak Thermal 80mm                 */}
      {/* ======================================================== */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-card max-w-sm w-full p-5 border border-[#DEDCCF] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#234536]" />
                <h3 className="font-extrabold text-sm text-[#252922]">Pratinjau Nota Thermal (80mm)</h3>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 rounded-control hover:bg-[#F7F4ED] text-[#8C877D] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Thermal Paper */}
            <div className="p-4 bg-stone-50 border border-dashed border-[#DEDCCF] rounded font-mono text-[11px] text-stone-800 space-y-3 shadow-inner">
              {/* Header */}
              <div className="text-center space-y-1">
                {showLogo && (
                  <div className="w-10 h-10 mx-auto rounded overflow-hidden grayscale mb-1">
                    <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="font-black text-xs tracking-wider uppercase">{storeName}</div>
                {showAddress && <div className="text-[10px] leading-tight text-stone-600">{storeAddress}</div>}
                {showPhone && <div className="text-[10px] text-stone-600">Telp: {storePhone}</div>}
              </div>

              <div className="border-b border-dashed border-stone-400 my-1" />

              {/* Meta + isi nota dari transaksi terakhir di database */}
              {lastTx ? (
                <>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>No. Nota:</span>
                      <span className="font-bold">{lastTx.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu:</span>
                      <span>{formatDateIndo(lastTx.transactionDate)}</span>
                    </div>
                    {showCashier && (
                      <div className="flex justify-between">
                        <span>Kasir:</span>
                        <span>{lastTx.cashier?.name || '-'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Pelanggan:</span>
                      <span>{lastTx.customer?.name || 'Umum'}</span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-stone-400 my-1" />

                  <div className="space-y-1.5 text-[10px]">
                    {(lastTx.items || []).map((it) => (
                      <div key={it.id}>
                        <div className="font-bold">{it.productName}</div>
                        <div className="flex justify-between text-stone-600">
                          <span>{Number(it.qty)} {it.unitName} x {Number(it.unitPrice).toLocaleString('id-ID')}</span>
                          <span>{Number(it.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-b border-dashed border-stone-400 my-1" />

                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatRupiah(lastTx.subtotal)}</span>
                    </div>
                    {Number(lastTx.discount) > 0 && (
                      <div className="flex justify-between">
                        <span>Diskon:</span>
                        <span>-{formatRupiah(lastTx.discount)}</span>
                      </div>
                    )}
                    {Number(lastTx.taxAmount) > 0 && (
                      <div className="flex justify-between">
                        <span>PPN ({Number(lastTx.taxRate)}%):</span>
                        <span>{formatRupiah(lastTx.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-stone-300">
                      <span>TOTAL:</span>
                      <span>{formatRupiah(lastTx.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span>Dibayar:</span>
                      <span>{formatRupiah(lastTx.paidAmount)}</span>
                    </div>
                    {Number(lastTx.debtAmount) > 0 && (
                      <div className="flex justify-between">
                        <span>Kasbon:</span>
                        <span>{formatRupiah(lastTx.debtAmount)}</span>
                      </div>
                    )}
                    {Number(lastTx.changeAmount) > 0 && (
                      <div className="flex justify-between font-bold">
                        <span>Kembali:</span>
                        <span>{formatRupiah(lastTx.changeAmount)}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-[10px] text-stone-500">
                  Belum ada transaksi. Pratinjau akan menampilkan nota terakhir setelah ada penjualan.
                </div>
              )}

              <div className="border-b border-dashed border-stone-400 my-1" />

              {/* Footer */}
              {showThanks && (
                <div className="text-center text-[10px] whitespace-pre-line leading-relaxed text-stone-600 italic">
                  {footerReceipt}
                </div>
              )}

              {/* Simulated Barcode */}
              <div className="pt-2 text-center space-y-1">
                <div className="h-6 w-3/4 mx-auto flex items-center justify-between opacity-70">
                  <span className="w-1 h-full bg-black"></span>
                  <span className="w-0.5 h-full bg-black"></span>
                  <span className="w-2 h-full bg-black"></span>
                  <span className="w-0.5 h-full bg-black"></span>
                  <span className="w-1.5 h-full bg-black"></span>
                  <span className="w-0.5 h-full bg-black"></span>
                  <span className="w-2.5 h-full bg-black"></span>
                  <span className="w-1 h-full bg-black"></span>
                  <span className="w-0.5 h-full bg-black"></span>
                  <span className="w-2 h-full bg-black"></span>
                  <span className="w-1 h-full bg-black"></span>
                </div>
                <div className="text-[9px] text-stone-500 font-mono tracking-widest">
                  *{(lastTx?.invoiceNumber || '').replace(/\D/g, '')}*
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DEDCCF]">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-3 py-1.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] text-[#252922] font-bold text-xs"
              >
                Tutup Pratinjau
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('info', 'Perintah cetak dikirim ke printer thermal default.');
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-control bg-[#234536] text-white font-extrabold text-xs shadow-xs hover:bg-[#1c372b] transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
