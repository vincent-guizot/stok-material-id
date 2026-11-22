import React from 'react';
import { LoadingRows, ErrorBox } from '../../components/ui/common.jsx';

export const card = 'bg-white rounded-card border border-[#DEDCCF] shadow-card';

/** Pembungkus status memuat / gagal untuk query laporan. */
export function QueryState({ q, children }) {
  if (q.isLoading) return <div className={card}><LoadingRows text="Memuat laporan..." /></div>;
  if (q.isError) return <div className={card}><ErrorBox error={q.error} onRetry={q.refetch} /></div>;
  return children(q.data);
}

export function Row({ label, value, strong, tone, indent }) {
  const color = tone === 'good' ? 'text-[#16845B]' : tone === 'bad' ? 'text-[#C62828]' : 'text-[#252922]';
  return (
    <div className={`flex items-center justify-between py-2 ${strong ? 'font-extrabold text-sm border-t border-[#DEDCCF]' : 'text-xs'} ${indent ? 'pl-4 text-[#625D53]' : ''}`}>
      <span>{label}</span>
      <span className={`font-black ${color}`}>{value}</span>
    </div>
  );
}
