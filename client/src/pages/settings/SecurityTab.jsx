import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Lock } from 'lucide-react';
import api from '../../services/api.js';
import { Field } from '../../components/ui/common.jsx';
import { inputCls, btnPrimary, errMsg } from '../../components/ui/helpers.js';

export default function SecurityTab({ onToast }) {
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: async () => (await api.put('/auth/password', { currentPassword: f.current, newPassword: f.next })).data,
    onSuccess: (r) => { setF({ current: '', next: '', confirm: '' }); onToast('success', r.message); },
    onError: (err) => setError(errMsg(err)),
  });
  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (f.next.length < 6) return setError('Kata sandi baru minimal 6 karakter.');
    if (f.next !== f.confirm) return setError('Konfirmasi kata sandi baru tidak cocok.');
    save.mutate();
  };
  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4 max-w-2xl">
      <div className="flex items-center gap-2.5 pb-2 border-b border-[#DEDCCF]">
        <ShieldCheck className="w-5 h-5 text-[#234536]" />
        <div><h3 className="font-extrabold text-sm text-[#252922]">Keamanan Akun & Sandi</h3><p className="text-[11px] text-[#625D53]">Ubah kata sandi akun yang sedang masuk.</p></div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Kata sandi saat ini *"><input type="password" autoComplete="current-password" className={inputCls} value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kata sandi baru *" hint="Minimal 6 karakter."><input type="password" autoComplete="new-password" className={inputCls} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
          <Field label="Konfirmasi sandi baru *"><input type="password" autoComplete="new-password" className={inputCls} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
        </div>
        {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
        <button disabled={save.isPending || !f.current} className={btnPrimary}><Lock className="w-3.5 h-3.5" /> {save.isPending ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</button>
      </form>
    </div>
  );
}
