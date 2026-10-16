import { DEFAULT_HUMOR } from './humor';
import { getSession } from './programs';
import {
  QuestDraft, QuestExerciseLog, QuestLogSource, QuestPreferences, QuestSession, QuestSessionLog,
} from './types';

// Données Quest stockées localement (localStorage), séparées par profil (identifiant utilisateur).
// Aucune synchronisation serveur : chaque appareil garde son propre carnet.

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const QUEST_STORAGE_KEYS = {
  LOGS: 'squatty_quest_logs_v1',
  PREFS: 'squatty_quest_prefs_v1',
  DRAFTS: 'squatty_quest_drafts_v1',
} as const;

export const QUEST_CHANGE_EVENT = 'squatty-quest-change';

let injectedStore: KeyValueStore | null = null;

// Permet aux tests d'utiliser un stockage en mémoire.
export function setQuestStore(store: KeyValueStore | null): void {
  injectedStore = store;
}

function store(): KeyValueStore | null {
  if (injectedStore) return injectedStore;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string, fallback: T): T {
  const s = store();
  if (!s) return fallback;
  try {
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Squatty Quest : enregistrement local impossible');
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(QUEST_CHANGE_EVENT));
  }
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

export function newRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createExerciseLogs(session: QuestSession): QuestExerciseLog[] {
  return session.exercises.map(plan => ({
    exerciseId: plan.exerciseId,
    target: plan.target,
    perSide: plan.perSide,
    sets: Array.from({ length: plan.sets }, () => ({
      done: false,
      ...(plan.target.kind === 'reps' ? { reps: plan.target.value } : { seconds: plan.target.seconds }),
    })),
  }));
}

export function countSets(exercises: QuestExerciseLog[]): { done: number; planned: number } {
  return exercises.reduce(
    (acc, ex) => ({
      done: acc.done + ex.sets.filter(s => s.done).length,
      planned: acc.planned + ex.sets.length,
    }),
    { done: 0, planned: 0 },
  );
}

// Aligne les exercices saisis sur le plan de la séance (même ordre, même nombre de séries).
function normalizeExercises(session: QuestSession, input: QuestExerciseLog[]): QuestExerciseLog[] | null {
  if (input.length !== session.exercises.length) return null;
  const result: QuestExerciseLog[] = [];
  for (let i = 0; i < session.exercises.length; i++) {
    const plan = session.exercises[i];
    const ex = input[i];
    if (!ex || ex.exerciseId !== plan.exerciseId) return null;
    const sets = Array.from({ length: plan.sets }, (_, k) => {
      const set = ex.sets[k];
      return set ? { ...set, done: Boolean(set.done) } : { done: false };
    });
    result.push({ exerciseId: plan.exerciseId, target: plan.target, perSide: plan.perSide, sets, pain: ex.pain || undefined });
  }
  return result;
}

// ─── Carnet ──────────────────────────────────────────────────────────────────

function getAllLogs(): QuestSessionLog[] {
  return read<QuestSessionLog[]>(QUEST_STORAGE_KEYS.LOGS, []);
}

