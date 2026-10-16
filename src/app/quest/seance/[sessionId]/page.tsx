'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, BookOpen, Check, ChevronRight, Clock, Flag, LayoutDashboard, Minus, NotebookPen,
  Play, Plus, RotateCcw, SkipForward, Timer, Trophy, X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import CountdownRing from '@/components/quest/CountdownRing';
import ConflictDialog from '@/components/quest/ConflictDialog';
import ExerciseSheet, { getLibraryExercise } from '@/components/quest/ExerciseSheet';
import { BadgeShield, QuestMessage, StatusPill, XpBar } from '@/components/quest/QuestBits';
import { signalTimerEnd, unlockAudio } from '@/components/quest/feedback';
import { FEELING_LABELS, formatDay } from '@/components/quest/format';
import { useCountdown } from '@/components/quest/useCountdown';
import { useQuestProfile } from '@/components/quest/useQuestProfile';
import { getHumorMessage, HumorMoment, SAFETY_MESSAGES } from '@/lib/quest/humor';
import { BadgeDefinition, getNewBadges, logXp, totalXp } from '@/lib/quest/progress';
import { formatTarget, getSession, getTrack, plannedSetCount } from '@/lib/quest/programs';
import { questRoutes } from '@/lib/quest/routes';
import {
  clearDraft, countSets, createExerciseLogs, getDraft, getLog, getLogsForProfile, localDateKey, newRunId, saveDraft,
  SameDayMode, saveSessionLog,
} from '@/lib/quest/storage';
import { formatClock } from '@/lib/quest/timer';
import { QuestDraft, QuestExerciseLog, QuestExercisePlan, QuestSessionLog, QuestSetLog } from '@/lib/quest/types';

type Phase = 'intro' | 'exercise' | 'rest' | 'finish' | 'done';

interface Position { exerciseIndex: number; setIndex: number }

interface Run extends Position {
  runId: string;
  startedAt: string;
  exercises: QuestExerciseLog[];
  resumedFromPartial: boolean;
  baseDurationSeconds: number;
  logDate: string;          // jour de la séance dans le carnet, conservé lors d'une reprise
}

interface DoneInfo {
  log: QuestSessionLog;
  xpGained: number;
  totalXp: number;
  newBadges: BadgeDefinition[];
}

const cloneExercises = (exercises: QuestExerciseLog[]) => exercises.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) }));

// Première série non faite strictement après la position donnée (ou depuis le début si `from` est absent).
function nextUndone(exercises: QuestExerciseLog[], from?: Position): Position | null {
  for (let e = from ? from.exerciseIndex : 0; e < exercises.length; e++) {
    const startSet = from && e === from.exerciseIndex ? from.setIndex + 1 : 0;
    for (let s = startSet; s < exercises[e].sets.length; s++) {
      if (!exercises[e].sets[s].done) return { exerciseIndex: e, setIndex: s };
    }
  }
  return null;
}

// Exercices chronométrés « par côté » : un seul chrono, avec 5 s pour changer de côté.
const SIDE_SWITCH_SECONDS = 5;

function workDuration(plan: QuestExercisePlan): number {
  if (plan.target.kind !== 'time') return 0;
  return plan.perSide ? plan.target.seconds * 2 + SIDE_SWITCH_SECONDS : plan.target.seconds;
}

function workLabel(plan: QuestExercisePlan, remaining: number): string {
  if (plan.target.kind !== 'time' || !plan.perSide) return 'Effort';
  if (remaining > plan.target.seconds + SIDE_SWITCH_SECONDS) return 'Premier côté';
  if (remaining > plan.target.seconds) return 'Change de côté';
  return 'Second côté';
}

function firstUndoneIn(exercises: QuestExerciseLog[], exerciseIndex: number): Position {
  const sets = exercises[exerciseIndex].sets;
  const s = sets.findIndex(set => !set.done);
  return { exerciseIndex, setIndex: s === -1 ? sets.length - 1 : s };
}

