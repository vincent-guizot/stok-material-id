import React from 'react';
import { X } from 'lucide-react';

import { inputCls } from './helpers.js';

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-[#625D53]">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-[#8C877D]">{hint}</span>}
    </label>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-2">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#F7F4ED] border border-[#DEDCCF] flex items-center justify-center text-[#8C877D]">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="font-extrabold text-sm text-[#252922]">{title}</p>
      {desc && <p className="text-xs text-[#625D53] max-w-sm">{desc}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function LoadingRows({ text = 'Memuat data...' }) {
  return <div className="py-10 text-center text-xs font-semibold text-[#8C877D]">{text}</div>;
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="m-4 p-4 rounded-card border border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-center justify-between gap-3">
      <span>{errMsg(error, 'Gagal memuat data dari server.')}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-extrabold underline cursor-pointer">
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#252922]/50 backdrop-blur-xs" onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto bg-white rounded-card border border-[#DEDCCF] shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[#DEDCCF] bg-[#F7F4ED] sticky top-0 z-10">
          <div>
            <h3 className="font-extrabold text-sm text-[#252922]">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#625D53]">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Tutup" className="p-1 text-[#8C877D] hover:text-[#252922] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/** Pilih produk lalu satuan. value = { productId, unitId } */
export function ProductUnitSelect({ products, value, onChange, withUnit = true }) {
  const product = products.find((p) => p.id === value.productId);
  return (
    <div className={`grid gap-2 ${withUnit ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <select
        className={inputCls}
        value={value.productId || ''}
        onChange={(e) => {
          const p = products.find((x) => x.id === e.target.value);
          onChange({ productId: e.target.value, unitId: p?.units?.[0]?.id || '' });
        }}
      >
        <option value="">Pilih material...</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.sku} - {p.name}
          </option>
        ))}
      </select>
      {withUnit && (
        <select
          className={inputCls}
          value={value.unitId || ''}
          disabled={!product}
          onChange={(e) => onChange({ productId: value.productId, unitId: e.target.value })}
        >
          {(product?.units || []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.unitName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
