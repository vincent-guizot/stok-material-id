import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Users } from 'lucide-react';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Modal, Field, EmptyState, LoadingRows, ErrorBox } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, btnGhost, errMsg, fmtDate } from '../../components/ui/helpers.js';

const ROLES = [
  { id: 'admin', label: 'Admin (Bos)', badge: '👑' },
  { id: 'cashier', label: 'Kasir Toko', badge: '🛒' },
  { id: 'warehouse', label: 'Staf Gudang', badge: '📦' },
];
const roleOf = (id) => ROLES.find((r) => r.id === id) || { label: id, badge: '👤' };
const blank = { name: '', username: '', role: 'cashier', password: '', isActive: true };

export default function UsersTab({ onToast }) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const isAdmin = me?.role === 'admin';
  const q = useQuery({ queryKey: ['users'], enabled: isAdmin, queryFn: async () => (await api.get('/users')).data.data });
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: async (f) => {
      if (f.id) {
        const body = { name: f.name, role: f.role, isActive: f.isActive };
        if (f.password) body.password = f.password;
        return (await api.put(`/users/${f.id}`, body)).data;
      }
      return (await api.post('/users', { name: f.name, username: f.username, role: f.role, password: f.password })).data;
    },
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['users'] }); setForm(null); onToast('success', r.message); },
    onError: (err) => setError(errMsg(err, 'Gagal menyimpan pengguna.')),
  });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Nama lengkap wajib diisi.');
    if (!form.id && !form.username.trim()) return setError('Username wajib diisi.');
    if (!form.id && form.password.length < 6) return setError('Kata sandi minimal 6 karakter.');
    if (form.id && form.password && form.password.length < 6) return setError('Kata sandi baru minimal 6 karakter.');
    save.mutate(form);
  };

  if (!isAdmin) {
    return <div className="bg-white rounded-card border border-[#DEDCCF] shadow-card"><EmptyState icon={Users} title="Khusus Admin" desc="Manajemen akun pengguna hanya dapat diakses oleh Admin." /></div>;
  }
  const rows = q.data || [];
  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Akun Pengguna & Hak Akses</h3>
          <p className="text-xs text-[#625D53]">Atur siapa yang boleh masuk dan peran masing-masing.</p>
        </div>
        <button onClick={() => { setError(''); setForm({ ...blank }); }} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Tambah Pengguna</button>
      </div>
      {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorBox error={q.error} onRetry={q.refetch} /> : rows.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada pengguna" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
              <tr><th className="py-2.5 px-3">NAMA</th><th className="py-2.5 px-3">USERNAME</th><th className="py-2.5 px-3">PERAN</th><th className="py-2.5 px-3">DIBUAT</th><th className="py-2.5 px-3 text-center">STATUS</th><th className="py-2.5 px-3 text-right">AKSI</th></tr>
            </thead>
            <tbody className="divide-y divide-[#DEDCCF]/70">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-[#F7F4ED]/50 transition">
                  <td className="py-3 px-3 font-bold text-[#252922]">{u.name}{u.id === me?.id && <span className="ml-1.5 text-[10px] font-bold text-[#234536]">(Anda)</span>}</td>
                  <td className="py-3 px-3 font-mono text-[#625D53]">{u.username}</td>
                  <td className="py-3 px-3">{roleOf(u.role).badge} {roleOf(u.role).label}</td>
                  <td className="py-3 px-3 text-[#625D53]">{fmtDate(u.createdAt)}</td>
                  <td className="py-3 px-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-emerald-100 text-[#16845B]' : 'bg-stone-200 text-[#625D53]'}`}>{u.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="py-3 px-3 text-right"><button aria-label={`Ubah ${u.name}`} onClick={() => { setError(''); setForm({ id: u.id, name: u.name, username: u.username, role: u.role, password: '', isActive: u.isActive }); }} className="text-[#234536] cursor-pointer"><Edit2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Ubah Pengguna' : 'Tambah Pengguna'} onClose={() => setForm(null)}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nama lengkap *"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Username *" hint={form.id ? 'Username tidak dapat diubah.' : 'Huruf kecil tanpa spasi.'}>
              <input className={inputCls} value={form.username} disabled={!!form.id} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peran"><select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></Field>
              {form.id && <Field label="Status"><select className={inputCls} value={form.isActive ? 'on' : 'off'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'on' })}><option value="on">Aktif</option><option value="off">Nonaktif</option></select></Field>}
            </div>
            <Field label={form.id ? 'Kata sandi baru (kosongkan bila tidak diubah)' : 'Kata sandi *'} hint="Minimal 6 karakter.">
              <input type="password" autoComplete="new-password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setForm(null)} className={btnGhost}>Batal</button><button disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'Menyimpan...' : 'Simpan'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
