'use client';

import { Pause, Play, SkipForward } from 'lucide-react';
import { formatClock } from '@/lib/quest/timer';

interface CountdownRingProps {
  label: string;
  remaining: number;
  total: number;
  running: boolean;
  onToggle: () => void;
  onAdd: (seconds: number) => void;
  onSkip: () => void;
  skipLabel: string;
}

export default function CountdownRing({ label, remaining, total, running, onToggle, onAdd, onSkip, skipLabel }: CountdownRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? remaining / total : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44" role="timer" aria-label={label}>
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} className="stroke-slate-800" strokeWidth="9" fill="none" />
          <circle
            cx="60" cy="60" r={radius} fill="none" strokeWidth="9" strokeLinecap="round"
            className="stroke-orange-400 transition-[stroke-dashoffset] duration-200"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span data-testid="countdown-value" className="text-4xl font-black text-white tabular-nums">{formatClock(remaining)}</span>
          <span className="text-xs text-slate-400 mt-1">{running ? label : 'En pause'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button type="button" onClick={() => onAdd(-15)} className="btn-secondary !px-3 !py-2 tabular-nums" aria-label="Retirer 15 secondes">−15 s</button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={running ? 'Mettre en pause' : 'Reprendre'}
          className="w-12 h-12 rounded-full quest-gradient text-white flex items-center justify-center shadow-lg"
        >
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button type="button" onClick={() => onAdd(15)} className="btn-secondary !px-3 !py-2 tabular-nums" aria-label="Ajouter 15 secondes">+15 s</button>
      </div>
      <button type="button" onClick={onSkip} className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white">
        <SkipForward className="w-4 h-4" /> {skipLabel}
      </button>
    </div>
  );
}
