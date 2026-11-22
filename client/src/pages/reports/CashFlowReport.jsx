import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import api from '../../services/api.js';
import { formatRupiah } from '../../utils/formatters.js';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/ui/helpers.js';
import { card, QueryState, Row } from './shared.jsx';

const METHOD = { CASH: 'Tunai', TRANSFER: 'Transfer', QRIS: 'QRIS', CARD: 'Kartu' };

export default function CashFlowReport({ range }) {
  const q = useQuery({
    queryKey: ['reports', 'cash-flow', range.from, range.to],
    queryFn: async () => (await api.get('/reports/cash-flow', { params: range })).data.data,
  });
  return (
    <QueryState q={q}>
      {(d) => {
        const max = Math.max(1, ...d.daily.map((x) => Math.max(x.in, x.out)));
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={Wallet} iconBg="bg-emerald-50 text-[#16845B]" title="Kas Masuk" value={formatRupiah(d.cashIn.total)} subtitle="Penjualan + pelunasan kasbon" />
              <StatCard icon={Wallet} iconBg="bg-rose-50 text-[#C62828]" title="Kas Keluar" value={formatRupiah(d.cashOut.total)} subtitle="Pembelian lunas + biaya" />
              <StatCard icon={Wallet} iconBg={d.net >= 0 ? 'bg-emerald-50 text-[#16845B]' : 'bg-rose-50 text-[#C62828]'} title="Arus Kas Bersih" value={formatRupiah(d.net)} subtitle={`${fmtDate(d.range.from)} — ${fmtDate(d.range.to)}`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div className={`${card} p-5`}>
                <h3 className="font-extrabold text-sm mb-2">Kas Masuk</h3>
                {d.cashIn.salesByMethod.map((m) => <Row key={m.method} indent label={`Penjualan ${METHOD[m.method] || m.method}`} value={formatRupiah(m.amount)} />)}
                <Row label="Pelunasan kasbon mandor" value={formatRupiah(d.cashIn.debtPayments)} />
                <Row strong tone="good" label="Total masuk" value={formatRupiah(d.cashIn.total)} />
                <h3 className="font-extrabold text-sm mt-4 mb-2">Kas Keluar</h3>
                <Row label="Pembayaran supplier" value={formatRupiah(d.cashOut.purchases)} />
                {d.cashOut.expensesByCategory.map((c) => <Row key={c.category} indent label={c.category} value={formatRupiah(c.amount)} />)}
                <Row strong tone="bad" label="Total keluar" value={formatRupiah(d.cashOut.total)} />
                <p className="text-[11px] text-[#8C877D] mt-3">Penjualan kasbon belum dihitung sebagai kas masuk sampai dilunasi.</p>
              </div>
              <div className={`${card} p-5`}>
                <h3 className="font-extrabold text-sm mb-3">Grafik Harian</h3>
                <div className="flex items-end gap-1 h-48 border-b border-l border-[#DEDCCF] px-1 overflow-x-auto">
                  {d.daily.map((x) => (
                    <div key={x.date} className="flex-1 min-w-[16px] h-full flex items-end justify-center gap-0.5" title={`${fmtDate(x.date)} • masuk ${formatRupiah(x.in)} • keluar ${formatRupiah(x.out)}`}>
                      <div className="w-1/2 bg-[#234536] rounded-t" style={{ height: `${Math.max(1, (x.in / max) * 95)}%` }} />
                      <div className="w-1/2 bg-[#C62828]/80 rounded-t" style={{ height: `${Math.max(1, (x.out / max) * 95)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-[11px] mt-2 text-[#625D53]"><span><i className="inline-block w-2.5 h-2.5 bg-[#234536] rounded-sm mr-1" />Masuk</span><span><i className="inline-block w-2.5 h-2.5 bg-[#C62828]/80 rounded-sm mr-1" />Keluar</span></div>
              </div>
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
