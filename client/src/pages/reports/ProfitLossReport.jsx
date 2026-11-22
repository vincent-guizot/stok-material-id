import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Receipt } from 'lucide-react';
import api from '../../services/api.js';
import { formatRupiah } from '../../utils/formatters.js';
import { EmptyState, Field } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, errMsg, fmtDate, todayStr, fmtNum } from '../../components/ui/helpers.js';
import { card, QueryState, Row } from './shared.jsx';

export default function ProfitLossReport({ range, onToast }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['reports', 'profit-loss', range.from, range.to],
    queryFn: async () => (await api.get('/reports/profit-loss', { params: range })).data.data,
  });
  const exp = useQuery({
    queryKey: ['expenses', range.from, range.to],
    queryFn: async () => (await api.get('/expenses', { params: range })).data,
  });
  const [f, setF] = useState({ category: '', description: '', amount: '', expenseDate: todayStr(), paymentMethod: 'CASH' });
  const [error, setError] = useState('');
  const refresh = () => ['reports', 'expenses'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const add = useMutation({
    mutationFn: async (p) => (await api.post('/expenses', p)).data,
    onSuccess: (r) => { refresh(); setF((x) => ({ ...x, description: '', amount: '' })); onToast('success', r.message); },
    onError: (err) => setError(errMsg(err)),
  });
  const del = useMutation({
    mutationFn: async (id) => (await api.delete(`/expenses/${id}`)).data,
    onSuccess: (r) => { refresh(); onToast('success', r.message); },
    onError: (err) => onToast('error', errMsg(err)),
  });

  const categories = exp.data?.meta?.categories || [];
  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!f.category) return setError('Pilih kategori biaya.');
    if (!(Number(f.amount) > 0)) return setError('Nominal biaya harus lebih dari 0.');
    add.mutate({ ...f, amount: Number(f.amount) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <QueryState q={q}>
        {(d) => (
          <div className={`${card} p-5`}>
            <h3 className="font-extrabold text-sm mb-1">Laporan Laba Rugi</h3>
            <p className="text-xs text-[#625D53] mb-3">{fmtDate(d.range.from)} — {fmtDate(d.range.to)} • {d.transactionCount} transaksi</p>
            <Row label="Penjualan kotor" value={formatRupiah(d.revenue.gross)} />
            <Row indent label="Diskon" value={`- ${formatRupiah(d.revenue.discount)}`} />
            <Row label="Penjualan bersih (belum PPN)" value={formatRupiah(d.revenue.net)} strong />
            <Row indent label="Harga pokok penjualan (HPP)" value={`- ${formatRupiah(d.cogs)}`} />
            <Row label={`Laba kotor (${fmtNum(d.grossMarginPercent, 1)}%)`} value={formatRupiah(d.grossProfit)} strong tone={d.grossProfit >= 0 ? 'good' : 'bad'} />
            {d.expenses.byCategory.map((c) => <Row key={c.category} indent label={c.category} value={`- ${formatRupiah(c.amount)}`} />)}
            <Row label="Total biaya operasional" value={`- ${formatRupiah(d.expenses.total)}`} />
            <Row label="Laba bersih" value={formatRupiah(d.netProfit)} strong tone={d.netProfit >= 0 ? 'good' : 'bad'} />
            <p className="text-[11px] text-[#8C877D] mt-3">
              PPN yang dipungut ({formatRupiah(d.revenue.taxCollected)}) tidak dihitung sebagai pendapatan.
              {d.linesWithoutCost > 0 && ` ${d.linesWithoutCost} baris nota lama belum punya HPP sehingga dihitung dari harga beli saat ini.`}
            </p>
          </div>
        )}
      </QueryState>

      <div className={`${card} p-5 space-y-4`}>
        <h3 className="font-extrabold text-sm">Biaya Operasional</h3>
        <form onSubmit={submit} className="grid grid-cols-2 gap-2 p-3 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control">
          <Field label="Kategori">
            <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="">Pilih...</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Nominal (Rp)"><input type="number" min="0" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Tanggal"><input type="date" max={todayStr()} className={inputCls} value={f.expenseDate} onChange={(e) => setF({ ...f, expenseDate: e.target.value })} /></Field>
          <Field label="Dibayar via">
            <select className={inputCls} value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>
              <option value="CASH">Tunai</option><option value="TRANSFER">Transfer</option><option value="QRIS">QRIS</option>
            </select>
          </Field>
          <div className="col-span-2"><Field label="Keterangan"><input className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
          {error && <p role="alert" className="col-span-2 text-xs font-bold text-rose-600">{error}</p>}
          <div className="col-span-2 flex justify-end"><button disabled={add.isPending} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Catat Biaya</button></div>
        </form>

        {exp.isLoading ? <p className="text-xs text-[#8C877D]">Memuat biaya...</p> : (exp.data?.data || []).length === 0 ? (
          <EmptyState icon={Receipt} title="Belum ada biaya pada periode ini" desc="Catat gaji, listrik, BBM, dan biaya lain agar laba bersih akurat." />
        ) : (
          <ul className="divide-y divide-[#DEDCCF]/70 text-xs">
            {exp.data.data.map((e) => (
              <li key={e.id} className="py-2 flex items-center justify-between gap-2">
                <span className="min-w-0"><b>{e.category}</b> <span className="text-[#8C877D]">• {fmtDate(e.expenseDate)}</span><br /><span className="text-[#625D53]">{e.description || '-'}</span></span>
                <span className="flex items-center gap-2 shrink-0"><b>{formatRupiah(e.amount)}</b>
                  <button aria-label="Hapus biaya" onClick={() => del.mutate(e.id)} className="text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
