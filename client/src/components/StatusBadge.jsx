import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, AlertOctagon } from 'lucide-react';

/**
 * Accessible Status Badge following StokMaterial.id Forest & Sand design tokens
 * Always displays both text and icon
 */
export default function StatusBadge({ status, label, size = 'sm' }) {
  const normalized = (status || label || '').toLowerCase().trim();

  let config = {
    bg: 'bg-emerald-50 text-[#16845B] border-emerald-200',
    icon: CheckCircle2,
    text: label || 'Aman',
  };

  if (normalized.includes('aman') || normalized.includes('lunas') || normalized.includes('selesai') || normalized.includes('aktif')) {
    config = {
      bg: 'bg-[#16845B]/10 text-[#16845B] border-[#16845B]/20',
      icon: CheckCircle2,
      text: label || (normalized.includes('aktif') ? 'Aktif' : 'Aman'),
    };
  } else if (normalized.includes('menipis') || normalized.includes('mendekati')) {
    config = {
      bg: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
      icon: AlertTriangle,
      text: label || (normalized.includes('mendekati') ? 'Mendekati Limit' : 'Menipis'),
    };
  } else if (normalized.includes('habis') || normalized.includes('melebihi') || normalized.includes('over') || normalized.includes('non-aktif') || normalized.includes('batal')) {
    config = {
      bg: 'bg-[#C62828]/10 text-[#C62828] border-[#C62828]/20',
      icon: XCircle,
      text: label || (normalized.includes('melebihi') ? 'Melebihi Limit' : normalized.includes('non') ? 'Non-aktif' : 'Habis'),
    };
  } else if (normalized.includes('tempo') || normalized.includes('tertunda') || normalized.includes('pending')) {
    config = {
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: Clock,
      text: label || 'Jatuh Tempo',
    };
  } else if (normalized.includes('info')) {
    config = {
      bg: 'bg-[#3B6E8F]/10 text-[#3B6E8F] border-[#3B6E8F]/20',
      icon: AlertOctagon,
      text: label || 'Informasi',
    };
  }

  const Icon = config.icon;
  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-[11px] gap-1' 
    : size === 'md'
    ? 'px-3 py-1 text-sm gap-2'
    : 'px-2.5 py-0.5 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center font-bold rounded-full border ${sizeClasses} ${config.bg}`}>
      <Icon className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{config.text}</span>
    </span>
  );
}
