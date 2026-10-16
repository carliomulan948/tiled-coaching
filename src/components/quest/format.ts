import { getSession, getTrack } from '@/lib/quest/programs';
import { QuestSessionLog } from '@/lib/quest/types';

export const FEELING_LABELS: Record<number, string> = {
  1: 'Très facile',
  2: 'Facile',
  3: 'Correct',
  4: 'Difficile',
  5: 'Très difficile',
};

// Les dates du carnet sont des dates locales (AAAA-MM-JJ) : on les lit à midi pour éviter tout décalage.
export function formatDay(date: string, long = false): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', long
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function describeLog(log: Pick<QuestSessionLog, 'sessionId' | 'trackId'>) {
  const session = getSession(log.sessionId);
  const track = getTrack(log.trackId);
  return {
    title: session?.title ?? log.sessionId,
    trackName: track?.name ?? log.trackId,
    week: session?.week,
    label: session ? `${track?.name ?? ''} · Semaine ${session.week}` : track?.name ?? '',
  };
}
