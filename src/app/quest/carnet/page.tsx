'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckSquare, Clock, NotebookPen, Play, Plus, Square, Trash2, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import ConflictDialog from '@/components/quest/ConflictDialog';
import { getLibraryExercise } from '@/components/quest/ExerciseSheet';
import { QuestMessage, QuestNav, StatusPill } from '@/components/quest/QuestBits';
import { describeLog, FEELING_LABELS, formatDay } from '@/components/quest/format';
import { useQuestProfile } from '@/components/quest/useQuestProfile';
import { getHumorMessage, SAFETY_MESSAGES } from '@/lib/quest/humor';
import { formatTarget, getSession, getTrack, getTrackSessions, QUEST_TRACKS } from '@/lib/quest/programs';
import { questRoutes } from '@/lib/quest/routes';
import {
  countSets, createExerciseLogs, deleteLog, localDateKey, newRunId, SameDayMode, saveSessionLog,
} from '@/lib/quest/storage';
import { formatClock } from '@/lib/quest/timer';
import { QuestExerciseLog, QuestSessionLog, QuestTrackId } from '@/lib/quest/types';

type Filter = 'all' | 'complete' | 'partial';

interface EntryForm {
  runId: string;
  trackId: QuestTrackId;
  sessionId: string;
  date: string;
  exercises: QuestExerciseLog[];
  feeling?: number;
  painReported: boolean;
  notes: string;
}

function emptyForm(trackId: QuestTrackId): EntryForm {
  const session = getTrackSessions(trackId)[0];
  return {
    runId: newRunId(),
    trackId,
    sessionId: session.id,
    date: localDateKey(new Date()),
    exercises: createExerciseLogs(session),
    painReported: false,
    notes: '',
  };
}

