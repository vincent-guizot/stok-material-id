import React from 'react';

/**
 * MaterialImage renders visual illustration for building materials
 * matching the aesthetic in StokMaterial.id design screenshots
 */
export default function MaterialImage({ name = '', sku = '', className = 'w-12 h-12' }) {
  const lower = (name + ' ' + sku).toLowerCase();

  // Semen (Sack)
  if (lower.includes('semen') || lower.includes('mortar') || lower.includes('smn')) {
    return (
      <div className={`relative flex items-center justify-center bg-amber-50 rounded-lg overflow-hidden border border-amber-200/60 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Sack bag body */}
          <path d="M16 18 C16 14, 48 14, 48 18 L52 52 C52 56, 12 56, 12 52 Z" fill="#D97706" />
          <path d="M18 20 C22 17, 42 17, 46 20 L49 50 C47 53, 17 53, 15 50 Z" fill="#F59E0B" />
          {/* Top fold */}
          <path d="M18 16 C22 13, 42 13, 46 16 L48 19 L16 19 Z" fill="#B45309" />
          {/* Logo badge on sack */}
          <circle cx="32" cy="34" r="9" fill="#DC2626" />
          <circle cx="32" cy="34" r="7" fill="#FBBF24" />
          <path d="M29 32 L35 32 M32 29 L32 39" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
          {/* Text lines */}
          <rect x="22" y="45" width="20" height="2" rx="1" fill="#78350F" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // Bata Ringan / Hebel (White Block)
  if (lower.includes('bata') || lower.includes('hebel') || lower.includes('bta')) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Isometric white brick block */}
          <path d="M14 26 L32 16 L50 26 L32 36 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M14 26 L32 36 L32 48 L14 38 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M32 36 L50 26 L50 38 L32 48 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Hebel porosity dots */}
          <circle cx="24" cy="35" r="0.8" fill="#94A3B8" />
          <circle cx="28" cy="40" r="0.8" fill="#94A3B8" />
          <circle cx="20" cy="32" r="0.8" fill="#94A3B8" />
          <circle cx="40" cy="35" r="0.8" fill="#64748B" />
          <circle cx="44" cy="32" r="0.8" fill="#64748B" />
        </svg>
      </div>
    );
  }

  // Besi Beton / Baja Ringan (Steel Rods)
  if (lower.includes('besi') || lower.includes('baja') || lower.includes('bsi') || lower.includes('spandek') || lower.includes('hollow')) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Bundle of steel rebar */}
          <g transform="rotate(-30 32 32)">
            <rect x="12" y="20" width="40" height="5" rx="2.5" fill="#475569" />
            <rect x="10" y="27" width="44" height="5" rx="2.5" fill="#334155" />
            <rect x="14" y="34" width="38" height="5" rx="2.5" fill="#64748B" />
            <rect x="8" y="41" width="46" height="5" rx="2.5" fill="#1E293B" />
            {/* Ribs / ulir markings */}
            <path d="M18 20 L16 25 M24 20 L22 25 M30 20 L28 25 M36 20 L34 25 M42 20 L40 25" stroke="#94A3B8" strokeWidth="1" />
            <path d="M16 27 L14 32 M22 27 L20 32 M28 27 L26 32 M34 27 L32 32 M40 27 L38 32 M46 27 L44 32" stroke="#64748B" strokeWidth="1" />
            {/* Binding wire */}
            <ellipse cx="22" cy="33" rx="3" ry="14" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
            <ellipse cx="42" cy="33" rx="3" ry="14" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      </div>
    );
  }

  // Cat Tembok / Pelapis (Paint Can)
  if (lower.includes('cat') || lower.includes('dulux') || lower.includes('nippon') || lower.includes('aquaproof') || lower.includes('cat-')) {
    return (
      <div className={`relative flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden border border-blue-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Paint bucket */}
          <path d="M18 22 L46 22 L43 50 C43 53, 21 53, 21 50 Z" fill="#0284C7" />
          <path d="M20 28 L44 28 L42 46 C42 48, 22 48, 22 46 Z" fill="#38BDF8" />
          {/* Lid & rim */}
          <ellipse cx="32" cy="22" rx="14" ry="4" fill="#0369A1" />
          <ellipse cx="32" cy="20" rx="13" ry="3.5" fill="#E0F2FE" />
          {/* Metal handle */}
          <path d="M16 24 C16 10, 48 10, 48 24" stroke="#94A3B8" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Brand stripe */}
          <path d="M20 34 Q32 38 44 34 L43 42 Q32 46 21 42 Z" fill="#F59E0B" />
        </svg>
      </div>
    );
  }

  // Pipa PVC / Sanitasi
  if (lower.includes('pipa') || lower.includes('pvc') || lower.includes('rucika') || lower.includes('ppa')) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Isometric white PVC pipe */}
          <g transform="rotate(-15 32 32)">
            <path d="M16 24 L48 24 L48 34 L16 34 Z" fill="#F1F5F9" />
            <path d="M16 28 L48 28 L48 34 L16 34 Z" fill="#E2E8F0" />
            <ellipse cx="48" cy="29" rx="3" ry="5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
            <ellipse cx="16" cy="29" rx="3" ry="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            <ellipse cx="16" cy="29" rx="1.5" ry="3" fill="#0F172A" />
            {/* Second pipe below */}
            <path d="M18 36 L50 36 L50 44 L18 44 Z" fill="#F8FAFC" />
            <ellipse cx="50" cy="40" rx="2.5" ry="4" fill="#CBD5E1" />
            <ellipse cx="18" cy="40" rx="2.5" ry="4" fill="#38BDF8" />
            <ellipse cx="18" cy="40" rx="1.2" ry="2.2" fill="#0F172A" />
          </g>
        </svg>
      </div>
    );
  }

  // Kayu / Balok / Triplek
  if (lower.includes('kayu') || lower.includes('balok') || lower.includes('meranti') || lower.includes('triplek') || lower.includes('kyb')) {
    return (
      <div className={`relative flex items-center justify-center bg-amber-50 rounded-lg overflow-hidden border border-amber-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Timber wood beam */}
          <path d="M12 28 L40 18 L52 24 L24 34 Z" fill="#D97706" />
          <path d="M12 28 L24 34 L24 44 L12 38 Z" fill="#B45309" />
          <path d="M24 34 L52 24 L52 34 L24 44 Z" fill="#92400E" />
          {/* Wood grain rings on cross section */}
          <ellipse cx="18" cy="33" rx="4" ry="3" stroke="#78350F" strokeWidth="1" fill="none" />
          <ellipse cx="18" cy="33" rx="2" ry="1.5" stroke="#78350F" strokeWidth="1" fill="none" />
        </svg>
      </div>
    );
  }

  // Keramik / Lantai
  if (lower.includes('keramik') || lower.includes('granit') || lower.includes('lantai') || lower.includes('krm')) {
    return (
      <div className={`relative flex items-center justify-center bg-stone-50 rounded-lg overflow-hidden border border-stone-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Stack of square tiles */}
          <path d="M14 36 L32 26 L50 36 L32 46 Z" fill="#F5F5F4" stroke="#A8A29E" strokeWidth="1.5" />
          <path d="M14 36 L32 46 L32 48 L14 38 Z" fill="#D6D3D1" />
          <path d="M32 46 L50 36 L50 38 L32 48 Z" fill="#A8A29E" />
          {/* Tile cross pattern */}
          <path d="M23 31 L41 41 M23 41 L41 31" stroke="#E7E5E4" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // Seng Gelombang / Atap / Asbes
  if (lower.includes('seng') || lower.includes('gelombang') || lower.includes('atap') || lower.includes('asbes') || lower.includes('sng')) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Corrugated zinc roofing */}
          <path d="M14 22 L46 16 L50 42 L18 48 Z" fill="#94A3B8" />
          {/* Corrugation waves */}
          <path d="M18 48 Q21 46 24 48 Q27 50 30 48 Q33 46 36 48 Q39 50 42 48 Q45 46 48 48" stroke="#475569" strokeWidth="2" fill="none" />
          <path d="M16 26 L48 20 M20 32 L52 26 M24 38 L56 32 M28 44 L60 38" stroke="#CBD5E1" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // Pasir / Pasang / Agregat
  if (lower.includes('pasir') || lower.includes('psr')) {
    return (
      <div className={`relative flex items-center justify-center bg-amber-50 rounded-lg overflow-hidden border border-amber-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Mound of sand */}
          <path d="M12 48 Q32 20 52 48 Z" fill="#D97706" />
          <path d="M16 48 Q32 24 48 48 Z" fill="#F59E0B" />
          <path d="M22 48 Q32 30 42 48 Z" fill="#FCD34D" />
          <circle cx="28" cy="40" r="1" fill="#B45309" />
          <circle cx="36" cy="42" r="1" fill="#B45309" />
          <circle cx="32" cy="35" r="1" fill="#B45309" />
        </svg>
      </div>
    );
  }

  // Split / Kerikil / Batu
  if (lower.includes('split') || lower.includes('batu') || lower.includes('spl')) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Pile of gravel stones */}
          <path d="M14 48 Q32 26 50 48 Z" fill="#475569" />
          <path d="M18 48 Q32 30 46 48 Z" fill="#64748B" />
          {/* Little pebble chunks */}
          <polygon points="26,36 30,34 32,38 28,40" fill="#94A3B8" />
          <polygon points="34,36 38,35 40,39 36,41" fill="#CBD5E1" />
          <polygon points="22,42 26,40 28,44 24,45" fill="#334155" />
          <polygon points="30,42 34,41 35,45 31,46" fill="#94A3B8" />
          <polygon points="40,42 44,40 46,44 42,46" fill="#CBD5E1" />
        </svg>
      </div>
    );
  }

  // Paku / Baut / Perkakas
  if (lower.includes('paku') || lower.includes('baut') || lower.includes('perkakas') || lower.includes('pku')) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Multiple shiny steel nails */}
          <g transform="rotate(35 32 32)">
            <rect x="22" y="16" width="20" height="3" rx="1.5" fill="#64748B" />
            <path d="M30 19 L34 19 L32.5 48 Z" fill="#94A3B8" />
          </g>
          <g transform="rotate(-20 32 32)">
            <rect x="18" y="20" width="16" height="2.5" rx="1" fill="#475569" />
            <path d="M25 22.5 L28 22.5 L26.5 46 Z" fill="#64748B" />
          </g>
          <g transform="rotate(70 32 32)">
            <rect x="24" y="22" width="16" height="2.5" rx="1" fill="#334155" />
            <path d="M31 24.5 L34 24.5 L32.5 44 Z" fill="#475569" />
          </g>
        </svg>
      </div>
    );
  }

  // Listrik / Kabel
  if (lower.includes('kabel') || lower.includes('listrik') || lower.includes('kbl') || lower.includes('lampu')) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          {/* Black cable coil */}
          <ellipse cx="32" cy="32" rx="18" ry="12" stroke="#1E293B" strokeWidth="6" fill="none" />
          <ellipse cx="32" cy="32" rx="18" ry="12" stroke="#0F172A" strokeWidth="4" fill="none" />
          <ellipse cx="32" cy="32" rx="12" ry="8" stroke="#334155" strokeWidth="3" fill="none" />
          {/* Copper cable tips */}
          <circle cx="48" cy="28" r="2" fill="#B45309" />
          <circle cx="50" cy="31" r="1.5" fill="#3B82F6" />
          <circle cx="49" cy="34" r="1.5" fill="#EAB308" />
        </svg>
      </div>
    );
  }

  // Default Building Material Block
  return (
    <div className={`relative flex items-center justify-center bg-emerald-50 rounded-lg overflow-hidden border border-emerald-200/60 shadow-sm shrink-0 ${className}`}>
      <span className="text-2xl select-none">🧱</span>
    </div>
  );
}
