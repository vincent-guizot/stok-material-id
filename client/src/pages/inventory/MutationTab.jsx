import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Repeat, Plus } from 'lucide-react';
import api from '../../services/api.js';
import { Modal, Field, EmptyState, LoadingRows, ErrorBox, ProductUnitSelect } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, btnGhost, errMsg, fmtDateTime, fmtNum } from '../../components/ui/helpers.js';
import { useMovements, INVALIDATE_AFTER_STOCK } from './useMovements.js';

const blank = { productId: '', unitId: '', qty: '', fromLocation: '', toLocation: '', notes: '' };

export default function MutationTab({ products, onToast }) {
  const qc = useQueryClient();
  const q = useMovements('TRANSFER');
  const branches = useQuery({ queryKey: ['branches'], queryFn: async () => (await api.get('/branches')).data.data });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [error, setError] = useState('');
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const product = products.find((p) => p.id === f.productId);

  const locations = useMemo(() => {
    const s = new Set([...(products.map((p) => p.location).filter(Boolean)), ...((branches.data || []).map((b) => b.name))]);
    return [...s];
  }, [products, branches.data]);

  const save = useMutation({
    mutationFn: async (payload) => (await api.post('/stocks/transfer', payload)).data,
    onSuccess: (res) => {
      INVALIDATE_AFTER_STOCK.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setOpen(false);
      onToast('success', res.message);
    },
    onError: (err) => setError(errMsg(err, 'Gagal mencatat mutasi.')),
  });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!f.productId) return setError('Pilih material yang dipindahkan.');
    if (!(Number(f.qty) > 0)) return setError('Jumlah harus lebih dari 0.');
    if (!f.fromLocation.trim() || !f.toLocation.trim()) return setError('Lokasi asal dan tujuan wajib diisi.');
    save.mutate({ ...f, qty: Number(f.qty) });
  };
  const rows = q.data || [];
  const openForm = () => { setF(blank); setError(''); setOpen(true); };

  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Mutasi Stok Antar Gudang & Rak</h3>
          <p className="text-xs text-[#625D53]">Memindahkan lokasi simpan material. Total stok tidak berubah.</p>
        </div>
        <button onClick={openForm} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Mutasi Baru</button>
      </div>

      {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorBox error={q.error} onRetry={q.refetch} /> : rows.length === 0 ? (
        <EmptyState icon={Repeat} title="Belum ada mutasi lokasi" desc="Catat perpindahan material antar gudang atau rak di sini."
          action={<button onClick={openForm} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Mutasi Baru</button>} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
              <tr>
                <th className="py-2.5 px-3">NO. MUTASI</th><th className="py-2.5 px-3">WAKTU</th><th className="py-2.5 px-3">MATERIAL</th>
                <th className="py-2.5 px-3">DARI</th><th className="py-2.5 px-3">KE</th><th className="py-2.5 px-3 text-center">JUMLAH</th><th className="py-2.5 px-3">PETUGAS</th><th className="py-2.5 px-3">CATATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEDCCF]/70">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-[#F7F4ED]/50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-[#234536]">{m.refNo}</td>
                  <td className="py-3 px-3 text-[#625D53]">{fmtDateTime(m.createdAt)}</td>
                  <td className="py-3 px-3 font-bold text-[#252922]">{m.product?.name}</td>
                  <td className="py-3 px-3">{m.fromLocation}</td>
                  <td className="py-3 px-3">{m.toLocation}</td>
                  <td className="py-3 px-3 text-center font-bold">{fmtNum(m.qtyInput)} {m.unitName}</td>
                  <td className="py-3 px-3 text-[#625D53]">{m.creator?.name || '-'}</td>
                  <td className="py-3 px-3 text-[#625D53]">{m.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title="Mutasi Lokasi Stok" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Material *">
              <ProductUnitSelect products={products} value={f} onChange={(v) => set({ ...v, fromLocation: products.find((p) => p.id === v.productId)?.location || f.fromLocation })} />
            </Field>
            <Field label="Jumlah *" hint={product ? `Stok total: ${product.humanReadableStock || product.currentStockBase}` : undefined}>
              <input type="number" min="0" step="any" className={inputCls} value={f.qty} onChange={(e) => set({ qty: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lokasi asal *"><input list="loc-list" className={inputCls} value={f.fromLocation} onChange={(e) => set({ fromLocation: e.target.value })} /></Field>
              <Field label="Lokasi tujuan *"><input list="loc-list" className={inputCls} value={f.toLocation} onChange={(e) => set({ toLocation: e.target.value })} /></Field>
            </div>
            <datalist id="loc-list">{locations.map((l) => <option key={l} value={l} />)}</datalist>
            <Field label="Catatan"><input className={inputCls} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
            {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className={btnGhost}>Batal</button>
              <button type="submit" disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'Menyimpan...' : 'Simpan Mutasi'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
