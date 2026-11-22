import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Download } from 'lucide-react';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { EmptyState, LoadingRows, ErrorBox } from '../../components/ui/common.jsx';
import { btnPrimary, errMsg, fmtDateTime, fmtNum } from '../../components/ui/helpers.js';

export default function BackupTab({ onToast }) {
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin';
  const q = useQuery({ queryKey: ['backups'], enabled: isAdmin, queryFn: async () => (await api.get('/backup')).data.data });

  const run = useMutation({
    mutationFn: async () => {
      const res = await api.post('/backup', null, { responseType: 'blob' });
      const name = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '')?.[1] || 'stokmaterial-backup.json';
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return name;
    },
    onSuccess: (name) => { qc.invalidateQueries({ queryKey: ['backups'] }); onToast('success', `Cadangan ${name} dibuat dan diunduh.`); },
    onError: (err) => onToast('error', errMsg(err, 'Gagal membuat cadangan.')),
  });

  if (!isAdmin) return <div className="bg-white rounded-card border border-[#DEDCCF] shadow-card"><EmptyState icon={Database} title="Khusus Admin" desc="Pencadangan data hanya dapat dilakukan oleh Admin." /></div>;
  const rows = q.data || [];
  const last = rows[0];
  const sizeLabel = (b) => (b >= 1048576 ? `${fmtNum(b / 1048576, 2)} MB` : `${fmtNum(b / 1024, 1)} KB`);
  return (
    <div className="bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DEDCCF]">
        <div>
          <h3 className="font-extrabold text-sm text-[#252922]">Cadangan Data (Backup)</h3>
          <p className="text-xs text-[#625D53]">Mengunduh seluruh data toko (produk, transaksi, stok, pembelian, dll.) dalam satu berkas JSON. Kata sandi pengguna tidak ikut diekspor.</p>
        </div>
        <button onClick={() => run.mutate()} disabled={run.isPending} className={btnPrimary}><Download className="w-3.5 h-3.5" /> {run.isPending ? 'Membuat cadangan...' : 'Buat & Unduh Cadangan'}</button>
      </div>
      <div className="p-3.5 rounded-control bg-[#F7F4ED] border border-[#DEDCCF] text-xs">
        {last ? <>Cadangan terakhir: <b>{fmtDateTime(last.createdAt)}</b> • {sizeLabel(last.sizeBytes)}</> : 'Belum pernah membuat cadangan. Disarankan membuat cadangan secara berkala.'}
      </div>
      {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorBox error={q.error} onRetry={q.refetch} /> : rows.length > 0 && (
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold"><tr><th className="py-2.5 px-3">WAKTU</th><th className="py-2.5 px-3">BERKAS</th><th className="py-2.5 px-3 text-right">UKURAN</th><th className="py-2.5 px-3 text-right">TRANSAKSI</th><th className="py-2.5 px-3 text-right">PRODUK</th></tr></thead>
          <tbody className="divide-y divide-[#DEDCCF]/70">
            {rows.map((b) => (
              <tr key={b.id}><td className="py-2.5 px-3 text-[#625D53]">{fmtDateTime(b.createdAt)}</td><td className="py-2.5 px-3 font-mono">{b.fileName}</td><td className="py-2.5 px-3 text-right">{sizeLabel(b.sizeBytes)}</td><td className="py-2.5 px-3 text-right">{fmtNum(b.rowCounts?.Transaction)}</td><td className="py-2.5 px-3 text-right">{fmtNum(b.rowCounts?.Product)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
