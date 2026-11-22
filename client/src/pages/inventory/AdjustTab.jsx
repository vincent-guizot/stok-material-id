import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus } from 'lucide-react';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Modal, Field, EmptyState, LoadingRows, ErrorBox, ProductUnitSelect } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, btnGhost, errMsg, fmtDateTime, fmtNum } from '../../components/ui/helpers.js';
import { useMovements, INVALIDATE_AFTER_STOCK } from './useMovements.js';

export default function AdjustTab({ products, onToast, prefill, onPrefillUsed }) {
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin';
  const q = useMovements('ADJUSTMENT');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ productId: '', actual: '', reason: '' });
  const [error, setError] = useState('');
  const product = products.find((p) => p.id === f.productId);

  const openForm = (p) => { setF({ productId: p?.id || '', actual: p ? String(p.currentStockBase) : '', reason: '' }); setError(''); setOpen(true); };
  React.useEffect(() => {
    if (prefill) { openForm(prefill); onPrefillUsed?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const save = useMutation({
    mutationFn: async (payload) => (await api.post('/stocks/adjust', payload)).data,
    onSuccess: (res) => {
      INVALIDATE_AFTER_STOCK.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setOpen(false);
      onToast('success', res.message);
    },
    onError: (err) => setError(errMsg(err, 'Gagal menyesuaikan stok.')),
  });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!f.productId) return setError('Pilih material.');
    if (f.actual === '' || Number(f.actual) < 0) return setError('Stok fisik harus angka 0 atau lebih.');
    if (!f.reason.trim()) return setError('Alasan penyesuaian wajib diisi.');
    save.mutate({ productId: f.productId, actualBaseQty: Number(f.actual), reason: f.reason });
  };
  const rows = q.data || [];
  const sign = (n) => `${Number(n) > 0 ? '+' : ''}${fmtNum(n)}`;

  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Penyesuaian Stok (Koreksi Selisih)</h3>
          <p className="text-xs text-[#625D53]">Koreksi stok akibat rusak, hilang, atau salah hitung. Wajib disertai alasan{isAdmin ? '.' : ' dan hanya dapat dilakukan Admin.'}</p>
        </div>
        {isAdmin && <button onClick={() => openForm(null)} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Penyesuaian Baru</button>}
      </div>

      {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorBox error={q.error} onRetry={q.refetch} /> : rows.length === 0 ? (
        <EmptyState icon={Edit2} title="Belum ada penyesuaian stok" desc="Semua koreksi stok akan tercatat di sini lengkap dengan alasan dan petugasnya."
          action={isAdmin ? <button onClick={() => openForm(null)} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Penyesuaian Baru</button> : undefined} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
              <tr>
                <th className="py-2.5 px-3">WAKTU</th><th className="py-2.5 px-3">SKU</th><th className="py-2.5 px-3">MATERIAL</th>
                <th className="py-2.5 px-3 text-right">SEBELUM</th><th className="py-2.5 px-3 text-right">SESUDAH</th><th className="py-2.5 px-3 text-right">SELISIH</th>
                <th className="py-2.5 px-3">ALASAN</th><th className="py-2.5 px-3">PETUGAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEDCCF]/70">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-[#F7F4ED]/50 transition">
                  <td className="py-3 px-3 text-[#625D53]">{fmtDateTime(m.createdAt)}</td>
                  <td className="py-3 px-3 font-mono text-[#234536] font-bold">{m.product?.sku}</td>
                  <td className="py-3 px-3 font-bold text-[#252922]">{m.product?.name}</td>
                  <td className="py-3 px-3 text-right">{fmtNum(m.previousStock)} {m.product?.baseUnit}</td>
                  <td className="py-3 px-3 text-right">{fmtNum(m.newStock)} {m.product?.baseUnit}</td>
                  <td className={`py-3 px-3 text-right font-black ${Number(m.qtyBaseUnit) < 0 ? 'text-[#C62828]' : 'text-[#16845B]'}`}>{sign(m.qtyBaseUnit)}</td>
                  <td className="py-3 px-3">{m.reason || '-'}</td>
                  <td className="py-3 px-3 text-[#625D53]">{m.creator?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title="Penyesuaian Stok" subtitle="Isi jumlah fisik riil dalam satuan dasar." onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Material *">
              <ProductUnitSelect withUnit={false} products={products} value={f} onChange={(v) => setF((p) => ({ ...p, productId: v.productId, actual: String(products.find((x) => x.id === v.productId)?.currentStockBase ?? '') }))} />
            </Field>
            {product && <p className="text-[11px] text-[#625D53]">Stok di sistem: <b>{fmtNum(product.currentStockBase)} {product.baseUnit}</b> ({product.humanReadableStock})</p>}
            <Field label={`Stok fisik riil (${product?.baseUnit || 'satuan dasar'}) *`}>
              <input type="number" min="0" step="any" className={inputCls} value={f.actual} onChange={(e) => setF((p) => ({ ...p, actual: e.target.value }))} />
            </Field>
            <Field label="Alasan *"><input className={inputCls} value={f.reason} onChange={(e) => setF((p) => ({ ...p, reason: e.target.value }))} placeholder="Contoh: kantong sobek saat bongkar muat" /></Field>
            {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className={btnGhost}>Batal</button>
              <button type="submit" disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'Menyimpan...' : 'Simpan Penyesuaian'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
