import { getSession } from '../programs';
import { createExerciseLogs, KeyValueStore, LogInput } from '../storage';

export function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: key => { data.delete(key); },
  };
}

// Construit une saisie de carnet dont les `doneSets` premières séries sont cochées.
export function makeInput(
  profileId: string,
  sessionId: string,
  opts: { id?: string; date?: string; doneSets?: number | 'all'; feeling?: number; resumedFromPartial?: boolean } = {},
): LogInput {
  const session = getSession(sessionId);
  if (!session) throw new Error(`Séance inconnue : ${sessionId}`);
  const exercises = createExerciseLogs(session);
  const total = exercises.reduce((n, e) => n + e.sets.length, 0);
  let remaining = opts.doneSets === 'all' || opts.doneSets === undefined ? total : opts.doneSets;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (remaining > 0) { set.done = true; remaining--; }
    }
  }
  const date = opts.date ?? '2026-10-14';
  return {
    id: opts.id ?? `run-${profileId}-${sessionId}-${date}`,
    profileId,
    source: 'guided',
    sessionId,
    date,
    startedAt: `${date}T08:00:00.000Z`,
    exercises,
    feeling: opts.feeling,
    resumedFromPartial: opts.resumedFromPartial,
  };
}
