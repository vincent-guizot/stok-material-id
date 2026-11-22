import React from 'react';

/**
 * Ilustrasi mandor/pekerja bangunan (SVG buatan sendiri, tanpa aset luar).
 * Dipakai untuk avatar profil, daftar mandor, dan banner bantuan.
 */
export default function WorkerAvatar({
  size = 40,
  helmet = '#F2B418',
  skin = '#E8B48A',
  shirt = '#234536',
  hair = '#2B2B2B',
  mustache = false,
  body = true,
  className = '',
  title = 'Mandor',
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="32" cy="32" r="32" fill="#F6EFE3" />
      <clipPath id={`clip-${helmet.replace('#', '')}-${shirt.replace('#', '')}`}>
        <circle cx="32" cy="32" r="32" />
      </clipPath>
      <g clipPath={`url(#clip-${helmet.replace('#', '')}-${shirt.replace('#', '')})`}>
        {body && <path d="M6 66c0-14 11-21 26-21s26 7 26 21z" fill={shirt} />}
        {body && <path d="M26 45l6 7 6-7z" fill="#fff" opacity=".9" />}
        <rect x="27" y="38" width="10" height="9" rx="3" fill={skin} />
        <ellipse cx="32" cy="30" rx="12" ry="13" fill={skin} />
        <path d="M20 27c1-9 7-14 12-14s11 5 12 14z" fill={helmet} />
        <rect x="17" y="25" width="30" height="5" rx="2.5" fill={helmet} />
        <rect x="29" y="11" width="6" height="5" rx="2" fill={helmet} />
        <path d="M17 27.5h30" stroke="#00000022" strokeWidth="1" />
        <path d="M20 30c-1 3 0 6 1 8M44 30c1 3 0 6-1 8" stroke={hair} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6" />
        <circle cx="27" cy="33" r="1.6" fill="#2B2B2B" />
        <circle cx="37" cy="33" r="1.6" fill="#2B2B2B" />
        {mustache && <path d="M26 38c3-2 5-1 6 0 1-1 3-2 6 0-2 2-4 2-6 1-2 1-4 1-6-1z" fill={hair} />}
        <path d="M28 38.5c2.5 2 5.5 2 8 0" stroke="#8a4b2a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
