import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { formatRupiah } from '../../utils/formatters.js';
import { roundRp } from '../../utils/calc.js';
import { Modal, Field, EmptyState, LoadingRows, ErrorBox, ProductUnitSelect } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, btnGhost, errMsg, todayStr, fmtDate } from '../../components/ui/helpers.js';

const blankLine = { productId: '', unitId: '', qty: '', unitCost: '' };

export default function StockInTab({ products, onToast, prefill, onPrefillUsed }) {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canPay = role === 'admin';
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ ...blankLine }]);
  const [formError, setFormError] = useState('');

  const purchases = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => (await api.get('/purchases', { params: { limit: 200 } })).data.data,
  });
  const suppliers = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/suppliers')).data.data,
  });

  const unitOf = (l) => products.find((p) => p.id === l.productId)?.units?.find((u) => u.id === l.unitId);
  const setLine = (i, patch) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const pickProduct = (i, v) => {
    const p = products.find((x) => x.id === v.productId);
    const u = p?.units?.find((x) => x.id === v.unitId) || p?.units?.[0];
    setLine(i, { ...v, unitId: v.unitId || u?.id || '', unitCost: u ? String(parseFloat(u.buyPrice) || 0) : '' });
  };

  const openForm = (product) => {
    const u = product?.units?.[0];
    setLines([product ? { productId: product.id, unitId: u?.id || '', qty: '', unitCost: String(parseFloat(u?.buyPrice) || 0) } : { ...blankLine }]);
    setDate(todayStr());
    setNotes('');
    setPaid(true);
    setFormError('');
    setOpen(true);
  };

  useEffect(() => {
    if (prefill) {
      openForm(prefill === true ? null : prefill);
      onPrefillUsed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const total = lines.reduce((a, l) => a + roundRp((Number(l.qty) || 0) * (Number(l.unitCost) || 0)), 0);

  const create = useMutation({
    mutationFn: async (payload) => (await api.post('/purchases', payload)).data,
    onSuccess: (res) => {
      ['purchases', 'products', 'suppliers', 'reports', 'notifications', 'movements'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setOpen(false);
      onToast('success', res.message || 'Pembelian tersimpan.');
    },
    onError: (err) => setFormError(errMsg(err, 'Gagal menyimpan pembelian.')),
  });

  const pay = useMutation({
    mutationFn: async (id) => (await api.post(`/purchases/${id}/pay`)).data,
    onSuccess: (res) => {
      ['purchases', 'suppliers', 'reports', 'notifications'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      onToast('success', res.message || 'Pembelian dilunasi.');
    },
    onError: (err) => onToast('error', errMsg(err)),
  });

  const submit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!supplierId) return setFormError('Pilih supplier terlebih dahulu.');
    const items = lines.filter((l) => l.productId);
    if (!items.length) return setFormError('Tambahkan minimal satu material.');
    for (const l of items) {
      if (!(Number(l.qty) > 0)) return setFormError('Jumlah setiap material harus lebih dari 0.');
      if (!(Number(l.unitCost) >= 0) || l.unitCost === '') return setFormError('Harga beli setiap material wajib diisi.');
    }
    create.mutate({
      supplierId, purchaseDate: date, paid, notes: notes || undefined,
      items: items.map((l) => ({ productId: l.productId, unitId: l.unitId, qty: Number(l.qty), unitCost: Number(l.unitCost) })),
    });
  };

  const rows = purchases.data || [];

  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Penerimaan Barang Masuk (PO Supplier)</h3>
          <p className="text-xs text-[#625D53]">Setiap pembelian menambah stok dan memperbarui harga modal (HPP) otomatis.</p>
        </div>
        <button onClick={() => openForm(null)} className={btnPrimary}>
          <Plus className="w-3.5 h-3.5" /> Input Barang Masuk Baru
        </button>
      </div>

      {purchases.isLoading ? (
        <LoadingRows />
      ) : purchases.isError ? (
        <ErrorBox error={purchases.error} onRetry={purchases.refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Belum ada pembelian barang"
          desc="Catat penerimaan barang dari supplier agar stok dan harga modal terisi."
          action={<button onClick={() => openForm(null)} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Input Barang Masuk</button>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
              <tr>
                <th className="py-2.5 px-3">NO. PO</th>
                <th className="py-2.5 px-3">TANGGAL</th>
                <th className="py-2.5 px-3">SUPPLIER</th>
                <th className="py-2.5 px-3">MATERIAL DITERIMA</th>
                <th className="py-2.5 px-3 text-right">TOTAL NILAI</th>
                <th className="py-2.5 px-3 text-center">PEMBAYARAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEDCCF]/70">
              {rows.map((po) => {
                const first = po.items?.[0];
                return (
                  <tr key={po.id} className="hover:bg-[#F7F4ED]/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#234536]">{po.number}</td>
                    <td className="py-3 px-3 text-[#625D53]">{fmtDate(po.purchaseDate)}</td>
                    <td className="py-3 px-3 font-bold text-[#252922]">{po.supplier?.name || '-'}</td>
                    <td className="py-3 px-3">
                      {first ? `${first.productName} (${Number(first.qty)} ${first.unitName})` : '-'}
                      {po.items?.length > 1 && <span className="text-[#8C877D]"> +{po.items.length - 1} lainnya</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-[#252922]">{formatRupiah(po.totalAmount)}</td>
                    <td className="py-3 px-3 text-center">
                      {po.paymentStatus === 'LUNAS' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#16845B] text-[10px] font-bold">Lunas</span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#B45309] text-[10px] font-bold">
                            Hutang{po.dueDate ? ` • tempo ${fmtDate(po.dueDate)}` : ''}
                          </span>
                          {canPay && (
                            <button
                              disabled={pay.isPending}
                              onClick={() => pay.mutate(po.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#234536] underline cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Tandai lunas
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal wide title="Input Barang Masuk dari Supplier" subtitle="Stok bertambah dan harga modal diperbarui setelah disimpan." onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Supplier *">
                <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Pilih supplier...</option>
                  {(suppliers.data || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tanggal Terima">
                <input type="date" className={inputCls} value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Pembayaran">
                <select className={inputCls} value={paid ? 'paid' : 'debt'} onChange={(e) => setPaid(e.target.value === 'paid')}>
                  <option value="paid">Lunas (tunai/transfer)</option>
                  <option value="debt">Hutang (sesuai tempo supplier)</option>
                </select>
              </Field>
            </div>
            {suppliers.data?.length === 0 && (
              <p className="text-[11px] text-amber-700">Belum ada supplier. Tambahkan dulu di menu Supplier.</p>
            )}

            <div className="space-y-2">
              {lines.map((l, i) => {
                const u = unitOf(l);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end p-2.5 bg-[#F7F4ED] rounded-control border border-[#DEDCCF]">
                    <div className="col-span-12 md:col-span-5">
                      <ProductUnitSelect products={products} value={l} onChange={(v) => pickProduct(i, v)} />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <input type="number" min="0" step="any" placeholder="Jumlah" className={inputCls} value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                    </div>
                    <div className="col-span-5 md:col-span-3">
                      <input type="number" min="0" step="any" placeholder={`Harga beli / ${u?.unitName || 'satuan'}`} className={inputCls} value={l.unitCost} onChange={(e) => setLine(i, { unitCost: e.target.value })} />
                    </div>
                    <div className="col-span-3 md:col-span-2 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black text-[#252922]">{formatRupiah(roundRp((Number(l.qty) || 0) * (Number(l.unitCost) || 0)))}</span>
                      {lines.length > 1 && (
                        <button type="button" aria-label="Hapus baris" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={() => setLines((prev) => [...prev, { ...blankLine }])} className={btnGhost}>
                <Plus className="w-3.5 h-3.5" /> Tambah material
              </button>
            </div>

            <Field label="Catatan (opsional)">
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="No. surat jalan supplier, kondisi barang, dll." />
            </Field>

            {formError && <p role="alert" className="text-xs font-bold text-rose-600">{formError}</p>}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#DEDCCF]">
              <div>
                <p className="text-[11px] text-[#625D53]">Total pembelian</p>
                <p className="text-lg font-black text-[#234536]">{formatRupiah(total)}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className={btnGhost}>Batal</button>
                <button type="submit" disabled={create.isPending} className={btnPrimary}>{create.isPending ? 'Menyimpan...' : 'Simpan Penerimaan'}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
