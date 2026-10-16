'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { SquattyMark } from '@/components/SquattyLogo';
import { StatusPill, XpBar } from '@/components/quest/QuestBits';
import { describeLog, formatDay } from '@/components/quest/format';
import { BRAND } from '@/lib/brand';
import { getNextSession, getPreferredTrack, getQuestSummary, QuestSummary } from '@/lib/quest/progress';
import { getSession } from '@/lib/quest/programs';
import { questRoutes } from '@/lib/quest/routes';
import { countSets, getDraft, getLogsForProfile, getPreferences } from '@/lib/quest/storage';
import { QuestDraft, QuestSession } from '@/lib/quest/types';

// Résumé Squatty Quest du profil actif, affiché sur le tableau de bord Squatty Pro.
export default function QuestDashboardCard({ profileId, profileName }: { profileId: string; profileName: string }) {
  const [summary, setSummary] = useState<QuestSummary | null>(null);
  const [next, setNext] = useState<QuestSession | undefined>();
  const [draft, setDraft] = useState<QuestDraft | null>(null);

  useEffect(() => {
    const logs = getLogsForProfile(profileId);
    const track = getPreferredTrack(logs, getPreferences(profileId));
    setSummary(getQuestSummary(logs, new Date()));
    setNext(track ? getNextSession(logs, track) : undefined);
    setDraft(getDraft(profileId));
  }, [profileId]);

  if (!summary) return null;

  const draftSession = draft ? getSession(draft.sessionId) : undefined;
  const last = summary.lastLog;

  return (
    <section data-testid="quest-dashboard-card" className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#1e2433] via-[#1d1530] to-[#25112a] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <SquattyMark size={36} />
          <div>
            <h2 className="font-bold text-white">{BRAND.questSpace}</h2>
            <p className="text-xs text-slate-400">Séances de {profileName} · données de cet appareil</p>
          </div>
        </div>
        <Link href={questRoutes.home} className="inline-flex items-center gap-1 text-sm text-orange-300 hover:text-orange-200">
          Ouvrir l’aventure <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cette semaine', value: summary.thisWeek, hint: summary.thisWeekPartial ? `dont ${summary.thisWeekPartial} partielle${summary.thisWeekPartial > 1 ? 's' : ''}` : 'séances notées' },
          { label: 'Complètes', value: summary.complete, hint: 'au total' },
          { label: 'Partielles', value: summary.partial, hint: 'à reprendre si tu veux' },
          { label: 'Séries', value: summary.setsDone, hint: 'réalisées au total' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-black/20 border border-white/5 p-3">
            <dt className="text-xs text-slate-400">{stat.label}</dt>
            <dd className="text-2xl font-black text-white tabular-nums">{stat.value}</dd>
            <dd className="text-[11px] text-slate-500">{stat.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-black/20 border border-white/5 p-3">
          <XpBar xp={summary.xp} compact />
          <p className="text-[11px] text-slate-500 mt-1.5">XP = régularité dans l’appli, pas une mesure de condition physique.</p>
        </div>
        <div className="min-w-0 rounded-xl bg-black/20 border border-white/5 p-3 flex flex-col justify-center gap-2">
          {draft && draftSession ? (
            <Link href={questRoutes.session(draftSession.id)} className="flex items-center justify-between gap-2 text-sm text-amber-100">
              <span>Séance en cours : {draftSession.title} ({countSets(draft.exercises).done}/{countSets(draft.exercises).planned})</span>
              <Play className="w-4 h-4 flex-shrink-0" />
            </Link>
          ) : next ? (
            <Link href={questRoutes.session(next.id)} className="flex items-center justify-between gap-2 text-sm text-white hover:text-orange-200">
              <span>Prochaine étape : <strong>{next.title}</strong> · semaine {next.week}</span>
              <Play className="w-4 h-4 flex-shrink-0 text-orange-300" />
            </Link>
          ) : (
            <Link href={questRoutes.home} className="text-sm text-white hover:text-orange-200">Choisir un parcours de démarrage →</Link>
          )}
          {last ? (
            <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
              <Link href={questRoutes.carnet} className="truncate hover:text-white">
                Dernière : {describeLog(last).title} · {formatDay(last.date)}
              </Link>
              <StatusPill status={last.status} />
            </div>
          ) : (
            <p className="text-xs text-slate-500">Aucune séance notée pour l’instant.</p>
          )}
        </div>
      </div>
    </section>
  );
}
