import React from 'react';
import { formatRupiah } from '../utils/formatters.js';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function CreditHealthBar({ customer }) {
  if (!customer) return null;

  const limit = parseFloat(customer.creditLimit) || 0;
  const debt = parseFloat(customer.currentDebt) || 0;
  const remaining = Math.max(0, limit - debt);
  const percentage = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;

  let theme = {
    bg: 'bg-emerald-50/80 border-emerald-200 text-[#16845B]',
    bar: 'bg-[#16845B]',
    badge: 'bg-[#16845B] text-white',
    icon: ShieldCheck,
    label: 'KASBON AMAN',
  };

  if (percentage >= 100 || debt >= limit) {
    theme = {
      bg: 'bg-red-50 border-red-300 text-[#C62828]',
      bar: 'bg-[#C62828]',
      badge: 'bg-[#C62828] text-white font-black',
      icon: AlertOctagon,
      label: 'PLAFON KREDIT HABIS!',
    };
  } else if (percentage >= 75) {
    theme = {
      bg: 'bg-amber-50 border-amber-300 text-[#D97706]',
      bar: 'bg-[#D97706]',
      badge: 'bg-[#D97706] text-white',
      icon: AlertTriangle,
      label: 'HAMPIR PENUH (75%+)',
    };
  }

  const Icon = theme.icon;

  return (
    <div className={`p-2.5 rounded-control border ${theme.bg} transition-all duration-300 text-xs`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider">{theme.label}</span>
        </div>
        <span className="text-[11px] font-bold text-[#625D53]">
          Terpakai: <span className="font-black text-[#252922]">{percentage}%</span>
        </span>
      </div>

      {/* Progress Bar Meteran */}
      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full ${theme.bar} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Info Limit & Sisa */}
      <div className="flex justify-between text-[11px] text-[#625D53] pt-0.5 border-t border-[#DEDCCF]/40">
        <div>
          <span>Hutang: </span>
          <span className="font-extrabold text-[#252922]">{formatRupiah(debt)}</span>
        </div>
        <div>
          <span>Sisa: </span>
          <span className="font-extrabold text-[#16845B]">{formatRupiah(remaining)}</span>
        </div>
      </div>
    </div>
  );
}
