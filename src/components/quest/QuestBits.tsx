'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays, Check, CircleDot, Compass, Footprints, Lock, Mountain, NotebookPen, RotateCcw, ShieldCheck,
} from 'lucide-react';
import { BadgeDefinition, getLevel, SessionProgress } from '@/lib/quest/progress';
import { QUEST_TRACKS } from '@/lib/quest/programs';
import { questRoutes } from '@/lib/quest/routes';
import { getHumorMessage, HUMOR_LEVELS } from '@/lib/quest/humor';
import { HumorLevel } from '@/lib/quest/types';

// ─── Navigation interne à Quest ──────────────────────────────────────────────

export function QuestNav() {
  const pathname = usePathname();
  const tabs = [
    { href: questRoutes.home, label: 'Aventure' },
    ...QUEST_TRACKS.map(t => ({ href: questRoutes.track(t.id), label: t.name.replace('Parcours ', '') })),
    { href: questRoutes.carnet, label: 'Carnet' },
  ];
  return (
    <nav aria-label="Sections de Squatty Quest" className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
      <div className="flex gap-2 w-max">
        {tabs.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
                active
                  ? 'bg-orange-500/15 border-orange-400/40 text-orange-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Statut d'une séance ─────────────────────────────────────────────────────

export function StatusPill({ status }: { status: SessionProgress }) {
  if (status === 'complete') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><Check className="w-3 h-3" />Complète</span>;
  }
  if (status === 'partial') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-amber-500/15 text-amber-300 border border-amber-500/30"><CircleDot className="w-3 h-3" />Partielle</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-slate-700/40 text-slate-400 border border-slate-600/40">À faire</span>;
}

// ─── XP et niveau ────────────────────────────────────────────────────────────

export function XpBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const level = getLevel(xp);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-sm font-semibold text-white">
          Niveau {level.level} · <span className="quest-gradient-text">{level.title}</span>
        </span>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {xp} XP{level.nextMin ? ` / ${level.nextMin}` : ''}
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-label="Progression vers le niveau suivant"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level.progress * 100)}
      >
        <div className="h-full quest-gradient rounded-full transition-all duration-500" style={{ width: `${level.progress * 100}%` }} />
      </div>
      {!compact && (
        <p className="text-[11px] text-slate-500 mt-1.5">
          Les XP récompensent ta régularité dans l’application. Ce n’est pas une mesure de ta condition physique.
        </p>
      )}
    </div>
  );
}

// ─── Écussons ────────────────────────────────────────────────────────────────

const BADGE_ICONS: Record<string, React.ElementType> = {
  'premier-pas': Footprints,
  fidele: ShieldCheck,
  'retour-gagnant': RotateCcw,
  'semaine-bouclee': CalendarDays,
  'touche-a-tout': Compass,
  'carnet-tenu': NotebookPen,
  sommet: Mountain,
};

export function BadgeShield({ badge, unlocked, size = 56 }: { badge: BadgeDefinition; unlocked: boolean; size?: number }) {
  const Icon = unlocked ? BADGE_ICONS[badge.id] ?? ShieldCheck : Lock;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size * 1.15 }}>
      <svg viewBox="0 0 48 56" width={size} height={size * 1.15} aria-hidden="true">
        <path
          d="M24 2 44 9v18c0 13-9 22-20 27C13 49 4 40 4 27V9z"
          className={unlocked ? 'fill-amber-400/90 stroke-amber-200' : 'fill-slate-800 stroke-slate-600'}
          strokeWidth="2"
        />
        <path
          d="M24 7 39 12.5v14.5c0 10-7 17.5-15 21.5-8-4-15-11.5-15-21.5V12.5z"
          className={unlocked ? 'fill-orange-500/90' : 'fill-slate-900'}
        />
      </svg>
      <Icon className={`absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 ${unlocked ? 'text-white' : 'text-slate-600'}`} style={{ width: size * 0.38, height: size * 0.38 }} />
    </div>
  );
}

// ─── Choix du ton ────────────────────────────────────────────────────────────

export function HumorSelector({ value, onChange }: { value: HumorLevel; onChange: (level: HumorLevel) => void }) {
  return (
    <div role="radiogroup" aria-label="Ton des messages" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {HUMOR_LEVELS.map(level => {
        const selected = value === level.id;
        return (
          <button
            key={level.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(level.id)}
            className={`text-left p-3 rounded-xl border transition-colors ${
              selected ? 'border-orange-400/60 bg-orange-500/10' : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{level.label}</span>
              {selected && <Check className="w-4 h-4 text-orange-300" />}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{level.description}</p>
            <p className="text-xs text-slate-500 italic mt-2">« {getHumorMessage('rest_start', level.id, 0)} »</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Bulle de message ────────────────────────────────────────────────────────

export function QuestMessage({ text }: { text: string }) {
  return (
    <p aria-live="polite" className="text-sm text-orange-100/90 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3.5 py-2.5">
      {text}
    </p>
  );
}
