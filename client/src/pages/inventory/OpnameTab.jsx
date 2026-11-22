import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { EmptyState, LoadingRows, ErrorBox, Field } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, errMsg, fmtDateTime, fmtNum } from '../../components/ui/helpers.js';
import { useMovements, INVALIDATE_AFTER_STOCK } from './useMovements.js';

export default function OpnameTab({ products, onToast }) {
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin';
  const history = useMovements('OPNAME');
  const [counts, setCounts] = useState({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const filled = useMemo(() => Object.entries(counts).filter(([, v]) => v !== '' && !Number.isNaN(Number(v))), [counts]);
  const diffs = filled.filter(([id, v]) => Number(v) !== Number(products.find((p) => p.id === id)?.currentStockBase));

  const save = useMutation({
    mutationFn: async (payload) => (await api.post('/stocks/opname', payload)).data,
    onSuccess: (res) => {
      INVALIDATE_AFTER_STOCK.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setCounts({});
      setNotes('');
      onToast('success', res.message);
    },
    onError: (err) => setError(errMsg(err, 'Gagal menyimpan opname.')),
  });

  const submit = () => {
    setError('');
    if (!filled.length) return setError('Isi hasil hitung fisik minimal satu material.');
    if (filled.some(([, v]) => Number(v) < 0)) return setError('Hasil hitung tidak boleh negatif.');
    save.mutate({ notes: notes || undefined, items: filled.map(([productId, v]) => ({ productId, physicalQty: Number(v) })) });
  };

  // riwayat dikelompokkan per nomor opname
  const sessions = useMemo(() => {
    const g = new Map();
    for (const m of history.data || []) {
      if (!g.has(m.refNo)) g.set(m.refNo, { refNo: m.refNo, at: m.createdAt, by: m.creator?.name, reason: m.reason, rows: [] });
      g.get(m.refNo).rows.push(m);
    }
    return [...g.values()];
  }, [history.data]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
          <div>
            <h3 className="font-extrabold text-sm text-[#252922]">Hitung Stok Fisik (Opname)</h3>
            <p className="text-xs text-[#625D53]">Isi hasil hitung di gudang dalam satuan dasar. Hanya material yang selisih yang dikoreksi dan dicatat.</p>
          </div>
          {isAdmin ? (
            <button onClick={submit} disabled={save.isPending || !filled.length} className={btnPrimary}>
              {save.isPending ? 'Menyimpan...' : `Simpan Opname (${diffs.length} selisih)`}
            </button>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-control">Hanya Admin yang dapat menyimpan opname</span>
          )}
        </div>

        {products.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Belum ada material" desc="Tambahkan material di Data Master untuk mulai opname." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">SKU</th><th className="py-2.5 px-3">MATERIAL</th><th className="py-2.5 px-3">LOKASI</th>
                  <th className="py-2.5 px-3 text-right">STOK SISTEM</th><th className="py-2.5 px-3 w-40">HITUNG FISIK</th><th className="py-2.5 px-3 text-right">SELISIH</th><th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCCF]/70">
                {products.map((p) => {
                  const v = counts[p.id] ?? '';
                  const diff = v === '' ? null : Number(v) - Number(p.currentStockBase);
                  return (
                    <tr key={p.id} className="hover:bg-[#F7F4ED]/50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#234536]">{p.sku}</td>
                      <td className="py-2.5 px-3 font-bold text-[#252922]">{p.name}</td>
                      <td className="py-2.5 px-3 text-[#625D53]">{p.location || '-'}</td>
                      <td className="py-2.5 px-3 text-right">{fmtNum(p.currentStockBase)} {p.baseUnit}</td>
                      <td className="py-2.5 px-3">
                        <input type="number" min="0" step="any" disabled={!isAdmin} aria-label={`Hitung fisik ${p.name}`} className={inputCls} value={v} placeholder={p.baseUnit}
                          onChange={(e) => setCounts((c) => ({ ...c, [p.id]: e.target.value }))} />
                      </td>
                      <td className={`py-2.5 px-3 text-right font-black ${diff === null || diff === 0 ? 'text-[#8C877D]' : diff < 0 ? 'text-[#C62828]' : 'text-[#16845B]'}`}>
                        {diff === null ? '-' : `${diff > 0 ? '+' : ''}${fmtNum(diff)}`}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {diff === null ? <span className="text-[#8C877D]">Belum dihitung</span> : diff === 0
                          ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#16845B] text-[10px] font-bold">Cocok</span>
                          : <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#C62828] text-[10px] font-bold">Selisih</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {isAdmin && (
          <Field label="Catatan opname (opsional)"><input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Opname akhir bulan" /></Field>
        )}
        {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
      </div>

      <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-3">
        <h3 className="font-extrabold text-sm text-[#252922]">Riwayat Opname</h3>
        {history.isLoading ? <LoadingRows /> : history.isError ? <ErrorBox error={history.error} onRetry={history.refetch} /> : sessions.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Belum ada opname tercatat" desc="Hasil opname dengan selisih akan muncul di sini." />
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.refNo} className="border border-[#DEDCCF] rounded-card overflow-hidden">
                <div className="px-3 py-2 bg-[#F7F4ED] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold text-[#234536]">{s.refNo}</span>
                  <span className="text-[#625D53]">{fmtDateTime(s.at)} • {s.by || '-'}{s.reason ? ` • ${s.reason}` : ''}</span>
                </div>
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-[#DEDCCF]/70">
                    {s.rows.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2 px-3 font-bold text-[#252922]">{m.product?.name}</td>
                        <td className="py-2 px-3 text-right">{fmtNum(m.previousStock)} → {fmtNum(m.newStock)} {m.product?.baseUnit}</td>
                        <td className={`py-2 px-3 text-right font-black ${Number(m.qtyBaseUnit) < 0 ? 'text-[#C62828]' : 'text-[#16845B]'}`}>{Number(m.qtyBaseUnit) > 0 ? '+' : ''}{fmtNum(m.qtyBaseUnit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
