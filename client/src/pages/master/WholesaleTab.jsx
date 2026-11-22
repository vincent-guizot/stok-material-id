import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Percent, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { formatRupiah } from '../../utils/formatters.js';
import { Modal, Field, EmptyState, LoadingRows, ErrorBox } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, btnGhost, errMsg, fmtNum } from '../../components/ui/helpers.js';

const TARGETS = ['Semua', 'Mandor', 'Pelanggan umum'];
const blank = { productId: '', unitId: '', label: '', minQty: '', price: '', target: 'Semua', isActive: true };

export default function WholesaleTab({ products, onToast }) {
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin';
  const q = useQuery({ queryKey: ['wholesale'], queryFn: async () => (await api.get('/wholesale')).data.data });
  const [form, setForm] = useState(null); // null = tertutup, objek = terbuka (id bila edit)
  const [error, setError] = useState('');

  const refresh = () => ['wholesale', 'products'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const save = useMutation({
    mutationFn: async (f) => {
      const body = { unitId: f.unitId, label: f.label, minQty: Number(f.minQty), price: Number(f.price), target: f.target, isActive: f.isActive };
      return (f.id ? await api.put(`/wholesale/${f.id}`, body) : await api.post('/wholesale', body)).data;
    },
    onSuccess: (r) => { refresh(); setForm(null); onToast('success', r.message); },
    onError: (err) => setError(errMsg(err, 'Gagal menyimpan aturan.')),
  });
  const del = useMutation({
    mutationFn: async (id) => (await api.delete(`/wholesale/${id}`)).data,
    onSuccess: (r) => { refresh(); onToast('success', r.message); },
    onError: (err) => onToast('error', errMsg(err)),
  });
  const toggle = useMutation({
    mutationFn: async (w) => (await api.put(`/wholesale/${w.id}`, { isActive: !w.isActive })).data,
    onSuccess: refresh,
    onError: (err) => onToast('error', errMsg(err)),
  });

  const unit = form && products.find((p) => p.id === form.productId)?.units?.find((u) => u.id === form.unitId);
  const open = (w) => {
    setError('');
    setForm(w ? { id: w.id, productId: w.productId, unitId: w.unitId, label: w.label, minQty: String(w.minQty), price: String(parseFloat(w.price)), target: w.target || 'Semua', isActive: w.isActive } : { ...blank });
  };
  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.unitId) return setError('Pilih material dan satuannya.');
    if (!form.label.trim()) return setError('Nama aturan wajib diisi.');
    if (!(Number(form.minQty) > 0)) return setError('Jumlah minimal harus lebih dari 0.');
    if (form.price === '' || Number(form.price) < 0) return setError('Harga grosir wajib diisi.');
    if (unit && Number(form.price) >= parseFloat(unit.sellPrice)) return setError(`Harga grosir harus lebih murah dari harga normal (${formatRupiah(unit.sellPrice)}).`);
    save.mutate(form);
  };

  const rows = q.data || [];
  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Tier & Aturan Harga Grosir</h3>
          <p className="text-xs text-[#625D53]">Harga satuan otomatis turun di kasir saat jumlah beli mencapai batas minimum.</p>
        </div>
        {isAdmin && <button onClick={() => open(null)} className={btnPrimary}><Percent className="w-3.5 h-3.5" /> Buat Aturan Grosir Baru</button>}
      </div>

      {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorBox error={q.error} onRetry={q.refetch} /> : rows.length === 0 ? (
        <EmptyState icon={Percent} title="Belum ada aturan harga grosir" desc="Buat aturan agar pembelian partai besar otomatis mendapat harga lebih murah di kasir."
          action={isAdmin ? <button onClick={() => open(null)} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Buat Aturan</button> : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {rows.map((w) => {
            const normal = parseFloat(w.unit?.sellPrice) || 0;
            const price = parseFloat(w.price) || 0;
            const save$ = normal - price;
            return (
              <div key={w.id} className={`p-4 rounded-card border space-y-2 transition ${w.isActive ? 'bg-[#F7F4ED]/60 border-[#DEDCCF]' : 'bg-stone-100 border-stone-200 opacity-70'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-xs text-[#252922]">{w.label}</div>
                    <div className="text-[11px] text-[#625D53]">{w.product?.name} • {w.unit?.unitName}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#16845B] font-bold text-[10px] whitespace-nowrap">
                    Hemat {formatRupiah(save$)} ({normal > 0 ? fmtNum((save$ / normal) * 100, 1) : 0}%)
                  </span>
                </div>
                <div className="text-xs text-[#625D53]">Min. beli <b className="text-[#252922]">{fmtNum(w.minQty)} {w.unit?.unitName}</b> → <b className="text-[#16845B]">{formatRupiah(price)}</b> <span className="line-through text-[#8C877D]">{formatRupiah(normal)}</span></div>
                <div className="flex items-center justify-between text-[11px] text-[#8C877D]">
                  <span>Berlaku untuk: <b className="text-[#234536]">{w.target || 'Semua'}</b> • {w.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  {isAdmin && (
                    <span className="flex items-center gap-2">
                      <button onClick={() => toggle.mutate(w)} className="font-bold underline cursor-pointer">{w.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
                      <button aria-label="Ubah aturan" onClick={() => open(w)} className="text-[#234536] cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button aria-label="Hapus aturan" onClick={() => window.confirm(`Hapus aturan "${w.label}"?`) && del.mutate(w.id)} className="text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Ubah Aturan Grosir' : 'Tambah Aturan Harga Grosir'} onClose={() => setForm(null)}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Material & satuan *">
              <div className="grid grid-cols-2 gap-2">
                <select className={inputCls} value={form.productId} disabled={!!form.id}
                  onChange={(e) => setForm({ ...form, productId: e.target.value, unitId: products.find((p) => p.id === e.target.value)?.units?.[0]?.id || '' })}>
                  <option value="">Pilih material...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className={inputCls} value={form.unitId} disabled={!form.productId || !!form.id} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                  {(products.find((p) => p.id === form.productId)?.units || []).map((u) => <option key={u.id} value={u.id}>{u.unitName}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Nama aturan *"><input className={inputCls} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Contoh: Grosir 20 sak+" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minimal beli *"><input type="number" min="0" step="any" className={inputCls} value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} /></Field>
              <Field label="Harga grosir / satuan *" hint={unit ? `Harga normal: ${formatRupiah(unit.sellPrice)}` : undefined}>
                <input type="number" min="0" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
            </div>
            <Field label="Berlaku untuk">
              <select className={inputCls} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>{TARGETS.map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setForm(null)} className={btnGhost}>Batal</button>
              <button type="submit" disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'Menyimpan...' : 'Simpan Aturan'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
