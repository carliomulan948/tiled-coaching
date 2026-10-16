import { beforeEach, describe, expect, it } from 'vitest';
import {
  getLevel, getNewBadges, getNextSession, getQuestSummary, getTrackProgress, getUnlockedBadgeIds,
  getWeekRange, getWeeklyMissions, logXp, totalXp,
} from '../progress';
import { getLogsForProfile, saveSessionLog, setQuestStore } from '../storage';
import { makeInput, memoryStore } from './helpers';

const P = 'client-1';

beforeEach(() => {
  setQuestStore(memoryStore());
});

function save(sessionId: string, opts: Parameters<typeof makeInput>[2] = {}) {
  const result = saveSessionLog(makeInput(P, sessionId, opts), 'add');
  if (!result.ok) throw new Error('enregistrement refusé');
  return result.log;
}

describe('progression dans un parcours', () => {
  it('une séance complète prime sur une tentative partielle, quel que soit l’ordre', () => {
    save('maison-s1-a', { id: 'a', date: '2026-10-12' });
    save('maison-s1-a', { id: 'b', date: '2026-10-13', doneSets: 2 });
    save('maison-s1-b', { id: 'c', doneSets: 1 });
    const progress = getTrackProgress(getLogsForProfile(P), 'maison');
    expect(progress.statuses['maison-s1-a']).toBe('complete');
    expect(progress.statuses['maison-s1-b']).toBe('partial');
    expect(progress).toMatchObject({ completed: 1, partial: 1, total: 12 });
  });

  it('la prochaine séance est la première non terminée', () => {
    expect(getNextSession([], 'halteres')?.id).toBe('halteres-s1-a');
    save('halteres-s1-a');
    save('halteres-s1-b', { doneSets: 3 });
    expect(getNextSession(getLogsForProfile(P), 'halteres')?.id).toBe('halteres-s1-b');
  });

  it('les séances d’un autre parcours ne comptent pas', () => {
    save('salle-s1-a');
    expect(getTrackProgress(getLogsForProfile(P), 'maison').completed).toBe(0);
  });
});

describe('XP et niveaux', () => {
  it('compte 10 XP par série et un bonus pour une séance complète', () => {
    const complete = save('maison-s1-a', { id: 'x' });
    const partial = save('maison-s1-b', { id: 'y', doneSets: 3 });
    expect(logXp(complete)).toBe(10 * 10 + 50);
    expect(logXp(partial)).toBe(30);
    expect(totalXp([complete, partial])).toBe(180);
  });

  it('calcule le niveau et la progression vers le suivant', () => {
    expect(getLevel(0)).toMatchObject({ level: 1, title: 'Recrue', progress: 0 });
    expect(getLevel(150).progress).toBeCloseTo(0.5);
    expect(getLevel(300)).toMatchObject({ level: 2, title: 'Vigie' });
    expect(getLevel(99999)).toMatchObject({ level: 5, progress: 1, nextMin: undefined });
  });
});

describe('écussons', () => {
  it('débloque « Premier pas » dès une séance partielle', () => {
    save('maison-s1-a', { doneSets: 1 });
    expect(getUnlockedBadgeIds(getLogsForProfile(P))).toContain('premier-pas');
  });

  it('débloque « Retour gagnant » quand une séance partielle est terminée plus tard', () => {
    saveSessionLog(makeInput(P, 'maison-s1-a', { id: 'r', doneSets: 2 }));
    const before = getLogsForProfile(P);
    saveSessionLog(makeInput(P, 'maison-s1-a', { id: 'r' }));
    const after = getLogsForProfile(P);
    expect(getNewBadges(before, after).map(b => b.id)).toContain('retour-gagnant');
  });

  it('débloque « Semaine bouclée » et « Touche-à-tout »', () => {
    save('maison-s1-a');
    save('maison-s1-b');
    expect(getUnlockedBadgeIds(getLogsForProfile(P))).not.toContain('semaine-bouclee');
    save('maison-s1-c');
    save('salle-s1-a', { doneSets: 1 });
    const ids = getUnlockedBadgeIds(getLogsForProfile(P));
    expect(ids).toContain('semaine-bouclee');
    expect(ids).toContain('fidele');
    expect(ids).toContain('touche-a-tout');
    expect(ids).not.toContain('sommet');
  });
});

describe('semaine en cours, missions et résumé', () => {
  it('la semaine va du lundi au dimanche', () => {
    expect(getWeekRange(new Date(2026, 9, 14))).toEqual({ start: '2026-10-12', end: '2026-10-18' });
    expect(getWeekRange(new Date(2026, 9, 18))).toEqual({ start: '2026-10-12', end: '2026-10-18' });
    expect(getWeekRange(new Date(2026, 9, 19))).toEqual({ start: '2026-10-19', end: '2026-10-25' });
  });

  it('résume uniquement les séances du profil et distingue la semaine en cours', () => {
    save('maison-s1-a', { date: '2026-10-05' });
    save('maison-s1-b', { date: '2026-10-13', doneSets: 4, feeling: 3 });
    save('maison-s1-c', { date: '2026-10-14' });
    const summary = getQuestSummary(getLogsForProfile(P), new Date(2026, 9, 15));
    expect(summary).toMatchObject({ total: 3, complete: 2, partial: 1, thisWeek: 2, thisWeekPartial: 1 });
    expect(summary.lastLog?.sessionId).toBe('maison-s1-c');
    expect(summary.xp).toBe(totalXp(getLogsForProfile(P)));
  });

  it('les missions de la semaine suivent le carnet', () => {
    save('maison-s1-b', { date: '2026-10-13', doneSets: 4, feeling: 3 });
    const missions = getWeeklyMissions(getLogsForProfile(P), new Date(2026, 9, 15));
    expect(missions.map(m => [m.id, m.progress, m.done])).toEqual([
      ['deux-seances', 1, false],
      ['une-complete', 0, false],
      ['ressenti', 1, true],
    ]);
  });
});
