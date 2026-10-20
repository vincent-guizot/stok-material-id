import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  FileQuestion,
  Headphones,
  Info,
  ChevronRight,
  Play,
  MessageCircle,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const guideCards = [
    {
      num: '01',
      title: 'Mulai Menggunakan StokMaterial.id',
      desc: 'Pengenalan fitur utama dan pengaturan awal sistem toko bangunan.',
      icon: '🧱',
    },
    {
      num: '02',
      title: 'Kelola Data Barang',
      desc: 'Cara menambah barang, mengatur harga, stok, dan satuan bertingkat.',
      icon: '📦',
    },
    {
      num: '03',
      title: 'Transaksi Penjualan',
      desc: 'Langkah melakukan penjualan cepat di kasir dan cetak nota belanja.',
      icon: '🛒',
    },
    {
      num: '04',
      title: 'Barang Masuk dari Supplier',
      desc: 'Cara mencatat pembelian material dan penerimaan barang masuk (PO).',
      icon: '🚚',
    },
    {
      num: '05',
      title: 'Kasbon Mandor dan Piutang',
      desc: 'Kelola plafon kredit, pencatatan kasbon, dan cicilan mandor.',
      icon: '👷‍♂️',
    },
    {
      num: '06',
      title: 'Laporan Keuangan',
      desc: 'Cara melihat dan mencetak omzet penjualan, pembelian, dan laba rugi.',
      icon: '📈',
    },
  ];

  const videos = [
    {
      title: 'Cara Melakukan Penjualan di Kasir',
      desc: 'Panduan lengkap transaksi penjualan untuk pemula.',
      duration: '3:25',
    },
    {
      title: 'Menambah Barang Baru & Multi Satuan',
      desc: 'Cara input barang, harga, dan konversi sak ke kg.',
      duration: '4:10',
    },
    {
      title: 'Mengelola Kasbon Mandor & Plafon',
      desc: 'Pencatatan kasbon dan pembayaran piutang mandor.',
      duration: '5:22',
    },
    {
      title: 'Mencetak Laporan Penjualan & Faktur',
      desc: 'Cara generate dan export laporan ke format PDF/Excel.',
      duration: '4:38',
    },
  ];

  const faqs = [
    {
      q: 'Bagaimana cara menambah barang baru?',
      a: 'Buka menu Master Data > Data Produk, lalu klik tombol "+ Tambah Produk". Isi nama material, SKU, satuan utama, dan harga modal serta harga jual kasir.',
    },
    {
      q: 'Cara melakukan penjualan dan mencetak nota?',
      a: 'Pilih barang dari katalog Kasir Penjualan untuk memasukkan ke keranjang, lalu tekan F2 atau tombol "Lanjut ke Pembayaran". Pilih metode tunai/transfer/kasbon, masukkan nominal bayar, lalu klik "Selesaikan Transaksi (F5)". Anda dapat mencetak nota thermal atau faktur jalan.',
    },
    {
      q: 'Bagaimana cara mencatat kasbon mandor?',
      a: 'Pada halaman pembayaran di kasir, pilih metode "Kasbon Mandor" lalu pilih nama mandor terdaftar. Sistem akan memvalidasi apakah saldo masih dalam batas limit kredit. Anda juga dapat mencatat pembayaran cicilan pada menu "Buku Kasbon Mandor".',
    },
    {
      q: 'Cara melihat laporan laba rugi?',
      a: 'Buka menu Laporan Keuangan, pilih subtab "Ringkasan" atau "Laba Rugi". Anda dapat memfilter periode harian, mingguan, bulanan, atau tahunan.',
    },
    {
      q: 'Apakah bisa export data ke Excel?',
      a: 'Ya, seluruh data produk, transaksi, buku kasbon mandor, dan supplier dapat diekspor langsung ke format Excel (.xlsx) dengan menekan tombol "Export Data".',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Friendly Greeting */}
      <div className="bg-white rounded-card border border-[#DEDCCF] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-4 max-w-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
                Pusat Bantuan
              </h1>
              <p className="text-xs text-[#625D53]">
                Temukan panduan, video tutorial, dan jawaban atas pertanyaan Anda.
              </p>
            </div>
          </div>

          {/* Search bar inside banner */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Ketik pertanyaan, misalnya: cara tambah barang, cetak laporan, atau kasbon mandor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-3 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold text-[#252922] focus:outline-none focus:border-[#234536] focus:bg-white transition"
            />
            <button
              onClick={() => alert(`Mencari solusi untuk: "${searchQuery}"`)}
              className="absolute right-2 px-4 py-1.5 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Cute character & greeting illustration */}
        <div className="flex items-center gap-3 bg-[#F7F4ED] p-4 rounded-card border border-[#DEDCCF] md:max-w-xs shrink-0">
          <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl shrink-0">
            👷‍♂️
          </div>
          <div className="text-xs">
            <div className="font-extrabold text-[#252922]">Tim Bantuan StokMaterial.id</div>
            <div className="text-[11px] text-[#625D53] mt-0.5 leading-snug">
              Kami siap membantu Anda menggunakan sistem toko bangunan dengan lancar!
            </div>
          </div>
        </div>
      </div>

      {/* 5 Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: BookOpen, title: 'Panduan Penggunaan', desc: 'Langkah demi langkah sistem' },
          { icon: Video, title: 'Video Tutorial', desc: 'Tonton video panduan fitur' },
          { icon: FileQuestion, title: 'Pertanyaan Umum', desc: 'Jawaban pertanyaan umum' },
          { icon: Headphones, title: 'Hubungi Kami', desc: 'Tim kami siap membantu' },
          { icon: Info, title: 'Tentang Aplikasi', desc: 'Versi, lisensi & update' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-card border border-[#DEDCCF] shadow-card hover:border-[#234536] hover:shadow-card-hover transition cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#234536] flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-[#252922]">{item.title}</div>
                <div className="text-[10px] text-[#8C877D] mt-0.5 leading-tight">{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Panduan Penggunaan & Video Tutorial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panduan Penggunaan (6 cards) */}
        <div className="lg:col-span-7 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#DEDCCF]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#234536]" />
              <h3 className="font-extrabold text-sm text-[#252922]">Panduan Penggunaan</h3>
            </div>
            <button className="text-xs font-bold text-[#234536] hover:underline">
              Lihat Semua
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guideCards.map((g) => (
              <div
                key={g.num}
                onClick={() => alert(`Membuka panduan: ${g.title}`)}
                className="p-3.5 rounded-card bg-[#F7F4ED]/60 border border-[#DEDCCF] hover:bg-[#F7F4ED] hover:border-[#234536] transition cursor-pointer flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#234536] text-white flex items-center justify-center text-xs font-black shrink-0">
                  {g.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-xs text-[#252922] leading-tight">
                    {g.title}
                  </div>
                  <div className="text-[11px] text-[#625D53] mt-1 leading-snug">
                    {g.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Tutorial Populer */}
        <div className="lg:col-span-5 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#DEDCCF]">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#234536]" />
              <h3 className="font-extrabold text-sm text-[#252922]">Video Tutorial Populer</h3>
            </div>
            <button className="text-xs font-bold text-[#234536] hover:underline">
              Lihat Semua
            </button>
          </div>

          <div className="space-y-2.5">
            {videos.map((vid, idx) => (
              <div
                key={idx}
                onClick={() => alert(`Memutar video tutorial: ${vid.title}`)}
                className="p-2.5 rounded-card bg-[#F7F4ED]/50 border border-[#DEDCCF] hover:bg-[#F7F4ED] transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-200 border border-[#DEDCCF] flex items-center justify-center text-[#234536] shrink-0 relative">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#252922]">{vid.title}</div>
                    <div className="text-[10px] text-[#625D53] mt-0.5">{vid.desc}</div>
                  </div>
                </div>

                <div className="px-2 py-0.5 rounded bg-white border border-[#DEDCCF] text-[10px] font-bold text-[#625D53] shrink-0 font-mono">
                  {vid.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Pertanyaan Umum (FAQ) & Hubungi Kami */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FAQ Accordion */}
        <div className="lg:col-span-7 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#DEDCCF]">
            <div className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-[#234536]" />
              <h3 className="font-extrabold text-sm text-[#252922]">Pertanyaan Umum (FAQ)</h3>
            </div>
            <span className="text-xs text-[#8C877D] font-bold">5 Pertanyaan</span>
          </div>

          <div className="divide-y divide-[#DEDCCF]">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="py-2.5">
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-[#252922] hover:text-[#234536] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      className={`w-4 h-4 text-[#8C877D] transition-transform ${
                        isOpen ? 'rotate-90 text-[#234536]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-2 p-3 rounded-control bg-[#F7F4ED] text-[11px] text-[#625D53] leading-relaxed border border-[#DEDCCF]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hubungi Kami & Jam Layanan */}
        <div className="lg:col-span-5 bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
          <div className="pb-2 border-b border-[#DEDCCF]">
            <h3 className="font-extrabold text-sm text-[#252922]">Hubungi Kami</h3>
            <p className="text-xs text-[#625D53]">Masih ada pertanyaan? Tim kami siap membantu Anda.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* WhatsApp */}
            <div className="p-3 rounded-card bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between h-28">
              <div>
                <MessageCircle className="w-5 h-5 text-[#16845B] mx-auto mb-1" />
                <div className="font-extrabold text-[#252922]">WhatsApp</div>
                <div className="text-[10px] text-[#625D53] font-mono mt-0.5">0812-3456-7890</div>
              </div>
              <button
                onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
                className="w-full py-1 bg-[#16845B] hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
              >
                Chat WA
              </button>
            </div>

            {/* Email */}
            <div className="p-3 rounded-card bg-amber-50/70 border border-amber-200 flex flex-col justify-between h-28">
              <div>
                <Mail className="w-5 h-5 text-[#D97706] mx-auto mb-1" />
                <div className="font-extrabold text-[#252922]">Email</div>
                <div className="text-[10px] text-[#625D53] truncate mt-0.5">support@stok...</div>
              </div>
              <button
                onClick={() => window.location.href = 'mailto:support@stokmaterial.id'}
                className="w-full py-1 bg-[#C6A46A] hover:bg-[#ad8b53] text-white rounded text-[10px] font-bold"
              >
                Kirim Email
              </button>
            </div>

            {/* Telepon */}
            <div className="p-3 rounded-card bg-[#F7F4ED] border border-[#DEDCCF] flex flex-col justify-between h-28">
              <div>
                <Phone className="w-5 h-5 text-[#234536] mx-auto mb-1" />
                <div className="font-extrabold text-[#252922]">Telepon</div>
                <div className="text-[10px] text-[#625D53] font-mono mt-0.5">031-1234567</div>
              </div>
              <button
                onClick={() => window.location.href = 'tel:0311234567'}
                className="w-full py-1 bg-white border border-[#DEDCCF] hover:bg-stone-50 text-[#252922] rounded text-[10px] font-bold"
              >
                Hubungi
              </button>
            </div>
          </div>

          {/* Service Hours Notice */}
          <div className="p-3 rounded-control bg-emerald-50/60 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-[#234536]">
            <Clock className="w-4 h-4 text-[#16845B] shrink-0" />
            <div>
              <div className="font-bold">Jam Layanan: Senin - Sabtu, 08.00 - 17.00 WIB</div>
              <div className="text-[10px] text-[#625D53]">Respon rata-rata biasanya dalam 15 - 30 menit.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
