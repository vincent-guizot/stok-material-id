import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  iconBg = 'bg-emerald-50 text-[#234536]',
  title,
  value,
  subtitle,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  className = '',
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-card border border-[#DEDCCF] p-3.5 sm:p-4 flex items-center justify-between gap-2.5 shadow-card transition-all w-full min-w-0 overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-[#234536] hover:shadow-card-hover' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
        {Icon && (
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </div>
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-xs font-semibold text-[#625D53] truncate" title={title}>
            {title}
          </div>
          <div
            className="text-base sm:text-lg lg:text-base xl:text-xl font-extrabold text-[#252922] tracking-tight mt-0.5 truncate"
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </div>
          {subtitle && (
            <div className="text-[11px] sm:text-xs text-[#8C877D] mt-0.5 font-medium truncate" title={subtitle}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {trend && (
        <div
          className={`shrink-0 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
            trendType === 'up'
              ? 'bg-emerald-50 text-[#16845B]'
              : trendType === 'down'
              ? 'bg-rose-50 text-[#C62828]'
              : 'bg-stone-100 text-[#625D53]'
          }`}
        >
          {trendType === 'up' && <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
          {trendType === 'down' && <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
          <span className="truncate">{trend}</span>
        </div>
      )}
    </div>
  );
}
