import React, { useState } from 'react';
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
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function SettingsPage({ subTab = 'general', setSubTab }) {
  const [localTab, setLocalTab] = useState(subTab || 'general');
  const activeTabKey = subTab || localTab;

  const handleTabChange = (tabId) => {
    setLocalTab(tabId);
    if (setSubTab) setSubTab(tabId);
  };

  // Store info
  const [storeName, setStoreName] = useState('Toko Sentosa');
  const [storeAddress, setStoreAddress] = useState(
    'Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111'
  );
  const [storePhone, setStorePhone] = useState('031-1234567');
  const [storeEmail, setStoreEmail] = useState('tokosentosa@gmail.com');

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

  const subTabs = [
    { id: 'general', label: 'Umum' },
    { id: 'users', label: 'Pengguna' },
    { id: 'branches', label: 'Cabang Toko' },
    { id: 'receipt', label: 'Printer & Nota' },
    { id: 'backup', label: 'Backup Data' },
    { id: 'security', label: 'Keamanan' },
    { id: 'other', label: 'Lainnya' },
  ];

  const userAccounts = [
    { name: 'Vincent (Owner)', username: 'admin', role: 'Admin (Bos)', status: 'Aktif', badge: '👑' },
    { name: 'Siti Rahmawati', username: 'kasir', role: 'Kasir Toko', status: 'Aktif', badge: '🛒' },
    { name: 'Agus Santoso', username: 'gudang', role: 'Staf Gudang', status: 'Aktif', badge: '📦' },
  ];

  const branchList = [
    { name: 'Depo Pusat Sentosa', address: 'Jl. Raya Gresik No. 123', type: 'Toko Utama & Gudang Pusat', status: 'Aktif' },
    { name: 'Cabang Sentosa Surabaya', address: 'Jl. Raya Darmo Indah No. 8', type: 'Depo Material Barat', status: 'Aktif' },
    { name: 'Cabang Sentosa Sidoarjo', address: 'Jl. Pahlawan No. 56', type: 'Depo Material Selatan', status: 'Dalam Persiapan' },
  ];

  const handleSave = () => {
    alert('Pengaturan sistem berhasil disimpan!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
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
          className="flex items-center gap-1.5 px-4 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* Subtabs Bar - Fully Interactive */}
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
                      className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-bold text-[#252922]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#252922] block mb-1">Alamat Toko *</label>
                    <textarea
                      rows={2}
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-control border border-[#DEDCCF] bg-[#F7F4ED] text-center space-y-2">
                  <div className="text-[11px] font-bold text-[#625D53]">Logo Toko</div>
                  <div className="w-14 h-14 mx-auto rounded-xl overflow-hidden border border-[#DEDCCF] bg-white flex items-center justify-center shadow-xs">
                    <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Pilih berkas logo toko')}
                    className="w-full py-1 px-2 rounded bg-white border border-[#DEDCCF] text-[10px] font-bold hover:bg-stone-50"
                  >
                    Pilih Logo
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
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#252922] block mb-1">Email</label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
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
              onClick={() => alert('Buka dialog tambah akun kasir/staf baru')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
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
                {userAccounts.map((u, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-bold text-[#252922] flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                        {u.badge}
                      </span>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#625D53]">@{u.username}</td>
                    <td className="py-3 px-3 font-bold text-[#234536]">{u.role}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#16845B] text-[10px] font-bold">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button className="px-2 py-1 rounded bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] font-bold text-[#252922]">
                        Ubah Hak Akses
                      </button>
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
              onClick={() => alert('Buka dialog tambah cabang depo baru')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Cabang Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branchList.map((b, idx) => (
              <div
                key={idx}
                className="p-4 rounded-card bg-[#F7F4ED]/60 border border-[#DEDCCF] space-y-2 hover:bg-[#F7F4ED] transition"
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
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-mono text-[11px]"
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
                className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => alert('Pratinjau nota thermal 80mm dan faktur jalan A5')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4ED] hover:bg-[#ECEAE2] border border-[#DEDCCF] rounded-control font-bold text-xs"
              >
                <Eye className="w-3.5 h-3.5 text-[#234536]" />
                <span>Lihat Contoh Nota</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-control bg-[#234536] text-white font-bold text-xs shadow-xs"
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
              <p className="text-[11px] text-[#625D53]">Lakukan backup data PostgreSQL secara berkala untuk menjaga keamanan data toko.</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-control border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[#16845B]" />
              <div>
                <div className="text-xs font-bold text-[#16845B]">Status Backup Database</div>
                <div className="text-sm font-black text-[#252922]">20 Okt 2026, 21:15</div>
                <div className="text-[11px] text-[#625D53]">Ukuran File Dump: 12.4 MB (Tersimpan di Server)</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Membuat cadangan database PostgreSQL toko... Berkas SQL berhasil diunduh!')}
              className="px-4 py-2 rounded-control bg-[#234536] text-white text-xs font-bold hover:bg-[#1c372b] transition shadow-xs"
            >
              Backup Sekarang
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

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-[#252922] block mb-1">Kata Sandi Saat Ini</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#252922] block mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                />
              </div>

              <div>
                <label className="font-bold text-[#252922] block mb-1">Konfirmasi Sandi Baru</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert('Kata sandi berhasil diperbarui!')}
                className="px-4 py-2 rounded-control bg-[#234536] text-white font-bold text-xs"
              >
                Perbarui Kata Sandi
              </button>
            </div>
          </div>
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#234536] flex items-center justify-center text-white text-xl shadow-xs">
                  🧱
                </div>
                <div>
                  <div className="font-black text-sm text-[#252922]">StokMaterial.id</div>
                  <div className="text-xs text-[#625D53]">Versi 1.0.0 (Production)</div>
                  <div className="text-[10px] text-[#8C877D]">© 2026 Toko Sentosa. All rights reserved.</div>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => alert('Sistem Anda sudah dalam versi terbaru 1.0.0!')}
                  className="px-3 py-1.5 rounded-control bg-white border border-[#DEDCCF] text-xs font-bold text-[#252922] hover:bg-[#F7F4ED] flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#234536]" />
                  <span>Cek Pembaruan</span>
                </button>
                <div className="text-[10px] text-[#16845B] font-bold mt-1">
                  ✓ Menggunakan versi terbaru
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
