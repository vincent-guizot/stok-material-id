import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PackagePlus } from 'lucide-react';
import api from '../../services/api.js';
import { formatRupiah } from '../../utils/formatters.js';
import StatCard from '../../components/StatCard.jsx';
import { EmptyState } from '../../components/ui/common.jsx';
import { fmtDate } from '../../components/ui/helpers.js';
import { card, QueryState } from './shared.jsx';

export default function PurchasesReport({ range }) {
  const q = useQuery({
    queryKey: ['reports', 'purchases', range.from, range.to],
    queryFn: async () => (await api.get('/reports/purchases', { params: range })).data.data,
  });
  return (
    <QueryState q={q}>
      {(d) => (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={PackagePlus} iconBg="bg-emerald-50 text-[#16845B]" title="Total Pembelian" value={formatRupiah(d.totals.amount)} subtitle={`${d.totals.count} faktur`} />
            <StatCard icon={PackagePlus} iconBg="bg-emerald-50 text-[#16845B]" title="Sudah Dibayar" value={formatRupiah(d.totals.paid)} subtitle="Pembelian lunas" />
            <StatCard icon={PackagePlus} iconBg="bg-amber-50 text-[#D97706]" title="Hutang ke Supplier" value={formatRupiah(d.totals.unpaid)} subtitle={`${d.totals.unpaidCount} faktur belum lunas`} />
          </div>
          {d.list.length === 0 ? (
            <div className={card}><EmptyState icon={PackagePlus} title="Belum ada pembelian pada periode ini" desc="Ubah rentang tanggal atau catat barang masuk di menu Inventori." /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className={`${card} p-5 lg:col-span-1`}>
                <h3 className="font-extrabold text-sm mb-3">Per Supplier</h3>
                <ul className="divide-y divide-[#DEDCCF]/70 text-xs">
                  {d.bySupplier.map((s) => (
                    <li key={s.id} className="py-2 flex justify-between gap-2">
                      <span className="font-bold truncate">{s.name} <span className="text-[#8C877D] font-normal">({s.count}x)</span></span>
                      <span className="font-black">{formatRupiah(s.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${card} lg:col-span-2 overflow-x-auto`}>
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F4ED] text-[#8C877D] font-bold"><tr><th className="py-3 px-4">NO. PO</th><th className="py-3 px-4">TANGGAL</th><th className="py-3 px-4">SUPPLIER</th><th className="py-3 px-4">BARANG</th><th className="py-3 px-4 text-right">TOTAL</th><th className="py-3 px-4">STATUS</th></tr></thead>
                  <tbody className="divide-y divide-[#DEDCCF]/70">
                    {d.list.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#234536]">{p.number}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">{fmtDate(p.purchaseDate)}</td>
                        <td className="py-2.5 px-4 font-bold">{p.supplier}</td>
                        <td className="py-2.5 px-4 text-[#625D53]">{p.items}</td>
                        <td className="py-2.5 px-4 text-right font-black">{formatRupiah(p.totalAmount)}</td>
                        <td className={`py-2.5 px-4 font-bold ${p.paymentStatus === 'LUNAS' ? 'text-[#16845B]' : 'text-[#D97706]'}`}>{p.paymentStatus === 'LUNAS' ? 'Lunas' : `Hutang${p.dueDate ? ` (tempo ${fmtDate(p.dueDate)})` : ''}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </QueryState>
  );
}
