import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes } from 'lucide-react';
import api from '../../services/api.js';
import { formatRupiah } from '../../utils/formatters.js';
import StatCard from '../../components/StatCard.jsx';
import { EmptyState } from '../../components/ui/common.jsx';
import { fmtNum } from '../../components/ui/helpers.js';
import { card, QueryState } from './shared.jsx';

const STATUS = { habis: ['Habis', 'text-[#C62828]'], menipis: ['Menipis', 'text-[#D97706]'], aman: ['Aman', 'text-[#16845B]'] };

export default function StockReport() {
  const q = useQuery({ queryKey: ['reports', 'stock'], queryFn: async () => (await api.get('/reports/stock')).data.data });
  return (
    <QueryState q={q}>
      {(d) => (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard icon={Boxes} iconBg="bg-emerald-50 text-[#16845B]" title="Total Produk" value={`${d.totals.products} Item`} subtitle="Produk aktif" />
            <StatCard icon={Boxes} iconBg="bg-emerald-50 text-[#16845B]" title="Nilai Stok (Modal)" value={formatRupiah(d.totals.costValue)} subtitle="Stok x harga beli" />
            <StatCard icon={Boxes} iconBg="bg-emerald-50 text-[#16845B]" title="Nilai Stok (Jual)" value={formatRupiah(d.totals.sellValue)} subtitle={`Potensi laba ${formatRupiah(d.totals.sellValue - d.totals.costValue)}`} />
            <StatCard icon={Boxes} iconBg="bg-amber-50 text-[#D97706]" title="Perlu Restock" value={`${d.totals.low + d.totals.empty} Item`} subtitle={`${d.totals.empty} habis, ${d.totals.low} menipis`} />
          </div>
          <div className={`${card} overflow-x-auto`}>
            {d.items.length === 0 ? <EmptyState icon={Boxes} title="Belum ada barang" desc="Tambahkan material di Data Master." /> : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F4ED] text-[#8C877D] font-bold"><tr><th className="py-3 px-4">BARANG</th><th className="py-3 px-4">KATEGORI</th><th className="py-3 px-4 text-right">STOK</th><th className="py-3 px-4 text-right">MINIMUM</th><th className="py-3 px-4 text-right">NILAI MODAL</th><th className="py-3 px-4 text-right">NILAI JUAL</th><th className="py-3 px-4">STATUS</th></tr></thead>
                <tbody className="divide-y divide-[#DEDCCF]/70">
                  {d.items.map((p) => {
                    const [label, color] = STATUS[p.status] || STATUS.aman;
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4"><b>{p.name}</b><div className="font-mono text-[10px] text-[#8C877D]">{p.sku}</div></td>
                        <td className="py-2.5 px-4 text-[#625D53]">{p.category || '-'}</td>
                        <td className="py-2.5 px-4 text-right font-black">{fmtNum(p.stock)} {p.baseUnit}</td>
                        <td className="py-2.5 px-4 text-right">{fmtNum(p.minStock)}</td>
                        <td className="py-2.5 px-4 text-right">{formatRupiah(p.costValue)}</td>
                        <td className="py-2.5 px-4 text-right">{formatRupiah(p.sellValue)}</td>
                        <td className={`py-2.5 px-4 font-bold ${color}`}>{label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </QueryState>
  );
}
