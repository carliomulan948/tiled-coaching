'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Info, ListChecks, NotebookPen, Play, Target, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { SquattyMark } from '@/components/SquattyLogo';
import { useQuestProfile } from '@/components/quest/useQuestProfile';
import { BadgeShield, HumorSelector, QuestMessage, QuestNav, StatusPill, XpBar } from '@/components/quest/QuestBits';
import { describeLog, formatDay } from '@/components/quest/format';
import { BRAND } from '@/lib/brand';
import { getHumorMessage } from '@/lib/quest/humor';
import {
  BADGES, getNextSession, getPreferredTrack, getTrackProgress, getUnlockedBadgeIds, getWeeklyMissions, totalXp,
} from '@/lib/quest/progress';
import { getSession, QUEST_TRACKS, plannedSetCount } from '@/lib/quest/programs';
import { questRoutes } from '@/lib/quest/routes';
import { clearDraft, countSets, getDraft } from '@/lib/quest/storage';
import { QuestDraft } from '@/lib/quest/types';

export default function QuestHomePage() {
  const { profile, logs, prefs, updatePrefs } = useQuestProfile();
  const [draft, setDraft] = useState<QuestDraft | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (profile) setDraft(getDraft(profile.id));
    setNow(new Date());
  }, [profile, logs]);

  const unlocked = useMemo(() => new Set(getUnlockedBadgeIds(logs)), [logs]);
  const missions = useMemo(() => (now ? getWeeklyMissions(logs, now) : []), [logs, now]);

  if (!profile || !now) return null;

  const xp = totalXp(logs);
  const preferredTrack = getPreferredTrack(logs, prefs);
  const nextSession = preferredTrack ? getNextSession(logs, preferredTrack) : undefined;
  const draftSession = draft ? getSession(draft.sessionId) : undefined;
  const draftSets = draft ? countSets(draft.exercises) : null;
  const welcomeSeed = logs.length + now.getDate();

  const abandonDraft = () => {
    if (!draft || !confirm('Abandonner la séance en cours ? Les séries non enregistrées seront perdues.')) return;
    clearDraft(profile.id, draft.runId);
    setDraft(null);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* En-tête */}
        <section className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-slate-900 via-[#1a1030] to-[#2a0f24] p-5 sm:p-6">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-pink-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-5 md:grid-cols-[1fr_minmax(0,320px)] md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <SquattyMark size={44} />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{BRAND.questSpace}</h1>
                  <p className="text-sm font-semibold quest-gradient-text">{BRAND.tagline}</p>
                </div>
              </div>
              <div className="mt-4"><QuestMessage text={getHumorMessage('welcome', prefs.humor, welcomeSeed)} /></div>
              <p className="text-xs text-slate-400 mt-3">
                Profil actif : <span className="text-slate-200 font-medium">{profile.name}</span> · carnet enregistré sur cet appareil uniquement
              </p>
            </div>
            <div className="rounded-xl bg-black/20 border border-white/5 p-4">
              <XpBar xp={xp} />
            </div>
          </div>
        </section>

        <QuestNav />

        {/* Séance en cours */}
        {draft && draftSession && draftSets && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Clock className="w-5 h-5 text-amber-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Séance en cours : {draftSession.title}</p>
              <p className="text-xs text-slate-400">{draftSets.done}/{draftSets.planned} séries cochées, pas encore enregistrée dans le carnet.</p>
            </div>
            <div className="flex gap-2">
              <Link href={questRoutes.session(draftSession.id)} className="btn-quest !py-2"><Play className="w-4 h-4" />Reprendre</Link>
              <button type="button" onClick={abandonDraft} className="btn-secondary !py-2" aria-label="Abandonner la séance en cours"><Trash2 className="w-4 h-4" /></button>
            </div>
          </section>
        )}

        {/* Prochaine étape */}
        <section className="card-dark">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-orange-300" />Continuer l’aventure</h2>
          {nextSession ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{QUEST_TRACKS.find(t => t.id === nextSession.trackId)?.name} · Semaine {nextSession.week} · Étape {nextSession.order}</p>
                <p className="text-lg font-bold text-white">{nextSession.title}</p>
                <p className="text-sm text-slate-400">{nextSession.focus} · environ {nextSession.estimatedMinutes} min · {plannedSetCount(nextSession)} séries</p>
              </div>
              <Link href={questRoutes.session(nextSession.id)} className="btn-quest justify-center">
                <Play className="w-4 h-4" />Lancer la séance
              </Link>
            </div>
          ) : preferredTrack ? (
            <p className="text-sm text-slate-300">Parcours terminé, bravo ! Choisis un autre parcours ci-dessous ou demande à ton coach un programme personnalisé.</p>
          ) : (
            <p className="text-sm text-slate-300">Choisis un parcours de démarrage ci-dessous pour commencer.</p>
          )}
        </section>

        {/* Parcours */}
        <section>
          <h2 className="font-semibold text-white mb-1">Parcours de démarrage · 4 semaines</h2>
          <p className="text-xs text-slate-500 mb-3">3 séances par semaine, du débutant à la reprise.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {QUEST_TRACKS.map(track => {
              const progress = getTrackProgress(logs, track.id);
              const active = preferredTrack === track.id;
              return (
                <Link
                  key={track.id}
                  href={questRoutes.track(track.id)}
                  className={`group rounded-2xl border bg-slate-900/60 overflow-hidden transition-colors ${active ? 'border-orange-400/50' : 'border-slate-700/70 hover:border-slate-500'}`}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${track.accent}`} />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{track.world}</p>
                      {active && <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-200 border border-orange-400/30">Parcours actif</span>}
                    </div>
                    <p className="text-lg font-bold text-white mt-1">{track.name}</p>
                    <p className="text-sm text-slate-400">{track.tagline}</p>
                    <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${track.accent}`} style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {progress.completed}/{progress.total} séances terminées{progress.partial > 0 ? ` · ${progress.partial} partielle${progress.partial > 1 ? 's' : ''}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 truncate">{track.equipment.join(' · ')}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm text-orange-300 group-hover:text-orange-200">
                      Voir la carte <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Missions */}
          <section className="card-dark">
            <h2 className="font-semibold text-white flex items-center gap-2"><ListChecks className="w-4 h-4 text-orange-300" />Missions de la semaine</h2>
            <p className="text-xs text-slate-500 mb-4">Facultatives : elles se renouvellent chaque lundi.</p>
            <ul className="space-y-3">
              {missions.map(m => (
                <li key={m.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className={m.done ? 'text-emerald-300' : 'text-slate-200'}>{m.done ? '✓ ' : ''}{m.title}</span>
                    <span className="text-xs text-slate-400 tabular-nums">{m.progress}/{m.goal}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
                    <div className={`h-full ${m.done ? 'bg-emerald-400' : 'quest-gradient'}`} style={{ width: `${(m.progress / m.goal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Écussons */}
          <section className="card-dark">
            <h2 className="font-semibold text-white">Écussons <span className="text-slate-500 font-normal text-sm">{unlocked.size}/{BADGES.length}</span></h2>
            <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BADGES.map(badge => {
                const has = unlocked.has(badge.id);
                return (
                  <li key={badge.id} className="flex items-center gap-2.5" aria-label={`${badge.title} : ${has ? 'débloqué' : 'à débloquer'}`}>
                    <BadgeShield badge={badge} unlocked={has} size={36} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${has ? 'text-amber-200' : 'text-slate-400'}`}>{badge.title}</p>
                      <p className="text-[11px] text-slate-500 leading-snug">{badge.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Dernières séances */}
        <section className="card-dark">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2"><NotebookPen className="w-4 h-4 text-orange-300" />Dernières séances</h2>
            <Link href={questRoutes.carnet} className="text-xs text-orange-300 hover:text-orange-200">Ouvrir le carnet →</Link>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400">{getHumorMessage('empty_history', prefs.humor, 0)}</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {logs.slice(0, 3).map(log => {
                const info = describeLog(log);
                return (
                  <li key={log.id} className="py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{info.title}</p>
                      <p className="text-xs text-slate-500">{formatDay(log.date)} · {info.label} · {log.setsDone}/{log.setsPlanned} séries</p>
                    </div>
                    <StatusPill status={log.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Réglages */}
        <section id="reglages" className="card-dark space-y-4">
          <div>
            <h2 className="font-semibold text-white">Réglages de {profile.name}</h2>
            <p className="text-xs text-slate-500">Ton des encouragements et des transitions. Les consignes techniques et les messages liés à la douleur restent toujours neutres.</p>
          </div>
          <HumorSelector value={prefs.humor} onChange={humor => updatePrefs({ humor })} />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={prefs.vibration} onChange={e => updatePrefs({ vibration: e.target.checked })} className="w-4 h-4 accent-orange-500" />
              Vibration à la fin des minuteurs
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={prefs.sound} onChange={e => updatePrefs({ sound: e.target.checked })} className="w-4 h-4 accent-orange-500" />
              Bip sonore à la fin des minuteurs
            </label>
          </div>
        </section>

        {/* Informations */}
        <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-1.5">
          <p className="flex gap-2"><Info className="w-4 h-4 flex-shrink-0 text-slate-500" />
            <span>
              Ces parcours sont génériques. Les programmes personnalisés créés par un coach restent dans {BRAND.proSpace} → Programmes :
              ils sont distincts de Quest et ne sont pas synchronisés avec ces parcours.
            </span>
          </p>
          <p className="pl-6">Mode démonstration : connexion simulée, carnet et préférences stockés uniquement dans ce navigateur.</p>
          <p className="pl-6">Univers imaginé par {BRAND.coachHandle} ({BRAND.stageName}, nom de scène).</p>
        </section>
      </div>
    </AppShell>
  );
}
