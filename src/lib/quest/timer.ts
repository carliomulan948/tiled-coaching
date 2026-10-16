// Minuteur basé sur l'horloge réelle plutôt que sur un compteur décrémenté :
// il reste juste même si le téléphone met l'onglet en veille quelques secondes.

export interface CountdownState {
  durationMs: number;
  startedAt: number | null;   // horodatage du dernier démarrage, null si en pause
  elapsedMs: number;          // temps écoulé avant le dernier démarrage
}

export function createCountdown(durationSeconds: number): CountdownState {
  return { durationMs: Math.max(0, durationSeconds) * 1000, startedAt: null, elapsedMs: 0 };
}

export function isRunning(state: CountdownState): boolean {
  return state.startedAt !== null;
}

export function elapsedMs(state: CountdownState, now: number): number {
  const live = state.startedAt === null ? 0 : Math.max(0, now - state.startedAt);
  return state.elapsedMs + live;
}

export function remainingMs(state: CountdownState, now: number): number {
  return Math.max(0, state.durationMs - elapsedMs(state, now));
}

export function isFinished(state: CountdownState, now: number): boolean {
  return remainingMs(state, now) === 0;
}

export function start(state: CountdownState, now: number): CountdownState {
  if (state.startedAt !== null) return state;
  return { ...state, startedAt: now };
}

export function pause(state: CountdownState, now: number): CountdownState {
  if (state.startedAt === null) return state;
  return { ...state, startedAt: null, elapsedMs: elapsedMs(state, now) };
}

// Ajoute (ou retire, si négatif) du temps au minuteur sans jamais passer sous zéro.
export function addSeconds(state: CountdownState, seconds: number, now: number): CountdownState {
  const elapsed = elapsedMs(state, now);
  const durationMs = Math.max(elapsed, state.durationMs + seconds * 1000);
  return { ...state, durationMs };
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
