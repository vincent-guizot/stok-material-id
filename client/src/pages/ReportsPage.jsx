import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { formatRupiah } from '../utils/formatters.js';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
import { exportToCsv } from '../utils/exportCsv.js';
import { BarChart3, Calendar, Download, Printer, ShoppingCart, Receipt, Wallet, Users } from 'lucide-react';
import PurchasesReport from './reports/PurchasesReport.jsx';
import ProfitLossReport from './reports/ProfitLossReport.jsx';
import CashFlowReport from './reports/CashFlowReport.jsx';
import StockReport from './reports/StockReport.jsx';

const SUB_TABS = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'sales', label: 'Penjualan' },
  { id: 'purchases', label: 'Pembelian' },
  { id: 'debts-report', label: 'Piutang Mandor' },
  { id: 'stocks-report', label: 'Stok Barang' },
  { id: 'profit-loss', label: 'Laba Rugi' },
  { id: 'cash-flow', label: 'Arus Kas' },
];
const METHOD_LABEL = { CASH: 'Tunai (Cash)', TRANSFER: 'Transfer Bank', QRIS: 'QRIS', CARD: 'Kartu Debit / EDC', DEBT: 'Kasbon Mandor' };
const METHOD_COLOR = { CASH: '#234536', TRANSFER: '#C6A46A', QRIS: '#5F7147', CARD: '#8C877D', DEBT: '#D97706' };
const CAT_COLORS = ['#234536', '#5F7147', '#C6A46A', '#D97706', '#3B6E8F', '#8C877D'];

