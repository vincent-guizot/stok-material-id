import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Store,
  Sliders,
  Receipt,
  Boxes,
  Database,
  Info,
  CheckCircle2,
  RefreshCw,
  Eye,
  Save,
  MapPin,
  ShieldCheck,
  Plus,
  Upload,
  Printer,
  Download,
  AlertCircle,
  X,
  Trash2,
  Lock,
  UserCheck,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

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

  // Feedback Toast state
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // Store info
  const [storeName, setStoreName] = useState('Toko Sentosa');
  const [storeAddress, setStoreAddress] = useState(
    'Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111'
  );
  const [storePhone, setStorePhone] = useState('031-1234567');
  const [storeEmail, setStoreEmail] = useState('tokosentosa@gmail.com');

  // Logo file upload
  const logoInputRef = useRef(null);
  const [currentLogo, setCurrentLogo] = useState(logoImg);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCurrentLogo(previewUrl);
      showToast('success', `Logo toko "${file.name}" berhasil dipilih dan dimuat.`);
    }
  };

  // Receipt settings
  const [headerReceipt, setHeaderReceipt] = useState(
    'TOKO SENTOSA\nToko Bangunan & Material Konstruksi\nJl. Raya Gresik No. 123\nTelp. 031-1234567'
  );
  const [footerReceipt, setFooterReceipt] = useState(
    'Terima kasih telah berbelanja\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.'
  );
  const [showLogo, setShowLogo] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showCashier, setShowCashier] = useState(true);
  const [showThanks, setShowThanks] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);

  // Stock rules
  const [lowStockAlert, setLowStockAlert] = useState('50');
  const [emptyStockAlert, setEmptyStockAlert] = useState('0');
  const [allowMinusStock, setAllowMinusStock] = useState('no');
  const [showHppCashier, setShowHppCashier] = useState('no');

  // User Accounts State & Modal
  const [users, setUsers] = useState([
    { id: 1, name: 'Vincent (Owner)', username: 'admin', role: 'Admin (Bos)', status: 'Aktif', badge: '👑' },
    { id: 2, name: 'Siti Rahmawati', username: 'kasir', role: 'Kasir Toko', status: 'Aktif', badge: '🛒' },
    { id: 3, name: 'Agus Santoso', username: 'gudang', role: 'Staf Gudang', status: 'Aktif', badge: '📦' },
  ]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    role: 'Kasir Toko',
    status: 'Aktif',
    password: '',
  });
  const [userToDelete, setUserToDelete] = useState(null);

  // Branches State & Modal
  const [branches, setBranches] = useState([
    { id: 1, name: 'Depo Pusat Sentosa', address: 'Jl. Raya Gresik No. 123', type: 'Toko Utama & Gudang Pusat', status: 'Aktif' },
    { id: 2, name: 'Cabang Sentosa Surabaya', address: 'Jl. Raya Darmo Indah No. 8', type: 'Depo Material Barat', status: 'Aktif' },
    { id: 3, name: 'Cabang Sentosa Sidoarjo', address: 'Jl. Pahlawan No. 56', type: 'Depo Material Selatan', status: 'Dalam Persiapan' },
  ]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    type: 'Depo Material',
    status: 'Aktif',
  });

  // Receipt Preview Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Password Security Form
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirmPass: '',
  });

  // Database Backup State
  const [lastBackupInfo, setLastBackupInfo] = useState({
    date: '20 Okt 2026, 21:15',
    size: '12.4 MB',
  });
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Check Updates State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const subTabs = [
    { id: 'general', label: 'Umum' },
    { id: 'users', label: 'Pengguna' },
    { id: 'branches', label: 'Cabang Toko' },
    { id: 'receipt', label: 'Printer & Nota' },
    { id: 'backup', label: 'Backup Data' },
    { id: 'security', label: 'Keamanan' },
    { id: 'other', label: 'Lainnya' },
  ];

  // Save changes handler
  const handleSave = () => {
    showToast('success', 'Konfigurasi pengaturan toko & sistem berhasil disimpan!');
  };

  // User handlers
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      username: '',
      role: 'Kasir Toko',
      status: 'Aktif',
      password: '',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      username: user.username,
      role: user.role,
      status: user.status,
      password: '',
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.username.trim()) {
      showToast('error', 'Nama dan username wajib diisi!');
      return;
    }

    const badgeMap = {
      'Admin (Bos)': '👑',
      'Kasir Toko': '🛒',
      'Staf Gudang': '📦',
      'Mandor Lapangan': '👷',
    };

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                name: userForm.name,
                username: userForm.username.toLowerCase().replace(/\s+/g, ''),
                role: userForm.role,
                status: userForm.status,
                badge: badgeMap[userForm.role] || '👤',
              }
            : u
        )
      );
      showToast('success', `Akun pengguna "${userForm.name}" berhasil diperbarui.`);
    } else {
      const newUser = {
        id: Date.now(),
        name: userForm.name,
        username: userForm.username.toLowerCase().replace(/\s+/g, ''),
        role: userForm.role,
        status: userForm.status,
        badge: badgeMap[userForm.role] || '👤',
      };
      setUsers((prev) => [...prev, newUser]);
      showToast('success', `Akun pengguna baru "${newUser.name}" berhasil ditambahkan.`);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    showToast('success', `Akun "${userToDelete.name}" telah dihapus.`);
    setUserToDelete(null);
  };

  // Branch handlers
  const handleOpenAddBranch = () => {
    setBranchForm({
      name: '',
      address: '',
      type: 'Depo Material Tambahan',
      status: 'Aktif',
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e) => {
    e.preventDefault();
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      showToast('error', 'Nama cabang dan alamat wajib diisi!');
      return;
    }

    const newBranch = {
      id: Date.now(),
      name: branchForm.name,
      address: branchForm.address,
      type: branchForm.type,
      status: branchForm.status,
    };

    setBranches((prev) => [...prev, newBranch]);
    showToast('success', `Cabang/Depo "${newBranch.name}" berhasil didaftarkan.`);
    setIsBranchModalOpen(false);
  };

  // Password update handler
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.current) {
      showToast('error', 'Harap masukkan kata sandi saat ini.');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      showToast('error', 'Kata sandi baru minimal harus 6 karakter.');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      showToast('error', 'Konfirmasi kata sandi baru tidak cocok!');
      return;
    }

    setPasswordForm({ current: '', newPass: '', confirmPass: '' });
    showToast('success', 'Kata sandi sistem Anda berhasil diperbarui dengan aman.');
  };

  // Database Backup handler
  const handleBackupDownload = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const backupData = {
        app: 'StokMaterial.id',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        store: { storeName, storeAddress, storePhone, storeEmail },
        rules: { lowStockAlert, emptyStockAlert, allowMinusStock, showHppCashier },
        users,
        branches,
        receipt: { headerReceipt, footerReceipt, showLogo, showAddress, showPhone, showCashier, showThanks, autoPrint },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `stokmaterial-backup-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const nowFormatted = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + `, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

      setLastBackupInfo({
        date: nowFormatted,
        size: '12.8 MB',
      });
      setIsBackingUp(false);
      showToast('success', 'Berkas backup database JSON berhasil dibuat dan diunduh!');
    }, 700);
  };

  // Check update handler
  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      showToast('info', 'Sistem StokMaterial.id sudah menggunakan versi teranyar (v1.0.0 Stable).');
    }, 900);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
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
                <select className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold">
                  <option>Menggunakan PPN 11%</option>
                  <option>Tidak menggunakan PPN</option>
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

      {/* ======================================================== */}
      {/* TAB 2: PENGGUNA (User Management)                        */}
      {/* ======================================================== */}
      {activeTabKey === 'users' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Manajemen Pengguna & Hak Akses
              </h3>
              <p className="text-xs text-[#625D53]">
                Kelola akun kasir, staf gudang, dan administrator sistem POS toko.
              </p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Akun Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">NAMA PENGGUNA</th>
                  <th className="py-2.5 px-3">USERNAME</th>
                  <th className="py-2.5 px-3">ROLE / PERAN</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  <th className="py-2.5 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-bold text-[#252922] flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                        {u.badge}
                      </span>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#625D53]">@{u.username}</td>
                    <td className="py-3 px-3 font-bold text-[#234536]">{u.role}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'Aktif'
                            ? 'bg-emerald-100 text-[#16845B]'
                            : 'bg-stone-200 text-[#625D53]'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="px-2.5 py-1 rounded bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] font-bold text-[#252922] text-[11px] transition"
                        >
                          Ubah Hak Akses
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CABANG TOKO                                       */}
      {/* ======================================================== */}
      {activeTabKey === 'branches' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">
                Daftar Cabang Toko & Depo Material
              </h3>
              <p className="text-xs text-[#625D53]">
                Konfigurasi lokasi depo untuk sinkronisasi stok dan transaksi antar cabang.
              </p>
            </div>
            <button
              onClick={handleOpenAddBranch}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Cabang Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-card bg-[#F7F4ED]/60 border border-[#DEDCCF] space-y-2 hover:bg-[#F7F4ED] transition relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-xs text-[#252922]">{b.name}</div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'Aktif' ? 'bg-emerald-100 text-[#16845B]' : 'bg-amber-100 text-[#D97706]'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-[#625D53] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#234536] shrink-0" />
                  <span>{b.address}</span>
                </div>
                <div className="text-[11px] text-[#8C877D] font-medium pt-1">
                  {b.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* ======================================================== */}
      {/* TAB 5: BACKUP DATA                                       */}
      {/* ======================================================== */}
      {activeTabKey === 'backup' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
            <Database className="w-5 h-5 text-[#234536]" />
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">Pengaturan Backup & Restore Database</h3>
              <p className="text-[11px] text-[#625D53]">Lakukan backup data JSON/SQL secara berkala untuk menjaga keamanan data toko.</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-control border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[#16845B] shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#16845B]">Status Backup Database</div>
                <div className="text-sm font-black text-[#252922]">{lastBackupInfo.date}</div>
                <div className="text-[11px] text-[#625D53]">Ukuran File Dump: {lastBackupInfo.size} (Tersimpan & Siap Diunduh)</div>
              </div>
            </div>

            <button
              type="button"
              disabled={isBackingUp}
              onClick={handleBackupDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-control bg-[#234536] text-white text-xs font-bold hover:bg-[#1c372b] transition shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isBackingUp ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isBackingUp ? 'Memproses...' : 'Backup Sekarang'}</span>
            </button>
          </div>

          <div className="text-xs space-y-2 pt-2">
            <div className="font-bold text-[#252922]">Jadwal Auto-Backup:</div>
            <div className="p-3 bg-[#F7F4ED] rounded-control border border-[#DEDCCF] flex items-center justify-between">
              <span>Auto-Backup Harian (Setiap pukul 23:00 WIB)</span>
              <span className="font-bold text-[#16845B]">Aktif</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: KEAMANAN                                          */}
      {/* ======================================================== */}
      {activeTabKey === 'security' && (
        <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
            <ShieldCheck className="w-5 h-5 text-[#234536]" />
            <div>
              <h3 className="font-extrabold text-sm text-[#252922]">Keamanan Akun & Sandi</h3>
              <p className="text-[11px] text-[#625D53]">Ubah kata sandi admin dan konfigurasi proteksi otorisasi kasir.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-[#252922] block mb-1">Kata Sandi Saat Ini *</label>
              <input
                type="password"
                required
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                placeholder="Masukkan kata sandi saat ini"
                className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Kata Sandi Baru *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPass: e.target.value }))}
                  placeholder="Minimal 6 karakter"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Konfirmasi Sandi Baru *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPass}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPass: e.target.value }))}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-control bg-[#234536] text-white font-bold text-xs hover:bg-[#1c372b] transition shadow-xs active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Perbarui Kata Sandi</span>
              </button>
            </div>
          </form>
        </div>
      )}

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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#234536] flex items-center justify-center text-white text-xl shadow-xs shrink-0">
                  🧱
                </div>
                <div>
                  <div className="font-black text-sm text-[#252922]">StokMaterial.id</div>
                  <div className="text-xs text-[#625D53]">Versi 1.0.0 (Production Build)</div>
                  <div className="text-[10px] text-[#8C877D]">© 2026 Toko Sentosa. Hak Cipta Dilindungi.</div>
                </div>
              </div>

              <div className="sm:text-right">
                <button
                  type="button"
                  disabled={isCheckingUpdate}
                  onClick={handleCheckUpdate}
                  className="px-3 py-1.5 rounded-control bg-white border border-[#DEDCCF] text-xs font-bold text-[#252922] hover:bg-[#F7F4ED] flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#234536] ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Memeriksa...' : 'Cek Pembaruan'}</span>
                </button>
                <div className="text-[10px] text-[#16845B] font-bold mt-1">
                  ✓ Menggunakan versi terbaru
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Tambah / Ubah Akun Pengguna                       */}
      {/* ======================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-card max-w-md w-full p-5 border border-[#DEDCCF] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[#234536]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#252922]">
                    {editingUserId ? 'Ubah Akun Pengguna' : 'Tambah Akun Baru'}
                  </h3>
                  <p className="text-[11px] text-[#625D53]">
                    {editingUserId ? 'Perbarui wewenang atau hak akses user' : 'Daftarkan kasir atau staf gudang baru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-control hover:bg-[#F7F4ED] text-[#8C877D] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="Contoh: budi_kasir"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536] font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Role / Peran</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  >
                    <option value="Kasir Toko">Kasir Toko</option>
                    <option value="Staf Gudang">Staf Gudang</option>
                    <option value="Admin (Bos)">Admin (Bos)</option>
                    <option value="Mandor Lapangan">Mandor Lapangan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#252922] block mb-1">Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">
                  {editingUserId ? 'Ganti Sandi (Opsional)' : 'Kata Sandi Awal *'}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Minimal 6 karakter"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#DEDCCF]">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3 py-1.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] text-[#252922] font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-control bg-[#234536] text-white font-extrabold text-xs shadow-xs hover:bg-[#1c372b] transition"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Tambah Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Konfirmasi Hapus User                             */}
      {/* ======================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-card max-w-sm w-full p-5 border border-[#DEDCCF] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#252922]">Hapus Akun Pengguna</h4>
                <p className="text-[11px] text-[#625D53]">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="text-xs text-[#252922]">
              Apakah Anda yakin ingin menghapus akun <strong>{userToDelete.name}</strong> (@{userToDelete.username})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DEDCCF]">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] text-[#252922] font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-1.5 rounded-control bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-xs"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Tambah Cabang Toko                                */}
      {/* ======================================================== */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-card max-w-md w-full p-5 border border-[#DEDCCF] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCCF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[#234536]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#252922]">Tambah Cabang / Depo Baru</h3>
                  <p className="text-[11px] text-[#625D53]">Tambahkan lokasi gudang atau toko satelit</p>
                </div>
              </div>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1 rounded-control hover:bg-[#F7F4ED] text-[#8C877D] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Nama Cabang / Depo *</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Depo Sentosa Menganti"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Alamat Cabang *</label>
                <textarea
                  rows={2}
                  required
                  value={branchForm.address}
                  onChange={(e) => setBranchForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Jl. Raya Menganti No. 88, Gresik"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#234536]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#252922] block mb-1">Tipe Lokasi</label>
                  <input
                    type="text"
                    value={branchForm.type}
                    onChange={(e) => setBranchForm((f) => ({ ...f, type: e.target.value }))}
                    placeholder="Depo Material / Satelit"
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#252922] block mb-1">Status Operasional</label>
                  <select
                    value={branchForm.status}
                    onChange={(e) => setBranchForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Dalam Persiapan">Dalam Persiapan</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#DEDCCF]">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-3 py-1.5 rounded-control bg-[#F7F4ED] hover:bg-[#ECEAE2] text-[#252922] font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-control bg-[#234536] text-white font-extrabold text-xs shadow-xs hover:bg-[#1c372b] transition"
                >
                  Daftarkan Cabang
                </button>
              </div>
            </form>
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

              {/* Meta */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-bold">NOTA-20261020-001</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>20/10/2026 14:30</span>
                </div>
                {showCashier && (
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>Siti Rahmawati</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>Mandor Hendro (Cash)</span>
                </div>
              </div>

              <div className="border-b border-dashed border-stone-400 my-1" />

              {/* Items */}
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <div className="font-bold">Semen Portland Gresik 50kg</div>
                  <div className="flex justify-between text-stone-600">
                    <span>10 Sak x 68.000</span>
                    <span>680.000</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold">Besi Beton Ulir 10mm Sni</div>
                  <div className="flex justify-between text-stone-600">
                    <span>5 Btg x 82.500</span>
                    <span>412.500</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold">Kawat Bendrat Hitam (Roll)</div>
                  <div className="flex justify-between text-stone-600">
                    <span>1 Roll x 380.000</span>
                    <span>380.000</span>
                  </div>
                </div>
              </div>

              <div className="border-b border-dashed border-stone-400 my-1" />

              {/* Totals */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp 1.472.500</span>
                </div>
                <div className="flex justify-between">
                  <span>PPN (11%):</span>
                  <span>Rp 161.975</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-stone-300">
                  <span>TOTAL:</span>
                  <span>Rp 1.634.475</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>Bayar Tunai:</span>
                  <span>Rp 1.700.000</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembali:</span>
                  <span>Rp 65.525</span>
                </div>
              </div>

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
                  *20261020001*
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