export default function QuestCarnetPage() {
  const { profile, logs, prefs } = useQuestProfile();
  const [filter, setFilter] = useState<Filter>('all');
  const [form, setForm] = useState<EntryForm | null>(null);
  const [conflict, setConflict] = useState<QuestSessionLog | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => setToday(localDateKey(new Date())), []);

  const filtered = useMemo(() => logs.filter(l => filter === 'all' || l.status === filter), [logs, filter]);

  if (!profile) return null;

  const counts = {
    all: logs.length,
    complete: logs.filter(l => l.status === 'complete').length,
    partial: logs.filter(l => l.status === 'partial').length,
  };

  const openForm = () => {
    setForm(emptyForm(prefs.activeTrack ?? logs[0]?.trackId ?? 'maison'));
    setError('');
    setNotice('');
  };

  const changeSession = (sessionId: string) => {
    const session = getSession(sessionId);
    if (!form || !session) return;
    setForm({ ...form, sessionId, exercises: createExerciseLogs(session) });
  };

  const changeTrack = (trackId: QuestTrackId) => {
    if (!form) return;
    const fresh = emptyForm(trackId);
    setForm({ ...fresh, runId: form.runId, date: form.date, feeling: form.feeling, painReported: form.painReported, notes: form.notes });
  };

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    if (!form) return;
    setForm({
      ...form,
      exercises: form.exercises.map((ex, i) => i !== exerciseIndex ? ex : {
        ...ex,
        sets: ex.sets.map((s, k) => (k === setIndex ? { ...s, done: !s.done } : s)),
      }),
    });
  };

  const setAll = (done: boolean) => {
    if (!form) return;
    setForm({ ...form, exercises: form.exercises.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s, done })) })) });
  };

  const submit = (mode: SameDayMode) => {
    if (!form) return;
    setError('');
    if (form.date > localDateKey(new Date())) {
      setError('La date ne peut pas être dans le futur.');
      return;
    }
    const result = saveSessionLog({
      id: form.runId,
      profileId: profile.id,
      source: 'carnet',
      sessionId: form.sessionId,
      date: form.date,
      startedAt: new Date(`${form.date}T12:00:00`).toISOString(),
      exercises: form.exercises,
      feeling: form.feeling,
      painReported: form.painReported,
      notes: form.notes,
    }, mode);
    if (!result.ok) {
      if (result.reason === 'conflict') setConflict(result.existing);
      else if (result.reason === 'empty') setError('Coche au moins une série réalisée.');
      else setError('Saisie invalide : vérifie la date et la séance.');
      return;
    }
    setConflict(null);
    setForm(null);
    setNotice(getHumorMessage(result.log.status === 'complete' ? 'session_complete' : 'session_partial', prefs.humor, logs.length));
  };

  const remove = (log: QuestSessionLog) => {
    if (!confirm(`Supprimer « ${describeLog(log).title} » du ${formatDay(log.date)} ?`)) return;
    deleteLog(profile.id, log.id);
  };

  const formTotals = form ? countSets(form.exercises) : null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2"><NotebookPen className="w-6 h-6 text-orange-300" />Carnet</h1>
            <p className="text-sm text-slate-400">Profil actif : {profile.name} · historique enregistré sur cet appareil</p>
          </div>
          {!form && (
            <button type="button" onClick={openForm} className="btn-quest justify-center"><Plus className="w-4 h-4" />Noter une séance</button>
          )}
        </div>

        <QuestNav />

        {notice && <QuestMessage text={notice} />}

        {/* Saisie manuelle */}
        {form && formTotals && (
          <section className="card-dark space-y-4" aria-labelledby="carnet-form-title">
            <div className="flex items-center justify-between">
              <h2 id="carnet-form-title" className="font-semibold text-white">Noter une séance faite</h2>
              <button type="button" onClick={() => setForm(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fermer le formulaire"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs text-slate-400">Parcours</span>
                <select value={form.trackId} onChange={e => changeTrack(e.target.value as QuestTrackId)} className="input-dark mt-1">
                  {QUEST_TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-slate-400">Séance</span>
                <select value={form.sessionId} onChange={e => changeSession(e.target.value)} className="input-dark mt-1">
                  {getTrack(form.trackId)?.weeks.map(w => (
                    <optgroup key={w.week} label={`Semaine ${w.week} · ${w.theme}`}>
                      {w.sessions.map(s => <option key={s.id} value={s.id}>{s.title} ({s.focus})</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Date</span>
                <input type="date" value={form.date} max={today || undefined} onChange={e => setForm({ ...form, date: e.target.value })} className="input-dark mt-1" />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Séries réalisées <span className="text-slate-400 font-normal tabular-nums">{formTotals.done}/{formTotals.planned}</span></p>
                <div className="flex gap-3 text-xs">
                  <button type="button" onClick={() => setAll(true)} className="text-orange-300 hover:text-orange-200">Tout cocher</button>
                  <button type="button" onClick={() => setAll(false)} className="text-slate-400 hover:text-white">Tout décocher</button>
                </div>
              </div>
              <ul className="space-y-2">
                {form.exercises.map((ex, i) => (
                  <li key={`${ex.exerciseId}-${i}`} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <div className="flex-1 min-w-[10rem]">
                      <p className="text-sm text-white">{getLibraryExercise(ex.exerciseId)?.name}</p>
                      <p className="text-xs text-slate-500">{ex.sets.length} × {formatTarget(ex.target, ex.perSide)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {ex.sets.map((s, k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleSet(i, k)}
                          aria-pressed={s.done}
                          aria-label={`${getLibraryExercise(ex.exerciseId)?.name} série ${k + 1}`}
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center ${s.done ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-600 text-slate-500'}`}
                        >
                          {s.done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-2">
                {formTotals.done === 0 ? 'Aucune série cochée.' : formTotals.done < formTotals.planned ? 'Elle sera notée comme séance partielle.' : 'Elle sera notée comme séance complète.'}
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-white mb-2">Ressenti de l’effort (facultatif)</legend>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" aria-pressed={form.feeling === n} onClick={() => setForm({ ...form, feeling: form.feeling === n ? undefined : n })}
                    className={`px-3 py-1.5 rounded-lg border text-xs ${form.feeling === n ? 'border-orange-400/60 bg-orange-500/15 text-white' : 'border-slate-700 text-slate-400'}`}>
                    {n} · {FEELING_LABELS[n]}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input type="checkbox" checked={form.painReported} onChange={e => setForm({ ...form, painReported: e.target.checked })} className="w-4 h-4 accent-rose-500" />
              J’ai ressenti une douleur pendant la séance
            </label>
            {form.painReported && <p className="text-xs text-rose-100 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3">{SAFETY_MESSAGES.painLogged}</p>}

            <label className="block">
              <span className="text-sm font-semibold text-white">Notes (facultatif)</span>
              <textarea rows={2} maxLength={500} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-dark mt-1.5" />
            </label>

            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            <button type="button" onClick={() => submit('ask')} disabled={formTotals.done === 0} className="btn-quest w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <NotebookPen className="w-4 h-4" />Enregistrer dans le carnet
            </button>
          </section>
        )}

        {/* Filtres */}
        <div className="flex gap-2" role="group" aria-label="Filtrer le carnet">
          {([['all', 'Toutes'], ['complete', 'Complètes'], ['partial', 'Partielles']] as [Filter, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}
              className={`px-3 py-1.5 rounded-full text-sm border ${filter === key ? 'border-orange-400/50 bg-orange-500/10 text-orange-100' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
              {label} <span className="tabular-nums text-xs opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* Historique */}
        {filtered.length === 0 ? (
          <div className="card-dark text-center py-10">
            <NotebookPen className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-300">{logs.length === 0 ? getHumorMessage('empty_history', prefs.humor, 1) : 'Aucune séance dans ce filtre.'}</p>
            {logs.length === 0 && <Link href={questRoutes.home} className="inline-block mt-3 text-sm text-orange-300 hover:text-orange-200">Choisir un parcours →</Link>}
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Historique des séances">
            {filtered.map(log => {
              const info = describeLog(log);
              return (
                <li key={log.id} data-testid="carnet-entry" className="card-dark !p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 capitalize">{formatDay(log.date, true)}</p>
                      <p className="font-semibold text-white">{info.title}</p>
                      <p className="text-xs text-slate-500">{info.label} · {log.source === 'guided' ? 'séance guidée' : 'saisie manuelle'}</p>
                    </div>
                    <StatusPill status={log.status} />
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${log.status === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${(log.setsDone / log.setsPlanned) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="tabular-nums">{log.setsDone}/{log.setsPlanned} séries</span>
                      {log.durationSeconds ? <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatClock(log.durationSeconds)}</span> : null}
                      {log.feeling ? <span>Ressenti : {FEELING_LABELS[log.feeling]}</span> : null}
                    </p>
                  </div>
                  {log.painReported && (
                    <p className="mt-2 text-xs text-rose-200 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Douleur signalée</p>
                  )}
                  {log.notes && <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">{log.notes}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.status === 'partial' && (
                      <Link href={questRoutes.resume(log.sessionId, log.id)} className="btn-quest !py-1.5 !px-3 text-sm"><Play className="w-3.5 h-3.5" />Reprendre</Link>
                    )}
                    <Link href={questRoutes.session(log.sessionId)} className="btn-secondary !py-1.5 !px-3 text-sm">Voir la séance</Link>
                    <button type="button" onClick={() => remove(log)} className="btn-secondary !py-1.5 !px-3 text-sm hover:!text-rose-300" aria-label={`Supprimer la séance du ${formatDay(log.date)}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {conflict && (
        <ConflictDialog
          existing={conflict}
          busy={false}
          onReplace={() => submit('replace')}
          onAdd={() => submit('add')}
          onCancel={() => setConflict(null)}
        />
      )}
    </AppShell>
  );
}