const ymd = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const addDays = (s, n) => {
  const d = new Date(`${s}T12:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
};
const rangeFor = (kind, todayStr) => {
  if (kind === 'day') return { from: todayStr, to: todayStr };
  if (kind === 'week') return { from: addDays(todayStr, -6), to: todayStr };
  if (kind === 'year') return { from: `${todayStr.slice(0, 4)}-01-01`, to: todayStr };
  return { from: `${todayStr.slice(0, 7)}-01`, to: todayStr };
};
const fmtDate = (s) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(`${s}T12:00:00+07:00`));
const fmtWhen = (v) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(v));
const compact = (n) => (n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1).replace('.', ',')} jt` : formatRupiah(n));
const qtyFmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(n);

const Empty = ({ children }) => <div className="py-10 text-center text-xs text-[#8C877D]">{children}</div>;

export default function ReportsPage({ subTab, setSubTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [localTab, setLocalTab] = useState(urlTab || subTab || 'summary');
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

  const [todayStr] = useState(() => ymd(new Date()));
  const [timeframe, setTimeframe] = useState('month');
  const [range, setRange] = useState(() => rangeFor('month', ymd(new Date())));
  const pickTimeframe = (kind) => {
    setTimeframe(kind);
    setRange(rangeFor(kind, todayStr));
  };

  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000);
  };

  const { data: ov, isLoading, isError } = useQuery({
    queryKey: ['reports', 'overview', range.from, range.to],
    queryFn: async () => (await api.get(`/reports/overview?from=${range.from}&to=${range.to}`)).data.data,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    enabled: activeTabKey === 'debts-report',
    queryFn: async () => (await api.get('/customers')).data.data,
  });


  const t = ov?.totals || {};
  const daily = ov?.daily || [];
  const maxDaily = Math.max(1, ...daily.map((d) => d.sales));
  const catTotal = (ov?.categories || []).reduce((a, c) => a + c.amount, 0);
  const cats = useMemo(() => {
    const list = ov?.categories || [];
    const top = list.slice(0, 5);
    const rest = list.slice(5).reduce((a, c) => a + c.amount, 0);
    return rest > 0 ? [...top, { name: 'Lainnya', amount: rest }] : top;
  }, [ov]);
  const methodTotal = (ov?.methods || []).reduce((a, m) => a + m.amount, 0);
  const pct = (v, total) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const exportSales = () => {
    exportToCsv(
      `laporan-penjualan-${range.from}_${range.to}`,
      ['Tanggal', 'No. Invoice', 'Pelanggan', 'Status', 'Total'],
      (ov?.recent || []).map((r) => [fmtWhen(r.createdAt), r.invoiceNumber, r.customer || 'Pelanggan Umum', r.paymentStatus, r.totalAmount])
    );
    showToast('success', 'Laporan penjualan diekspor ke CSV.');
  };

  const card = 'bg-white rounded-card border border-[#DEDCCF] shadow-card';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">Laporan Keuangan</h1>
            <p className="text-xs text-[#625D53]">Pantau penjualan, piutang, dan kondisi stok toko.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DEDCCF] rounded-control text-xs font-bold shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#234536]" />
            <input type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))} className="bg-transparent outline-none" aria-label="Tanggal awal" />
            <span>—</span>
            <input type="date" value={range.to} min={range.from} max={todayStr} onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))} className="bg-transparent outline-none" aria-label="Tanggal akhir" />
          </div>
          <div className="flex bg-white border border-[#DEDCCF] rounded-control p-0.5 shadow-xs text-xs font-bold">
            {[['day', 'Hari'], ['week', 'Minggu'], ['month', 'Bulan'], ['year', 'Tahun']].map(([id, label]) => (
              <button key={id} onClick={() => pickTimeframe(id)} className={`px-3 py-1 rounded-md transition ${timeframe === id ? 'bg-[#234536] text-white' : 'text-[#625D53] hover:text-[#252922]'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={exportSales} className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold shadow-xs"><Download className="w-3.5 h-3.5" />Export</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold shadow-xs"><Printer className="w-3.5 h-3.5" />Cetak</button>
        </div>
      </div>

      {isError && <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs font-bold text-[#C62828]">Gagal memuat laporan. Laporan hanya dapat dibuka oleh admin.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard icon={ShoppingCart} iconBg="bg-emerald-50 text-[#16845B]" title="Total Penjualan" value={formatRupiah(t.sales || 0)} subtitle={`${t.count || 0} Transaksi`} />
        <StatCard icon={Receipt} iconBg="bg-amber-50 text-[#D97706]" title="Rata-rata per Transaksi" value={formatRupiah(t.average || 0)} subtitle={`Diskon ${formatRupiah(t.discount || 0)}`} />
        <StatCard icon={Wallet} iconBg="bg-emerald-50 text-[#16845B]" title="Diterima Langsung" value={formatRupiah(t.paid || 0)} subtitle={`Kasbon ${formatRupiah(t.debt || 0)}`} />
        <StatCard icon={Users} iconBg="bg-amber-50 text-[#D97706]" title="Piutang Mandor (berjalan)" value={formatRupiah(ov?.receivable?.outstanding || 0)} subtitle={`${ov?.receivable?.customers || 0} Mandor`} />
      </div>

      <div className="flex border-b border-[#DEDCCF] gap-2 overflow-x-auto pb-1">
        {SUB_TABS.map((tab) => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`py-2 px-4 rounded-t-lg font-bold text-xs whitespace-nowrap transition border-b-2 ${activeTabKey === tab.id ? 'border-[#234536] text-[#234536] bg-white font-extrabold' : 'border-transparent text-[#625D53] hover:text-[#252922] hover:bg-white/50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTabKey === 'purchases' && <PurchasesReport range={range} />}
      {activeTabKey === 'profit-loss' && <ProfitLossReport range={range} onToast={showToast} />}
      {activeTabKey === 'cash-flow' && <CashFlowReport range={range} />}
      {activeTabKey === 'stocks-report' && <StockReport />}

      {activeTabKey === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-8 ${card} p-5 space-y-4`}>
              <div>
                <h3 className="font-extrabold text-sm text-[#252922]">Grafik Penjualan Harian</h3>
                <p className="text-xs text-[#625D53]">{fmtDate(range.from)} — {fmtDate(range.to)}</p>
              </div>
              {isLoading ? <Empty>Memuat…</Empty> : daily.length === 0 ? <Empty>Belum ada penjualan pada periode ini.</Empty> : (
                <div className="flex items-end gap-1.5 h-56 border-b border-l border-[#DEDCCF] px-2 overflow-x-auto">
                  {daily.map((d) => (
                    <div key={d.date} className="flex-1 min-w-[18px] h-full flex flex-col justify-end items-center gap-1" title={`${fmtDate(d.date)}: ${formatRupiah(d.sales)} (${d.count} transaksi)`}>
                      <div className="w-full max-w-[34px] bg-[#234536] rounded-t" style={{ height: `${Math.max(2, (d.sales / maxDaily) * 88)}%` }} />
                      <span className="text-[9px] text-[#8C877D] -mb-4 whitespace-nowrap">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="h-3" />
            </div>

            <div className={`lg:col-span-4 ${card} p-5 space-y-4`}>
              <h3 className="font-extrabold text-sm text-[#252922]">Penjualan per Kategori</h3>
              {cats.length === 0 ? <Empty>Belum ada data.</Empty> : (
                <>
                  <div className="flex justify-center">
                    <svg viewBox="0 0 36 36" className="w-40 h-40 -rotate-90">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F0EEE6" strokeWidth="4" />
                      {(() => {
                        let offset = 0;
                        return cats.map((c, i) => {
                          const share = catTotal > 0 ? (c.amount / catTotal) * 100 : 0;
                          const el = <circle key={c.name} cx="18" cy="18" r="15.9155" fill="none" stroke={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth="4" strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={-offset} />;
                          offset += share;
                          return el;
                        });
                      })()}
                    </svg>
                  </div>
                  <div className="text-center text-xs text-[#625D53] -mt-1">Total omzet <b className="text-[#252922]">{compact(catTotal)}</b></div>
                  <ul className="space-y-1.5 text-xs">
                    {cats.map((c, i) => (
                      <li key={c.name} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 min-w-0"><i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} /><span className="truncate font-semibold">{c.name}</span></span>
                        <span className="text-[#625D53] whitespace-nowrap">{pct(c.amount, catTotal)}% · <b className="text-[#252922]">{compact(c.amount)}</b></span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${card} p-5 space-y-3`}>
              <h3 className="font-extrabold text-sm">Metode Pembayaran</h3>
              {(ov?.methods || []).length === 0 ? <Empty>Belum ada data.</Empty> : ov.methods.map((m) => (
                <div key={m.method} className="text-xs">
                  <div className="flex justify-between font-bold mb-1"><span>{METHOD_LABEL[m.method] || m.method}</span><span>{pct(m.amount, methodTotal)}% ({formatRupiah(m.amount)})</span></div>
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct(m.amount, methodTotal)}%`, background: METHOD_COLOR[m.method] || '#8C877D' }} /></div>
                </div>
              ))}
              <p className="text-[11px] text-[#8C877D]">Tunai dihitung setelah kembalian (jumlah yang benar-benar diterima untuk transaksi).</p>
            </div>

            <div className={`${card} p-5`}>
              <h3 className="font-extrabold text-sm mb-3">Top 5 Produk Terlaris</h3>
              {(ov?.topProducts || []).length === 0 ? <Empty>Belum ada data.</Empty> : (
                <ol className="divide-y divide-[#DEDCCF]/70 text-xs">
                  {ov.topProducts.map((p, i) => (
                    <li key={`${p.name}-${p.unit}`} className="py-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0"><b className="text-[#8C877D] w-4">{i + 1}</b><span className="truncate font-bold">{p.name}</span></span>
                      <span className="text-right shrink-0"><div className="font-black">{formatRupiah(p.amount)}</div><div className="text-[10px] text-[#8C877D]">{qtyFmt(p.qty)} {p.unit}</div></span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTabKey === 'sales' && (
        <div className={`${card} overflow-hidden`}>
          <div className="p-4 border-b border-[#DEDCCF] flex items-center justify-between">
            <h3 className="font-extrabold text-sm">Transaksi Penjualan ({fmtDate(range.from)} — {fmtDate(range.to)})</h3>
            <span className="text-xs text-[#625D53]">Menampilkan 20 terbaru dari {t.count || 0}</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] text-[#8C877D] font-bold"><tr><th className="py-3 px-4">TANGGAL</th><th className="py-3 px-4">NO. INVOICE</th><th className="py-3 px-4">PELANGGAN</th><th className="py-3 px-4">STATUS</th><th className="py-3 px-4 text-right">TOTAL</th></tr></thead>
            <tbody className="divide-y divide-[#DEDCCF]/70">
              {(ov?.recent || []).length === 0 ? <tr><td colSpan={5}><Empty>Belum ada transaksi pada periode ini.</Empty></td></tr> : ov.recent.map((r) => (
                <tr key={r.id}><td className="py-2.5 px-4 whitespace-nowrap">{fmtWhen(r.createdAt)}</td><td className="py-2.5 px-4 font-bold">{r.invoiceNumber}</td><td className="py-2.5 px-4">{r.customer || 'Pelanggan Umum'}</td><td className="py-2.5 px-4">{r.paymentStatus}</td><td className="py-2.5 px-4 text-right font-black">{formatRupiah(r.totalAmount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTabKey === 'debts-report' && (
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] text-[#8C877D] font-bold"><tr><th className="py-3 px-4">MANDOR</th><th className="py-3 px-4 text-right">LIMIT</th><th className="py-3 px-4 text-right">SALDO PIUTANG</th><th className="py-3 px-4 text-right">SISA LIMIT</th></tr></thead>
            <tbody className="divide-y divide-[#DEDCCF]/70">
              {customers.length === 0 ? <tr><td colSpan={4}><Empty>Belum ada mandor.</Empty></td></tr> : [...customers].sort((a, b) => (parseFloat(b.currentDebt) || 0) - (parseFloat(a.currentDebt) || 0)).map((c) => {
                const limit = parseFloat(c.creditLimit) || 0; const debt = parseFloat(c.currentDebt) || 0;
                return <tr key={c.id}><td className="py-2.5 px-4 font-bold">{c.name}</td><td className="py-2.5 px-4 text-right">{formatRupiah(limit)}</td><td className="py-2.5 px-4 text-right font-black">{formatRupiah(debt)}</td><td className={`py-2.5 px-4 text-right font-bold ${debt > limit ? 'text-[#C62828]' : 'text-[#16845B]'}`}>{formatRupiah(limit - debt)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast({ show: false, type: 'info', message: '' })} />
    </div>
  );
}