export default function QuestSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const session = getSession(params.sessionId);
  const track = session ? getTrack(session.trackId) : undefined;
  const { profile, prefs } = useQuestProfile();

  const [phase, setPhase] = useState<Phase>('intro');
  const [run, setRun] = useState<Run | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<QuestDraft | null>(null);
  const [otherDraft, setOtherDraft] = useState<QuestDraft | null>(null);
  const [resumeLog, setResumeLog] = useState<QuestSessionLog | null>(null);
  const [message, setMessage] = useState('');
  const seedRef = useRef(0);
  const [restTarget, setRestTarget] = useState<(Position & { changesExercise: boolean }) | null>(null);
  const [repsInput, setRepsInput] = useState(0);
  const [weightInput, setWeightInput] = useState('');
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [painOpen, setPainOpen] = useState(false);
  const [feeling, setFeeling] = useState<number | undefined>(undefined);
  const [painReported, setPainReported] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [conflict, setConflict] = useState<QuestSessionLog | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [tick, setTick] = useState(() => Date.now());

  const say = useCallback((moment: HumorMoment) => {
    seedRef.current += 1;
    setMessage(getHumorMessage(moment, prefs.humor, seedRef.current));
  }, [prefs.humor]);

  // ─── Initialisation : reprise d'une séance du carnet ou d'une séance en cours ───
  useEffect(() => {
    if (!profile || !session || initialized) return;
    seedRef.current = Math.floor(Math.random() * 100);
    const resumeId = new URLSearchParams(window.location.search).get('reprendre');
    const draft = getDraft(profile.id);
    if (draft && draft.sessionId === session.id) {
      setPendingDraft(draft);
    } else {
      if (draft) setOtherDraft(draft);
      const log = resumeId ? getLog(profile.id, resumeId) : undefined;
      if (log && log.sessionId === session.id) {
        setResumeLog(log);
        setFeeling(log.feeling);
        setNotes(log.notes ?? '');
        setPainReported(Boolean(log.painReported));
      }
    }
    setMessage(getHumorMessage('session_start', prefs.humor, seedRef.current));
    setInitialized(true);
  }, [profile, session, initialized, prefs.humor]);

  // ─── Sauvegarde continue de la séance en cours ───
  useEffect(() => {
    if (!profile || !session || !run || phase === 'intro' || phase === 'done') return;
    saveDraft({
      runId: run.runId,
      profileId: profile.id,
      sessionId: session.id,
      startedAt: run.startedAt,
      exerciseIndex: run.exerciseIndex,
      setIndex: run.setIndex,
      exercises: run.exercises,
      resumedFromPartial: run.resumedFromPartial,
      baseDurationSeconds: run.baseDurationSeconds,
      logDate: run.logDate,
      feeling,
      notes,
      updatedAt: new Date().toISOString(),
    });
  }, [profile, session, run, phase, feeling, notes]);

  // Chronomètre de séance
  useEffect(() => {
    if (phase !== 'exercise' && phase !== 'rest' && phase !== 'finish') return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Préremplit la saisie à chaque changement de série
  useEffect(() => {
    if (!run || !session) return;
    const ex = run.exercises[run.exerciseIndex];
    const set = ex?.sets[run.setIndex];
    if (!ex || !set) return;
    setRepsInput(set.reps ?? (ex.target.kind === 'reps' ? ex.target.value : 0));
    const previousWeight = set.weightKg ?? ex.sets.slice(0, run.setIndex).reverse().find(s => s.weightKg)?.weightKg;
    setWeightInput(previousWeight ? String(previousWeight) : '');
  }, [run?.exerciseIndex, run?.setIndex, run?.runId]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToRestTarget = useCallback(() => {
    if (!restTarget) return;
    setRun(r => (r ? { ...r, exerciseIndex: restTarget.exerciseIndex, setIndex: restTarget.setIndex } : r));
    say(restTarget.changesExercise ? 'next_exercise' : 'rest_end');
    setRestTarget(null);
    setPhase('exercise');
  }, [restTarget, say]);

  const rest = useCountdown(() => {
    signalTimerEnd(prefs);
    goToRestTarget();
  });

  const completeSetRef = useRef<(values: Partial<QuestSetLog>) => void>(() => {});
  const work = useCountdown(() => {
    signalTimerEnd(prefs);
    const ex = run?.exercises[run.exerciseIndex];
    completeSetRef.current(ex?.target.kind === 'time' ? { seconds: ex.target.seconds } : {});
  });

  if (!profile) return null;

  if (!session || !track) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-3">
          <p className="text-slate-300">Cette séance n’existe pas.</p>
          <Link href={questRoutes.home} className="text-orange-300">← Retour à l’aventure</Link>
        </div>
      </AppShell>
    );
  }

  const totals = run ? countSets(run.exercises) : { done: 0, planned: plannedSetCount(session) };
  const elapsedSeconds = run ? run.baseDurationSeconds + Math.max(0, Math.round((tick - new Date(run.startedAt).getTime()) / 1000)) : 0;
  const showWeight = session.trackId !== 'maison';

  // ─── Démarrage ───
  const begin = (next: Run) => {
    unlockAudio();
    const position = nextUndone(next.exercises) ?? { exerciseIndex: 0, setIndex: 0 };
    setRun({ ...next, ...position });
    setPendingDraft(null);
    setOtherDraft(null);
    setPhase(nextUndone(next.exercises) ? 'exercise' : 'finish');
  };

  const startFresh = () => {
    setResumeLog(null);
    setFeeling(undefined);
    setNotes('');
    setPainReported(false);
    begin({
      runId: newRunId(),
      startedAt: new Date().toISOString(),
      exerciseIndex: 0,
      setIndex: 0,
      exercises: createExerciseLogs(session),
      resumedFromPartial: false,
      baseDurationSeconds: 0,
      logDate: localDateKey(new Date()),
    });
  };

  const resumeFromDraft = (draft: QuestDraft) => {
    const elapsedBefore = Math.max(0, Math.round((new Date(draft.updatedAt).getTime() - new Date(draft.startedAt).getTime()) / 1000));
    setFeeling(draft.feeling);
    setNotes(draft.notes ?? '');
    setPainReported(draft.exercises.some(e => e.pain));
    begin({
      runId: draft.runId,
      startedAt: new Date().toISOString(),
      exerciseIndex: draft.exerciseIndex,
      setIndex: draft.setIndex,
      exercises: cloneExercises(draft.exercises),
      resumedFromPartial: Boolean(draft.resumedFromPartial),
      baseDurationSeconds: (draft.baseDurationSeconds ?? 0) + elapsedBefore,
      logDate: draft.logDate ?? localDateKey(new Date(draft.startedAt)),
    });
  };

  const resumeFromLog = (log: QuestSessionLog) => {
    begin({
      runId: log.id,
      startedAt: new Date().toISOString(),
      exerciseIndex: 0,
      setIndex: 0,
      exercises: cloneExercises(log.exercises),
      resumedFromPartial: log.status === 'partial',
      baseDurationSeconds: log.durationSeconds ?? 0,
      logDate: log.date,
    });
  };

  // ─── Déroulé des séries ───
  const completeSet = (values: Partial<QuestSetLog>) => {
    if (!run || phase !== 'exercise') return;
    work.stop();
    const exercises = run.exercises.map((ex, i) => i !== run.exerciseIndex ? ex : {
      ...ex,
      sets: ex.sets.map((s, k) => (k !== run.setIndex ? s : { ...s, ...values, done: true })),
    });
    const next = nextUndone(exercises, run);
    setRun({ ...run, exercises });
    say('set_done');
    if (!next) {
      setPhase('finish');
      return;
    }
    setRestTarget({ ...next, changesExercise: next.exerciseIndex !== run.exerciseIndex });
    rest.begin(session.exercises[run.exerciseIndex].restSeconds);
    setPhase('rest');
  };
  completeSetRef.current = completeSet;

  const validateSet = () => {
    if (!run) return;
    const ex = run.exercises[run.exerciseIndex];
    const weight = parseFloat(weightInput.replace(',', '.'));
    const weightKg = showWeight && weight > 0 ? Math.round(weight * 10) / 10 : undefined;
    if (ex.target.kind === 'reps') {
      completeSet({ reps: Math.max(0, repsInput), weightKg });
    } else {
      const elapsed = Math.round(work.total - work.remaining);
      const perSideElapsed = ex.perSide ? Math.round((elapsed - SIDE_SWITCH_SECONDS) / 2) : elapsed;
      const seconds = work.active ? Math.min(ex.target.seconds, perSideElapsed) : ex.target.seconds;
      completeSet({ seconds: Math.max(1, seconds), weightKg });
    }
  };

  const moveTo = (position: Position | null, moment: HumorMoment) => {
    work.stop();
    if (!position) {
      setPhase('finish');
      return;
    }
    setRun(r => (r ? { ...r, ...position } : r));
    say(moment);
  };

  const skipSet = () => run && moveTo(nextUndone(run.exercises, run), 'rest_end');
  const nextExercise = () => run && moveTo(nextUndone(run.exercises, { exerciseIndex: run.exerciseIndex, setIndex: Number.MAX_SAFE_INTEGER }), 'next_exercise');
  const jumpTo = (exerciseIndex: number) => {
    if (!run) return;
    work.stop();
    setRun({ ...run, ...firstUndoneIn(run.exercises, exerciseIndex) });
    setPhase('exercise');
  };

  const skipRest = () => {
    rest.stop();
    goToRestTarget();
  };

  const markPain = () => {
    if (!run) return run;
    const exercises = run.exercises.map((ex, i) => (i === run.exerciseIndex ? { ...ex, pain: true } : ex));
    const updated = { ...run, exercises };
    setRun(updated);
    setPainReported(true);
    return updated;
  };

  const painNextExercise = () => {
    const updated = markPain();
    setPainOpen(false);
    if (!updated) return;
    work.stop();
    const next = nextUndone(updated.exercises, { exerciseIndex: updated.exerciseIndex, setIndex: Number.MAX_SAFE_INTEGER });
    if (!next) setPhase('finish');
    else setRun({ ...updated, ...next });
  };

  const painFinish = () => {
    markPain();
    setPainOpen(false);
    work.stop();
    rest.stop();
    setPhase('finish');
  };

  const finishNow = () => {
    work.stop();
    rest.stop();
    setRestTarget(null);
    setPhase('finish');
  };

  const abandon = () => {
    if (!confirm('Quitter sans enregistrer ? Les séries de cette tentative ne seront pas ajoutées au carnet.')) return;
    work.stop();
    rest.stop();
    if (run) clearDraft(profile.id, run.runId);
    router.push(questRoutes.home);
  };

  // ─── Enregistrement ───
  const save = (mode: SameDayMode) => {
    if (!run || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    const before = getLogsForProfile(profile.id);
    const end = new Date();
    const result = saveSessionLog({
      id: run.runId,
      profileId: profile.id,
      source: 'guided',
      sessionId: session.id,
      date: run.logDate,
      startedAt: run.startedAt,
      endedAt: end.toISOString(),
      durationSeconds: run.baseDurationSeconds + Math.round((end.getTime() - new Date(run.startedAt).getTime()) / 1000),
      exercises: run.exercises,
      feeling,
      painReported,
      notes,
    }, mode, end);

    if (!result.ok) {
      savingRef.current = false;
      setSaving(false);
      if (result.reason === 'conflict') setConflict(result.existing);
      else if (result.reason === 'empty') setError('Coche au moins une série pour enregistrer la séance.');
      else setError('Enregistrement impossible : cette saisie ne correspond pas à la séance.');
      return;
    }

    clearDraft(profile.id, run.runId);
    const after = getLogsForProfile(profile.id);
    setDone({
      log: result.log,
      xpGained: logXp(result.log) - (result.previous ? logXp(result.previous) : 0),
      totalXp: totalXp(after),
      newBadges: getNewBadges(before, after),
    });
    setConflict(null);
    say(result.log.status === 'complete' ? 'session_complete' : 'session_partial');
    setPhase('done');
    setSaving(false);
    // savingRef reste verrouillé : la tentative est enregistrée, un second clic n'a plus d'effet.
  };

  const currentPlan = run ? session.exercises[run.exerciseIndex] : undefined;
  const currentLog = run ? run.exercises[run.exerciseIndex] : undefined;
  const currentSet = currentLog && run ? currentLog.sets[run.setIndex] : undefined;
  const currentExercise = currentPlan ? getLibraryExercise(currentPlan.exerciseId) : undefined;
  const exerciseFinished = currentLog ? currentLog.sets.every(s => s.done) : false;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-5 pb-10">
        {/* En-tête de séance */}
        <div className="flex items-center justify-between gap-3">
          <Link href={questRoutes.track(track.id)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> {track.name}
          </Link>
          {(phase === 'exercise' || phase === 'rest' || phase === 'finish') && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 tabular-nums" aria-label="Durée de la séance">
              <Clock className="w-3.5 h-3.5" />{formatClock(elapsedSeconds)}
            </span>
          )}
        </div>

        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-300/80">{track.world} · Semaine {session.week} · Étape {session.order}</p>
          <h1 className="text-2xl font-black text-white">{session.title}</h1>
          <p className="text-sm text-slate-400">{session.focus} · environ {session.estimatedMinutes} min</p>
        </header>

        {phase !== 'intro' && phase !== 'done' && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progression</span>
              <span data-testid="sets-progress" className="tabular-nums">{totals.done}/{totals.planned} séries</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full quest-gradient transition-all" style={{ width: `${(totals.done / totals.planned) * 100}%` }} />
            </div>
          </div>
        )}

        {message && phase !== 'finish' && phase !== 'done' && <QuestMessage text={message} />}

        {/* ─── Introduction ─── */}
        {phase === 'intro' && (
          <div className="space-y-5">
            {pendingDraft && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <p className="text-sm text-amber-100">
                  Une tentative de cette séance est en cours : {countSets(pendingDraft.exercises).done}/{countSets(pendingDraft.exercises).planned} séries cochées.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => resumeFromDraft(pendingDraft)} className="btn-quest"><Play className="w-4 h-4" />Reprendre</button>
                  <button type="button" onClick={startFresh} className="btn-secondary"><RotateCcw className="w-4 h-4" />Recommencer à zéro</button>
                </div>
              </div>
            )}
            {!pendingDraft && resumeLog && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <p className="text-sm text-amber-100">
                  Reprise de la séance du {formatDay(resumeLog.date, true)} : {resumeLog.setsDone}/{resumeLog.setsPlanned} séries déjà faites.
                  Elle sera mise à jour dans le carnet, sans créer de doublon.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => resumeFromLog(resumeLog)} className="btn-quest"><Play className="w-4 h-4" />Reprendre la séance</button>
                  <button type="button" onClick={startFresh} className="btn-secondary">Nouvelle tentative</button>
                </div>
              </div>
            )}
            {otherDraft && (
              <p className="text-xs text-amber-200/90 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                Une autre séance est en cours ({getSession(otherDraft.sessionId)?.title}). Démarrer celle-ci la remplacera.{' '}
                <Link href={questRoutes.session(otherDraft.sessionId)} className="underline">Y retourner</Link>
              </p>
            )}

            <section className="card-dark">
              <h2 className="font-semibold text-white mb-2">Échauffement</h2>
              <ul className="space-y-1 text-sm text-slate-300">
                {session.warmup.map(w => <li key={w} className="flex gap-2"><span className="text-orange-300">•</span>{w}</li>)}
              </ul>
            </section>

            <section className="card-dark">
              <h2 className="font-semibold text-white mb-3">Au programme</h2>
              <ol className="space-y-2">
                {session.exercises.map((plan, i) => (
                  <li key={`${plan.exerciseId}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-xs text-slate-300 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{getLibraryExercise(plan.exerciseId)?.name}</p>
                      <p className="text-xs text-slate-400">{plan.sets} × {formatTarget(plan.target, plan.perSide)} · récup {plan.restSeconds} s</p>
                      {plan.note && <p className="text-xs text-slate-500 mt-0.5">{plan.note}</p>}
                    </div>
                    <button type="button" onClick={() => setSheetId(plan.exerciseId)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label={`Fiche : ${getLibraryExercise(plan.exerciseId)?.name}`}>
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            {!pendingDraft && !resumeLog && (
              <button type="button" onClick={startFresh} className="btn-quest w-full justify-center !py-3 text-base">
                <Play className="w-5 h-5" />Commencer la séance
              </button>
            )}
          </div>
        )}

        {/* ─── Exercice en cours ─── */}
        {phase === 'exercise' && run && currentPlan && currentLog && currentSet && (
          <div className="space-y-4">
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
              <ol className="flex gap-2 w-max" aria-label="Exercices de la séance">
                {run.exercises.map((ex, i) => {
                  const doneCount = ex.sets.filter(s => s.done).length;
                  const active = i === run.exerciseIndex;
                  return (
                    <li key={`${ex.exerciseId}-${i}`}>
                      <button
                        type="button"
                        onClick={() => jumpTo(i)}
                        aria-current={active ? 'step' : undefined}
                        className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap ${
                          active ? 'border-orange-400/60 bg-orange-500/15 text-orange-100'
                            : doneCount === ex.sets.length ? 'border-emerald-500/30 text-emerald-300'
                              : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        {i + 1}. {getLibraryExercise(ex.exerciseId)?.name} · {doneCount}/{ex.sets.length}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <section className="card-dark space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Exercice {run.exerciseIndex + 1}/{run.exercises.length}</p>
                  <h2 className="text-xl font-bold text-white">{currentExercise?.name}</h2>
                  <p data-testid="set-label" className="text-sm text-orange-200 mt-0.5">
                    Série {run.setIndex + 1} sur {currentLog.sets.length} · {formatTarget(currentPlan.target, currentPlan.perSide)}
                  </p>
                  {currentPlan.note && <p className="text-xs text-slate-400 mt-1">{currentPlan.note}</p>}
                  <p className="text-xs text-slate-500 mt-1">Récupération prévue : {currentPlan.restSeconds} s</p>
                </div>
                <button type="button" onClick={() => setSheetId(currentPlan.exerciseId)} className="btn-secondary !px-3 !py-2 flex-shrink-0">
                  <BookOpen className="w-4 h-4" />Fiche
                </button>
              </div>

              {exerciseFinished ? (
                <p className="text-sm text-emerald-300">Toutes les séries de cet exercice sont faites.</p>
              ) : currentPlan.target.kind === 'reps' ? (
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Répétitions réalisées{currentPlan.perSide ? ' (par côté)' : ''}</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setRepsInput(v => Math.max(0, v - 1))} className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center" aria-label="Une répétition de moins"><Minus className="w-4 h-4" /></button>
                      <span data-testid="reps-value" className="w-12 text-center text-2xl font-black text-white tabular-nums">{repsInput}</span>
                      <button type="button" onClick={() => setRepsInput(v => Math.min(200, v + 1))} className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center" aria-label="Une répétition de plus"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {showWeight && (
                    <label className="block">
                      <span className="text-xs text-slate-400">Charge en kg (facultatif)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={weightInput}
                        onChange={e => setWeightInput(e.target.value.replace(/[^0-9.,]/g, ''))}
                        className="input-dark mt-1 !w-28"
                        placeholder="ex. 8"
                      />
                    </label>
                  )}
                </div>
              ) : work.active ? (
                <CountdownRing
                  label={workLabel(currentPlan, work.remaining)}
                  remaining={work.remaining}
                  total={work.total}
                  running={work.running}
                  onToggle={work.toggle}
                  onAdd={work.add}
                  onSkip={validateSet}
                  skipLabel="Arrêter et valider la série"
                />
              ) : (
                <button type="button" onClick={() => { unlockAudio(); work.begin(workDuration(currentPlan)); }} className="btn-secondary w-full justify-center !py-3">
                  <Timer className="w-5 h-5 text-orange-300" />Lancer le chrono · {formatTarget(currentPlan.target, currentPlan.perSide)}
                </button>
              )}

              <div className="grid gap-2">
                {!exerciseFinished && !work.active && (
                  <button type="button" onClick={validateSet} className="btn-quest w-full justify-center !py-3 text-base">
                    <Check className="w-5 h-5" />Série faite
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={skipSet} className="btn-secondary justify-center !px-3"><SkipForward className="w-4 h-4" />Passer la série</button>
                  <button type="button" onClick={nextExercise} className="btn-secondary justify-center !px-3">Exercice suivant<ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => { if (work.running) work.toggle(); setPainOpen(true); }} className="inline-flex items-center gap-1.5 text-sm text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4" />Douleur ?
              </button>
              <button type="button" onClick={finishNow} className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white">
                <Flag className="w-4 h-4" />Terminer la séance
              </button>
            </div>
          </div>
        )}

        {/* ─── Récupération ─── */}
        {phase === 'rest' && run && restTarget && (
          <section className="card-dark flex flex-col items-center text-center gap-2">
            <h2 className="text-lg font-bold text-white">Récupération</h2>
            <CountdownRing
              label="Repos"
              remaining={rest.remaining}
              total={rest.total}
              running={rest.running}
              onToggle={rest.toggle}
              onAdd={rest.add}
              onSkip={skipRest}
              skipLabel="Passer le repos"
            />
            <p className="text-sm text-slate-400 mt-2">
              À suivre : <span className="text-white">{getLibraryExercise(run.exercises[restTarget.exerciseIndex].exerciseId)?.name}</span>
              {' '}· série {restTarget.setIndex + 1}/{run.exercises[restTarget.exerciseIndex].sets.length}
            </p>
            <button type="button" onClick={finishNow} className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
              <Flag className="w-4 h-4" />Terminer la séance ici
            </button>
          </section>
        )}

        {/* ─── Bilan avant enregistrement ─── */}
        {phase === 'finish' && run && (
          <section className="space-y-4">
            <div className="card-dark space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">Bilan de la séance</h2>
                <StatusPill status={totals.done >= totals.planned ? 'complete' : totals.done > 0 ? 'partial' : 'todo'} />
              </div>
              <ul className="space-y-1.5">
                {run.exercises.map((ex, i) => (
                  <li key={`${ex.exerciseId}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300 truncate">{getLibraryExercise(ex.exerciseId)?.name}{ex.pain && <span className="text-rose-300"> · douleur</span>}</span>
                    <span className="text-slate-400 tabular-nums">{ex.sets.filter(s => s.done).length}/{ex.sets.length}</span>
                  </li>
                ))}
              </ul>
              {totals.done > 0 && totals.done < totals.planned && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-amber-100 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <span className="flex-1">Séance partielle : elle sera notée comme telle, et tu pourras la reprendre depuis le carnet.</span>
                  <button type="button" onClick={() => { const pos = nextUndone(run.exercises); if (pos) { setRun({ ...run, ...pos }); setPhase('exercise'); } }} className="btn-secondary !py-2 justify-center">
                    Revenir à la séance
                  </button>
                </div>
              )}
            </div>

            <div className="card-dark">
              <h3 className="font-semibold text-white mb-2">Retour au calme</h3>
              <ul className="space-y-1 text-sm text-slate-300">
                {session.cooldown.map(c => <li key={c} className="flex gap-2"><span className="text-orange-300">•</span>{c}</li>)}
              </ul>
            </div>

            <div className="card-dark space-y-4">
              <fieldset>
                <legend className="text-sm font-semibold text-white mb-2">Ressenti de l’effort</legend>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFeeling(feeling === n ? undefined : n)}
                      aria-pressed={feeling === n}
                      className={`rounded-xl border px-1 py-2 text-center ${feeling === n ? 'border-orange-400/60 bg-orange-500/15 text-white' : 'border-slate-700 text-slate-400'}`}
                    >
                      <span className="block text-lg font-bold">{n}</span>
                      <span className="block text-[10px] leading-tight">{FEELING_LABELS[n]}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={painReported} onChange={e => setPainReported(e.target.checked)} className="w-4 h-4 accent-rose-500" />
                J’ai ressenti une douleur pendant la séance
              </label>
              {painReported && (
                <div className="text-sm text-rose-100 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 space-y-1.5">
                  <p>{SAFETY_MESSAGES.painLogged}</p>
                  <p className="text-xs text-rose-200/80">{SAFETY_MESSAGES.emergency}</p>
                </div>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-white">Notes (facultatif)</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={500} className="input-dark mt-1.5" placeholder="Charges utilisées, sensations, adaptations…" />
              </label>

              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              {totals.done === 0 && <p className="text-sm text-slate-400">Coche au moins une série pour pouvoir enregistrer.</p>}

              <button type="button" onClick={() => save('ask')} disabled={saving || totals.done === 0} className="btn-quest w-full justify-center !py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                <NotebookPen className="w-5 h-5" />{saving ? 'Enregistrement…' : 'Enregistrer dans le carnet'}
              </button>
              <button type="button" onClick={abandon} className="w-full text-sm text-slate-400 hover:text-rose-300 py-1">
                Quitter sans enregistrer
              </button>
            </div>
          </section>
        )}

        {/* ─── Récompense ─── */}
        {phase === 'done' && done && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-slate-900 via-[#1a1030] to-[#2a0f24] p-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-full quest-gradient flex items-center justify-center shadow-xl animate-quest-pop">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mt-4">
                {done.log.status === 'complete' ? 'Séance complète !' : 'Séance partielle enregistrée'}
              </h2>
              <p className="text-sm text-slate-300 mt-1">{done.log.setsDone}/{done.log.setsPlanned} séries · {formatClock(done.log.durationSeconds ?? 0)}</p>
              <div className="mt-3"><QuestMessage text={message} /></div>
              <p className="text-3xl font-black quest-gradient-text mt-4">{done.xpGained > 0 ? `+${done.xpGained} XP` : 'XP à jour'}</p>
              <div className="mt-4 text-left"><XpBar xp={done.totalXp} /></div>
            </div>

            {done.newBadges.length > 0 && (
              <div className="card-dark">
                <h3 className="font-semibold text-white mb-1">{getHumorMessage('badge', prefs.humor, seedRef.current)}</h3>
                <ul className="mt-3 space-y-3">
                  {done.newBadges.map(b => (
                    <li key={b.id} className="flex items-center gap-3 animate-quest-pop">
                      <BadgeShield badge={b} unlocked size={44} />
                      <div>
                        <p className="text-sm font-semibold text-amber-200">{b.title}</p>
                        <p className="text-xs text-slate-400">{b.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {done.log.painReported && (
              <p className="text-sm text-rose-100 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3">{SAFETY_MESSAGES.painLogged}</p>
            )}
            {done.log.status === 'partial' && (
              <p className="text-sm text-slate-300">Tu pourras reprendre cette séance depuis le carnet : elle sera mise à jour, pas dupliquée.</p>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <Link href={questRoutes.home} className="btn-quest justify-center"><Flag className="w-4 h-4" />Retour à l’aventure</Link>
              <Link href={questRoutes.carnet} className="btn-secondary justify-center"><NotebookPen className="w-4 h-4" />Voir le carnet</Link>
              <Link href="/dashboard" className="btn-secondary justify-center"><LayoutDashboard className="w-4 h-4" />Tableau de bord</Link>
            </div>
          </section>
        )}
      </div>

      {/* Fiche d'exercice */}
      {sheetId && (
        <div className="modal-overlay !items-end sm:!items-center !p-0 sm:!p-5" role="dialog" aria-modal="true" aria-label="Fiche d’exercice" onClick={() => setSheetId(null)}>
          <div className="modal-content !rounded-b-none sm:!rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end -mt-1 -mr-1">
              <button type="button" onClick={() => setSheetId(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fermer la fiche"><X className="w-5 h-5" /></button>
            </div>
            <ExerciseSheet exerciseId={sheetId} />
            <Link href={questRoutes.exercise(sheetId)} className="mt-4 inline-block text-sm text-orange-300 hover:text-orange-200">Ouvrir la fiche complète →</Link>
          </div>
        </div>
      )}

      {/* Douleur : message neutre, sans humour */}
      {painOpen && (
        <div className="modal-overlay" role="alertdialog" aria-modal="true" aria-labelledby="pain-title">
          <div className="modal-content p-5 max-w-md space-y-3">
            <h2 id="pain-title" className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-300" />{SAFETY_MESSAGES.painTitle}</h2>
            <p className="text-sm text-slate-200">{SAFETY_MESSAGES.pain}</p>
            <p className="text-xs text-rose-200/90">{SAFETY_MESSAGES.emergency}</p>
            <div className="grid gap-2 pt-2">
              <button type="button" onClick={painNextExercise} className="btn-secondary justify-center">Noter la douleur et passer à l’exercice suivant</button>
              <button type="button" onClick={painFinish} className="btn-quest justify-center">Noter la douleur et terminer la séance</button>
              <button type="button" onClick={() => setPainOpen(false)} className="text-sm text-slate-400 hover:text-white py-1">Fausse alerte, continuer</button>
            </div>
          </div>
        </div>
      )}

      {conflict && (
        <ConflictDialog
          existing={conflict}
          busy={saving}
          onReplace={() => save('replace')}
          onAdd={() => save('add')}
          onCancel={() => setConflict(null)}
        />
      )}
    </AppShell>
  );
}
