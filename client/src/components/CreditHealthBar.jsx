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
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-600 text-white',
    icon: ShieldCheck,
    label: 'KASBON AMAN',
  };

  if (percentage >= 100 || debt >= limit) {
    theme = {
      bg: 'bg-red-50 border-red-300 text-red-900 animate-pulse',
      bar: 'bg-red-600',
      badge: 'bg-red-600 text-white font-black',
      icon: AlertOctagon,
      label: 'PLAFON KREDIT HABIS!',
    };
  } else if (percentage >= 75) {
    theme = {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      bar: 'bg-amber-500',
      badge: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      label: 'HAMPIR PENUH (75%+)',
    };
  }

  const Icon = theme.icon;

  return (
    <div className={`p-3 rounded-2xl border ${theme.bg} shadow-sm transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">{theme.label}</span>
        </div>
        <span className="text-xs font-bold text-slate-700">
          Terpakai: <span className="font-black">{percentage}%</span>
        </span>
      </div>

      {/* Progress Bar Meteran */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${theme.bar} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-3 gap-1 text-center text-xs">
        <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
          <div className="text-[10px] text-slate-500 font-medium">Batas Plafon</div>
          <div className="font-bold text-slate-800">{formatRupiah(limit)}</div>
        </div>
        <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
          <div className="text-[10px] text-slate-500 font-medium">Bon Belum Lunas</div>
          <div className="font-bold text-red-600">{formatRupiah(debt)}</div>
        </div>
        <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
          <div className="text-[10px] text-slate-500 font-medium">Sisa Kredit</div>
          <div className="font-bold text-emerald-700">{formatRupiah(remaining)}</div>
        </div>
      </div>
    </div>
  );
}
