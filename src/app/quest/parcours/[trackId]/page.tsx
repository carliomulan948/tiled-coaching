'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, CircleDot, Clock, Flag, Info, Play } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useQuestProfile } from '@/components/quest/useQuestProfile';
import { QuestNav, StatusPill } from '@/components/quest/QuestBits';
import { BRAND } from '@/lib/brand';
import { getNextSession, getTrackProgress } from '@/lib/quest/progress';
import { getTrack, plannedSetCount } from '@/lib/quest/programs';
import { questRoutes } from '@/lib/quest/routes';

export default function QuestTrackPage() {
  const params = useParams<{ trackId: string }>();
  const { profile, logs, prefs, updatePrefs } = useQuestProfile();
  const track = getTrack(params.trackId);

  if (!profile) return null;

  if (!track) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-slate-300">Ce parcours n’existe pas.</p>
          <Link href={questRoutes.home} className="text-orange-300">← Retour à l’aventure</Link>
        </div>
      </AppShell>
    );
  }

  const progress = getTrackProgress(logs, track.id);
  const next = getNextSession(logs, track.id);
  const isActive = prefs.activeTrack === track.id;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href={questRoutes.home} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Aventure
        </Link>

        <section className="rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-900/60">
          <div className={`h-2 bg-gradient-to-r ${track.accent}`} />
          <div className="p-5 sm:p-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{track.world}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{track.name}</h1>
            <p className="text-slate-300">{track.tagline} {track.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {track.equipment.map(eq => (
                <span key={eq} className="text-xs px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">{eq}</span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <div className="flex-1">
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${track.accent}`} style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {progress.completed}/{progress.total} séances terminées · {track.sessionsPerWeek} séances par semaine
                </p>
              </div>
              <button
                type="button"
                onClick={() => updatePrefs({ activeTrack: track.id })}
                disabled={isActive}
                className={isActive ? 'btn-secondary justify-center opacity-80' : 'btn-quest justify-center'}
              >
                {isActive ? <><Check className="w-4 h-4" />Parcours actif</> : <><Flag className="w-4 h-4" />Choisir ce parcours</>}
              </button>
            </div>
          </div>
        </section>

        <QuestNav />

        <p className="flex gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 flex-shrink-0 text-slate-500" />
          Parcours de démarrage générique. Pour un niveau plus avancé ou un objectif précis, un coach peut créer un programme personnalisé dans {BRAND.proSpace}.
        </p>

        {/* Carte des semaines */}
        <ol className="space-y-6">
          {track.weeks.map(week => (
            <li key={week.week}>
              <div className="mb-3">
                <h2 className="font-bold text-white">Semaine {week.week} · {week.theme}</h2>
                <p className="text-xs text-slate-400">{week.goal}</p>
              </div>
              <ol className="relative border-l-2 border-dashed border-slate-700 ml-4 space-y-3">
                {week.sessions.map(session => {
                  const status = progress.statuses[session.id] ?? 'todo';
                  const isNext = next?.id === session.id;
                  return (
                    <li key={session.id} className="relative pl-7">
                      <span
                        className={`absolute -left-[15px] top-4 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          status === 'complete' ? 'bg-emerald-500 border-emerald-300 text-white'
                            : status === 'partial' ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                              : isNext ? 'bg-orange-500 border-orange-300 text-white'
                                : 'bg-slate-900 border-slate-600 text-slate-400'
                        }`}
                        aria-hidden="true"
                      >
                        {status === 'complete' ? <Check className="w-3.5 h-3.5" /> : status === 'partial' ? <CircleDot className="w-3.5 h-3.5" /> : session.order}
                      </span>
                      <Link
                        href={questRoutes.session(session.id)}
                        className={`block rounded-xl border p-4 transition-colors ${isNext ? 'border-orange-400/50 bg-orange-500/5' : 'border-slate-700/70 bg-slate-900/50 hover:border-slate-500'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {isNext && <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-300">Prochaine étape</p>}
                            <p className="font-semibold text-white">{session.title}</p>
                            <p className="text-sm text-slate-400">{session.focus}</p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> environ {session.estimatedMinutes} min · {session.exercises.length} exercices · {plannedSetCount(session)} séries
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <StatusPill status={status} />
                            <Play className="w-4 h-4 text-slate-500" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  );
}
