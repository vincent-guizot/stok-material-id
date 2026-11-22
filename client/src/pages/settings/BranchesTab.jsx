import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Modal, Field, EmptyState, LoadingRows, ErrorBox } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, btnGhost, errMsg } from '../../components/ui/helpers.js';

const STATUSES = ['Aktif', 'Dalam Persiapan', 'Nonaktif'];
const STATUS_CLS = { Aktif: 'bg-emerald-100 text-[#16845B]', 'Dalam Persiapan': 'bg-amber-100 text-[#B45309]', Nonaktif: 'bg-stone-200 text-[#625D53]' };
const blank = { name: '', address: '', type: '', status: 'Aktif' };

export default function BranchesTab({ onToast }) {
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin';
  const q = useQuery({ queryKey: ['branches'], queryFn: async () => (await api.get('/branches')).data.data });
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['branches'] });

  const save = useMutation({
    mutationFn: async (f) => (f.id ? await api.put(`/branches/${f.id}`, f) : await api.post('/branches', f)).data,
    onSuccess: (r) => { refresh(); setForm(null); onToast('success', r.message); },
    onError: (err) => setError(errMsg(err)),
  });
  const del = useMutation({
    mutationFn: async (id) => (await api.delete(`/branches/${id}`)).data,
    onSuccess: (r) => { refresh(); onToast('success', r.message); },
    onError: (err) => onToast('error', errMsg(err)),
  });
  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Nama cabang wajib diisi.');
    save.mutate(form);
  };

  const rows = q.data || [];
  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Cabang & Gudang</h3>
          <p className="text-xs text-[#625D53]">Daftar lokasi toko dan gudang yang Anda kelola.</p>
        </div>
        {isAdmin && <button onClick={() => { setError(''); setForm({ ...blank }); }} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Tambah Cabang</button>}
      </div>
      {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorBox error={q.error} onRetry={q.refetch} /> : rows.length === 0 ? (
        <EmptyState icon={Building2} title="Belum ada cabang" desc="Tambahkan toko atau gudang agar bisa dipakai pada mutasi stok." action={isAdmin ? <button onClick={() => setForm({ ...blank })} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Tambah Cabang</button> : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {rows.map((b) => (
            <div key={b.id} className="p-4 rounded-card bg-[#F7F4ED]/60 border border-[#DEDCCF] space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-extrabold text-sm text-[#252922]">{b.name}{b.isMain && <span className="ml-1.5 text-[10px] font-bold text-[#234536]">• Pusat</span>}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_CLS[b.status] || STATUS_CLS.Nonaktif}`}>{b.status}</span>
              </div>
              <div className="text-xs text-[#625D53]">{b.address || '-'}</div>
              <div className="flex items-center justify-between text-[11px] text-[#8C877D]">
                <span>{b.type || '-'}</span>
                {isAdmin && (
                  <span className="flex items-center gap-2">
                    <button aria-label={`Ubah ${b.name}`} onClick={() => { setError(''); setForm({ id: b.id, name: b.name, address: b.address || '', type: b.type || '', status: b.status }); }} className="text-[#234536] cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                    {!b.isMain && <button aria-label={`Hapus ${b.name}`} onClick={() => window.confirm(`Hapus cabang "${b.name}"?`) && del.mutate(b.id)} className="text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {form && (
        <Modal title={form.id ? 'Ubah Cabang' : 'Tambah Cabang'} onClose={() => setForm(null)}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nama cabang *"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Alamat"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jenis"><input className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Toko / Gudang" /></Field>
              <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
            {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setForm(null)} className={btnGhost}>Batal</button><button disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'Menyimpan...' : 'Simpan'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
