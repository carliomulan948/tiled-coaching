'use client';

import { useId } from 'react';
import { BRAND } from '@/lib/brand';

// Emblème original SQUATTY : un sentier en forme de « S » qui mène à une étoile.
export function SquattyMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  const gradientId = `squatty-grad-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f97316" />
          <stop offset="0.55" stopColor="#ec4899" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
      <path
        d="M26.5 12.5c-1.8-1.6-4.2-2.5-6.8-2.5-3.9 0-6.7 2.1-6.7 5.2 0 6.6 14 4.1 14 10.7 0 3.2-2.9 5.3-6.9 5.3-2.8 0-5.4-1-7.3-2.8"
        fill="none"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="12.6" cy="28.6" r="1.9" fill="white" />
      <path d="M31 6.2l1.1 2.3 2.5.4-1.8 1.8.4 2.5-2.2-1.2-2.3 1.2.5-2.5-1.8-1.8 2.5-.4z" fill="#fde68a" />
    </svg>
  );
}

export default function SquattyLogo({ subtitle, size = 36 }: { subtitle?: string; size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <SquattyMark size={size} className="flex-shrink-0 drop-shadow-lg" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-black tracking-wide text-white">{BRAND.name}</span>
        {subtitle && <span className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</span>}
      </span>
    </span>
  );
}
