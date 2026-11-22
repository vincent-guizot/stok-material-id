import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus } from 'lucide-react';
import api from '../../services/api.js';
import { Modal, Field, EmptyState, LoadingRows, ErrorBox, ProductUnitSelect } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, btnGhost, errMsg, fmtDateTime, fmtNum } from '../../components/ui/helpers.js';
import { useMovements, INVALIDATE_AFTER_STOCK } from './useMovements.js';

const blank = { productId: '', unitId: '', qty: '', destination: '', receiver: '', driver: '', notes: '' };

export default function StockOutTab({ products, onToast }) {
  const qc = useQueryClient();
  const q = useMovements('OUT');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [error, setError] = useState('');
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const product = products.find((p) => p.id === f.productId);

  const save = useMutation({
    mutationFn: async (payload) => (await api.post('/stocks/out', payload)).data,
    onSuccess: (res) => {
      INVALIDATE_AFTER_STOCK.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setOpen(false);
      onToast('success', res.message);
    },
    onError: (err) => setError(errMsg(err, 'Gagal mencatat barang keluar.')),
  });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!f.productId) return setError('Pilih material yang dikeluarkan.');
    if (!(Number(f.qty) > 0)) return setError('Jumlah harus lebih dari 0.');
    if (!f.destination.trim()) return setError('Tujuan pengiriman wajib diisi.');
    save.mutate({ ...f, qty: Number(f.qty) });
  };
  const rows = q.data || [];
  const openForm = () => { setF(blank); setError(''); setOpen(true); };

  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Riwayat Barang Keluar & Surat Jalan</h3>
          <p className="text-xs text-[#625D53]">Pengeluaran material non-kasir (kirim proyek, pemakaian sendiri). Stok langsung berkurang.</p>
        </div>
        <button onClick={openForm} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Catat Barang Keluar</button>
      </div>

      {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorBox error={q.error} onRetry={q.refetch} /> : rows.length === 0 ? (
        <EmptyState icon={Truck} title="Belum ada barang keluar" desc="Catat pengiriman ke proyek atau pemakaian internal agar stok tetap akurat."
          action={<button onClick={openForm} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Catat Barang Keluar</button>} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
              <tr>
                <th className="py-2.5 px-3">NO. SURAT JALAN</th><th className="py-2.5 px-3">WAKTU</th><th className="py-2.5 px-3">TUJUAN</th>
                <th className="py-2.5 px-3">PENERIMA</th><th className="py-2.5 px-3">MATERIAL</th><th className="py-2.5 px-3">SOPIR</th><th className="py-2.5 px-3">DICATAT OLEH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEDCCF]/70">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-[#F7F4ED]/50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-[#234536]">{m.refNo}</td>
                  <td className="py-3 px-3 text-[#625D53]">{fmtDateTime(m.createdAt)}</td>
                  <td className="py-3 px-3 font-bold text-[#252922]">{m.destination || '-'}</td>
                  <td className="py-3 px-3">{m.receiver || '-'}</td>
                  <td className="py-3 px-3">{m.product?.name} <span className="font-bold">({fmtNum(m.qtyInput)} {m.unitName})</span></td>
                  <td className="py-3 px-3">{m.driver || '-'}</td>
                  <td className="py-3 px-3 text-[#625D53]">{m.creator?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title="Catat Barang Keluar" subtitle="Nomor surat jalan dibuat otomatis." onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Material *"><ProductUnitSelect products={products} value={f} onChange={set} /></Field>
            <Field label="Jumlah *" hint={product ? `Stok tersedia: ${product.humanReadableStock || `${product.currentStockBase} ${product.baseUnit}`}` : undefined}>
              <input type="number" min="0" step="any" className={inputCls} value={f.qty} onChange={(e) => set({ qty: e.target.value })} />
            </Field>
            <Field label="Tujuan pengiriman *"><input className={inputCls} value={f.destination} onChange={(e) => set({ destination: e.target.value })} placeholder="Nama proyek / alamat" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Penerima"><input className={inputCls} value={f.receiver} onChange={(e) => set({ receiver: e.target.value })} /></Field>
              <Field label="Sopir / kendaraan"><input className={inputCls} value={f.driver} onChange={(e) => set({ driver: e.target.value })} /></Field>
            </div>
            <Field label="Catatan"><input className={inputCls} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
            {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className={btnGhost}>Batal</button>
              <button type="submit" disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'Menyimpan...' : 'Simpan & Kurangi Stok'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