function sortLogs(logs: QuestSessionLog[]): QuestSessionLog[] {
  return [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
}

export function getLogsForProfile(profileId: string): QuestSessionLog[] {
  return sortLogs(getAllLogs().filter(l => l.profileId === profileId));
}

export function getLog(profileId: string, id: string): QuestSessionLog | undefined {
  return getAllLogs().find(l => l.profileId === profileId && l.id === id);
}

export function deleteLog(profileId: string, id: string): boolean {
  const logs = getAllLogs();
  const next = logs.filter(l => !(l.profileId === profileId && l.id === id));
  if (next.length === logs.length) return false;
  write(QUEST_STORAGE_KEYS.LOGS, next);
  return true;
}

export interface LogInput {
  id: string;
  profileId: string;
  source: QuestLogSource;
  sessionId: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  exercises: QuestExerciseLog[];
  feeling?: number;
  painReported?: boolean;
  notes?: string;
  resumedFromPartial?: boolean;
}

// ask : signale un conflit si la même séance est déjà notée ce jour-là.
// replace : remplace l'entrée du jour. add : garde les deux entrées.
export type SameDayMode = 'ask' | 'replace' | 'add';

export type SaveResult =
  | { ok: true; action: 'created' | 'updated' | 'replaced'; log: QuestSessionLog; previous?: QuestSessionLog }
  | { ok: false; reason: 'conflict'; existing: QuestSessionLog }
  | { ok: false; reason: 'empty' | 'unknown_session' | 'invalid' };

export function saveSessionLog(input: LogInput, mode: SameDayMode = 'ask', now: Date = new Date()): SaveResult {
  const session = getSession(input.sessionId);
  if (!session) return { ok: false, reason: 'unknown_session' };
  if (!input.profileId || !input.id || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, reason: 'invalid' };

  const exercises = normalizeExercises(session, input.exercises);
  if (!exercises) return { ok: false, reason: 'invalid' };

  const { done, planned } = countSets(exercises);
  if (done === 0) return { ok: false, reason: 'empty' };

  const status = done >= planned ? 'complete' : 'partial';
  const nowIso = now.toISOString();
  const logs = getAllLogs();
  const previous = logs.find(l => l.id === input.id);
  if (previous && previous.profileId !== input.profileId) return { ok: false, reason: 'invalid' };

  const feeling = input.feeling && input.feeling >= 1 && input.feeling <= 5 ? Math.round(input.feeling) : undefined;
  const base: QuestSessionLog = {
    id: input.id,
    profileId: input.profileId,
    source: input.source,
    trackId: session.trackId,
    sessionId: session.id,
    week: session.week,
    date: input.date,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationSeconds: input.durationSeconds,
    status,
    setsDone: done,
    setsPlanned: planned,
    exercises,
    feeling,
    painReported: Boolean(input.painReported || exercises.some(e => e.pain)) || undefined,
    notes: input.notes?.trim() || undefined,
    resumedFromPartial: (input.resumedFromPartial && status === 'complete') || undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Même tentative enregistrée à nouveau (double clic, reprise d'une séance partielle) : mise à jour.
  if (previous) {
    const log: QuestSessionLog = {
      ...base,
      createdAt: previous.createdAt,
      resumedFromPartial:
        previous.resumedFromPartial || base.resumedFromPartial || (previous.status === 'partial' && status === 'complete') || undefined,
    };
    write(QUEST_STORAGE_KEYS.LOGS, logs.map(l => (l.id === log.id ? log : l)));
    return { ok: true, action: 'updated', log, previous };
  }

  const sameDay = logs.find(l =>
    l.profileId === input.profileId && l.sessionId === session.id && l.date === input.date,
  );
  if (sameDay && mode === 'ask') return { ok: false, reason: 'conflict', existing: sameDay };

  if (sameDay && mode === 'replace') {
    write(QUEST_STORAGE_KEYS.LOGS, [...logs.filter(l => l.id !== sameDay.id), base]);
    return { ok: true, action: 'replaced', log: base, previous: sameDay };
  }

  write(QUEST_STORAGE_KEYS.LOGS, [...logs, base]);
  return { ok: true, action: 'created', log: base };
}

// ─── Préférences ─────────────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES: QuestPreferences = {
  humor: DEFAULT_HUMOR,
  sound: false,
  vibration: true,
};

export function getPreferences(profileId: string): QuestPreferences {
  const all = read<Record<string, Partial<QuestPreferences>>>(QUEST_STORAGE_KEYS.PREFS, {});
  return { ...DEFAULT_PREFERENCES, ...(all[profileId] ?? {}) };
}

export function savePreferences(profileId: string, patch: Partial<QuestPreferences>): QuestPreferences {
  const all = read<Record<string, Partial<QuestPreferences>>>(QUEST_STORAGE_KEYS.PREFS, {});
  const next = { ...DEFAULT_PREFERENCES, ...(all[profileId] ?? {}), ...patch };
  write(QUEST_STORAGE_KEYS.PREFS, { ...all, [profileId]: next });
  return next;
}

// ─── Séance en cours (brouillon) ─────────────────────────────────────────────

export function getDraft(profileId: string): QuestDraft | null {
  const all = read<Record<string, QuestDraft>>(QUEST_STORAGE_KEYS.DRAFTS, {});
  const draft = all[profileId];
  return draft && draft.profileId === profileId ? draft : null;
}

export function saveDraft(draft: QuestDraft): void {
  const all = read<Record<string, QuestDraft>>(QUEST_STORAGE_KEYS.DRAFTS, {});
  write(QUEST_STORAGE_KEYS.DRAFTS, { ...all, [draft.profileId]: draft });
}

export function clearDraft(profileId: string, runId?: string): void {
  const all = read<Record<string, QuestDraft>>(QUEST_STORAGE_KEYS.DRAFTS, {});
  const current = all[profileId];
  if (!current || (runId && current.runId !== runId)) return;
  const { [profileId]: _removed, ...rest } = all;
  write(QUEST_STORAGE_KEYS.DRAFTS, rest);
}
