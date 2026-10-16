import { getTrackSessions, QUEST_TRACKS } from './programs';
import { localDateKey } from './storage';
import { QuestPreferences, QuestSession, QuestSessionLog, QuestTrackId } from './types';

// Progression, XP, écussons et missions, calculés uniquement à partir du carnet du profil.
// Les XP récompensent la régularité dans l'application : ce n'est pas une mesure de condition physique.

export type SessionProgress = 'complete' | 'partial' | 'todo';

export function getSessionStatuses(logs: QuestSessionLog[]): Record<string, SessionProgress> {
  const statuses: Record<string, SessionProgress> = {};
  for (const log of logs) {
    if (log.status === 'complete') statuses[log.sessionId] = 'complete';
    else if (statuses[log.sessionId] !== 'complete') statuses[log.sessionId] = 'partial';
  }
  return statuses;
}

export function getTrackProgress(logs: QuestSessionLog[], trackId: QuestTrackId) {
  const statuses = getSessionStatuses(logs.filter(l => l.trackId === trackId));
  const sessions = getTrackSessions(trackId);
  const completed = sessions.filter(s => statuses[s.id] === 'complete').length;
  const partial = sessions.filter(s => statuses[s.id] === 'partial').length;
  return { completed, partial, total: sessions.length, statuses };
}

export function getNextSession(logs: QuestSessionLog[], trackId: QuestTrackId): QuestSession | undefined {
  const { statuses } = getTrackProgress(logs, trackId);
  return getTrackSessions(trackId).find(s => statuses[s.id] !== 'complete');
}

export function getPreferredTrack(logs: QuestSessionLog[], prefs: QuestPreferences): QuestTrackId | undefined {
  if (prefs.activeTrack) return prefs.activeTrack;
  return logs[0]?.trackId;
}

// ─── XP et niveaux ───────────────────────────────────────────────────────────

export const XP_RULES = { perSet: 10, completeBonus: 50 } as const;

export function logXp(log: QuestSessionLog): number {
  return log.setsDone * XP_RULES.perSet + (log.status === 'complete' ? XP_RULES.completeBonus : 0);
}

export function totalXp(logs: QuestSessionLog[]): number {
  return logs.reduce((sum, l) => sum + logXp(l), 0);
}

export const LEVELS = [
  { min: 0, title: 'Recrue' },
  { min: 300, title: 'Vigie' },
  { min: 800, title: 'Sentinelle' },
  { min: 1500, title: 'Capitaine' },
  { min: 2500, title: 'Légende du squat' },
];

export function getLevel(xp: number) {
  let index = 0;
  LEVELS.forEach((lvl, i) => { if (xp >= lvl.min) index = i; });
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { level: index + 1, title: current.title, min: current.min, nextMin: next?.min, progress: Math.min(1, Math.max(0, progress)) };
}

// ─── Écussons ────────────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  test: (logs: QuestSessionLog[]) => boolean;
}

function hasFullWeek(logs: QuestSessionLog[]): boolean {
  const statuses = getSessionStatuses(logs);
  return QUEST_TRACKS.some(track => track.weeks.some(week => week.sessions.every(s => statuses[s.id] === 'complete')));
}

function hasFullTrack(logs: QuestSessionLog[]): boolean {
  return QUEST_TRACKS.some(track => {
    const p = getTrackProgress(logs, track.id);
    return p.completed === p.total;
  });
}

export const BADGES: BadgeDefinition[] = [
  { id: 'premier-pas', title: 'Premier pas', description: 'Enregistrer une première séance, même partielle.', test: logs => logs.length > 0 },
  { id: 'fidele', title: 'Fidèle au poste', description: 'Terminer 3 séances complètes.', test: logs => logs.filter(l => l.status === 'complete').length >= 3 },
  { id: 'retour-gagnant', title: 'Retour gagnant', description: 'Reprendre une séance partielle et la terminer.', test: logs => logs.some(l => l.resumedFromPartial) },
  { id: 'semaine-bouclee', title: 'Semaine bouclée', description: 'Terminer les 3 séances d’une même semaine de parcours.', test: hasFullWeek },
  { id: 'touche-a-tout', title: 'Touche-à-tout', description: 'Essayer deux parcours différents.', test: logs => new Set(logs.map(l => l.trackId)).size >= 2 },
  { id: 'carnet-tenu', title: 'Carnet bien tenu', description: 'Noter ton ressenti sur 5 séances.', test: logs => logs.filter(l => l.feeling).length >= 5 },
  { id: 'sommet', title: 'Sommet atteint', description: 'Terminer les 12 séances d’un parcours.', test: hasFullTrack },
];

export function getUnlockedBadgeIds(logs: QuestSessionLog[]): string[] {
  return BADGES.filter(b => b.test(logs)).map(b => b.id);
}

export function getNewBadges(before: QuestSessionLog[], after: QuestSessionLog[]): BadgeDefinition[] {
  const had = new Set(getUnlockedBadgeIds(before));
  return BADGES.filter(b => !had.has(b.id) && b.test(after));
}

// ─── Semaine en cours et missions ────────────────────────────────────────────

export function getWeekRange(now: Date): { start: string; end: string } {
  const offset = (now.getDay() + 6) % 7; // lundi = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { start: localDateKey(monday), end: localDateKey(sunday) };
}

export function getLogsThisWeek(logs: QuestSessionLog[], now: Date): QuestSessionLog[] {
  const { start, end } = getWeekRange(now);
  return logs.filter(l => l.date >= start && l.date <= end);
}

export interface Mission {
  id: string;
  title: string;
  progress: number;
  goal: number;
  done: boolean;
}

export function getWeeklyMissions(logs: QuestSessionLog[], now: Date): Mission[] {
  const week = getLogsThisWeek(logs, now);
  const make = (id: string, title: string, progress: number, goal: number): Mission =>
    ({ id, title, progress: Math.min(progress, goal), goal, done: progress >= goal });
  return [
    make('deux-seances', 'Enregistrer 2 séances cette semaine', week.length, 2),
    make('une-complete', 'Terminer une séance complète', week.filter(l => l.status === 'complete').length, 1),
    make('ressenti', 'Noter ton ressenti après une séance', week.filter(l => l.feeling).length, 1),
  ];
}

// ─── Résumé pour le tableau de bord ──────────────────────────────────────────

export interface QuestSummary {
  total: number;
  complete: number;
  partial: number;
  thisWeek: number;
  thisWeekPartial: number;
  setsDone: number;
  xp: number;
  level: ReturnType<typeof getLevel>;
  badges: number;
  lastLog?: QuestSessionLog;
}

export function getQuestSummary(logs: QuestSessionLog[], now: Date): QuestSummary {
  const week = getLogsThisWeek(logs, now);
  const xp = totalXp(logs);
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  return {
    total: logs.length,
    complete: logs.filter(l => l.status === 'complete').length,
    partial: logs.filter(l => l.status === 'partial').length,
    thisWeek: week.length,
    thisWeekPartial: week.filter(l => l.status === 'partial').length,
    setsDone: logs.reduce((n, l) => n + l.setsDone, 0),
    xp,
    level: getLevel(xp),
    badges: getUnlockedBadgeIds(logs).length,
    lastLog: sorted[0],
  };
}
