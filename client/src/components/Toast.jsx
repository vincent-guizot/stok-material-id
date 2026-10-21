import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast?.show) return null;

  const bgClass =
    toast.type === 'error'
      ? 'bg-rose-600 text-white'
      : toast.type === 'info'
      ? 'bg-blue-600 text-white'
      : 'bg-[#234536] text-white';

  return (
    <div
      role="alert"
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-card text-xs font-bold shadow-xl border border-white/20 transition-all ${bgClass}`}
    >
      {toast.type === 'error' ? (
        <AlertCircle className="w-4 h-4 text-white shrink-0" />
      ) : toast.type === 'info' ? (
        <Info className="w-4 h-4 text-white shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
      )}
      <span className="max-w-xs sm:max-w-sm">{toast.message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white transition p-0.5"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Toast;
