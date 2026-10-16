import { beforeEach, describe, expect, it } from 'vitest';
import { getSession, plannedSetCount } from '../programs';
import {
  clearDraft, deleteLog, getDraft, getLog, getLogsForProfile, getPreferences, saveDraft, savePreferences,
  saveSessionLog, setQuestStore,
} from '../storage';
import { makeInput, memoryStore } from './helpers';

const LUCAS = 'client-1';
const MARIE = 'coach-1';
const SESSION = 'maison-s1-a';

beforeEach(() => {
  setQuestStore(memoryStore());
});

describe('enregistrement des séances', () => {
  it('enregistre une séance complète', () => {
    const result = saveSessionLog(makeInput(LUCAS, SESSION));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe('created');
    expect(result.log.status).toBe('complete');
    expect(result.log.setsDone).toBe(plannedSetCount(getSession(SESSION)!));
    expect(result.log.trackId).toBe('maison');
    expect(result.log.week).toBe(1);
  });

  it('enregistre une séance partielle avec le nombre de séries réalisées', () => {
    const result = saveSessionLog(makeInput(LUCAS, SESSION, { doneSets: 3 }));
    expect(result.ok && result.log.status).toBe('partial');
    expect(result.ok && result.log.setsDone).toBe(3);
    expect(result.ok && result.log.setsPlanned).toBe(10);
  });

  it('refuse une séance sans aucune série cochée', () => {
    const result = saveSessionLog(makeInput(LUCAS, SESSION, { doneSets: 0 }));
    expect(result).toEqual({ ok: false, reason: 'empty' });
    expect(getLogsForProfile(LUCAS)).toHaveLength(0);
  });

  it('refuse une séance inconnue ou des exercices qui ne correspondent pas au plan', () => {
    expect(saveSessionLog({ ...makeInput(LUCAS, SESSION), sessionId: 'inconnue' })).toEqual({ ok: false, reason: 'unknown_session' });
    const input = makeInput(LUCAS, SESSION);
    input.exercises = input.exercises.slice(1);
    expect(saveSessionLog(input)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('ignore les séries ajoutées au-delà du plan', () => {
    const input = makeInput(LUCAS, SESSION);
    input.exercises[0].sets.push({ done: true }, { done: true });
    const result = saveSessionLog(input);
    expect(result.ok && result.log.setsDone).toBe(10);
    expect(result.ok && result.log.exercises[0].sets).toHaveLength(2);
  });
});

describe('gestion des doublons', () => {
  it('un double enregistrement de la même tentative ne crée qu’une entrée', () => {
    const input = makeInput(LUCAS, SESSION);
    const first = saveSessionLog(input);
    const second = saveSessionLog(input);
    expect(first.ok && first.action).toBe('created');
    expect(second.ok && second.action).toBe('updated');
    expect(getLogsForProfile(LUCAS)).toHaveLength(1);
  });

  it('conserve la date de création lors d’une mise à jour', () => {
    const input = makeInput(LUCAS, SESSION, { doneSets: 2 });
    saveSessionLog(input, 'ask', new Date('2026-10-14T08:00:00Z'));
    const updated = saveSessionLog({ ...input, notes: 'ajout' }, 'ask', new Date('2026-10-14T09:00:00Z'));
    expect(updated.ok && updated.log.createdAt).toBe('2026-10-14T08:00:00.000Z');
    expect(updated.ok && updated.log.updatedAt).toBe('2026-10-14T09:00:00.000Z');
  });

  it('signale un conflit quand la même séance est déjà notée le même jour', () => {
    saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-1' }));
    const result = saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-2', doneSets: 4 }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('conflict');
    expect(getLogsForProfile(LUCAS)).toHaveLength(1);
  });

  it('remplace l’entrée du jour sur demande', () => {
    saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-1' }));
    const result = saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-2', doneSets: 4 }), 'replace');
    expect(result.ok && result.action).toBe('replaced');
    const logs = getLogsForProfile(LUCAS);
    expect(logs.map(l => l.id)).toEqual(['run-2']);
    expect(logs[0].status).toBe('partial');
  });

  it('garde les deux entrées sur demande explicite', () => {
    saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-1' }));
    const result = saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-2' }), 'add');
    expect(result.ok && result.action).toBe('created');
    expect(getLogsForProfile(LUCAS)).toHaveLength(2);
  });

  it('la même séance un autre jour n’est pas un doublon', () => {
    saveSessionLog(makeInput(LUCAS, SESSION, { date: '2026-10-12' }));
    const result = saveSessionLog(makeInput(LUCAS, SESSION, { date: '2026-10-14' }));
    expect(result.ok && result.action).toBe('created');
  });
});

describe('séances partielles', () => {
  it('reprendre une séance partielle met à jour la même entrée et la marque comme terminée', () => {
    const partial = makeInput(LUCAS, SESSION, { id: 'run-p', doneSets: 4 });
    saveSessionLog(partial);
    const resumed = saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-p', doneSets: 'all' }));
    expect(resumed.ok && resumed.action).toBe('updated');
    expect(resumed.ok && resumed.log.status).toBe('complete');
    expect(resumed.ok && resumed.log.resumedFromPartial).toBe(true);
    expect(getLogsForProfile(LUCAS)).toHaveLength(1);
  });

  it('une séance partielle complétée en partie reste partielle', () => {
    saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-p', doneSets: 2 }));
    const more = saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-p', doneSets: 6 }));
    expect(more.ok && more.log.status).toBe('partial');
    expect(more.ok && more.log.setsDone).toBe(6);
    expect(more.ok && more.log.resumedFromPartial).toBeUndefined();
  });
});

describe('séparation des profils', () => {
  it('chaque profil ne voit que son historique', () => {
    saveSessionLog(makeInput(LUCAS, SESSION));
    saveSessionLog(makeInput(LUCAS, 'maison-s1-b'));
    saveSessionLog(makeInput(MARIE, 'salle-s1-a'));
    expect(getLogsForProfile(LUCAS).map(l => l.sessionId).sort()).toEqual(['maison-s1-a', 'maison-s1-b']);
    expect(getLogsForProfile(MARIE).map(l => l.sessionId)).toEqual(['salle-s1-a']);
    expect(getLogsForProfile('admin-1')).toEqual([]);
  });

  it('la même séance le même jour sur un autre profil n’est pas un conflit', () => {
    saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-l' }));
    const result = saveSessionLog(makeInput(MARIE, SESSION, { id: 'run-m' }));
    expect(result.ok && result.action).toBe('created');
  });

  it('un profil ne peut ni écraser ni supprimer l’entrée d’un autre profil', () => {
    saveSessionLog(makeInput(LUCAS, SESSION, { id: 'run-l' }));
    expect(saveSessionLog(makeInput(MARIE, SESSION, { id: 'run-l' }))).toEqual({ ok: false, reason: 'invalid' });
    expect(deleteLog(MARIE, 'run-l')).toBe(false);
    expect(getLog(LUCAS, 'run-l')).toBeDefined();
    expect(getLog(MARIE, 'run-l')).toBeUndefined();
    expect(deleteLog(LUCAS, 'run-l')).toBe(true);
    expect(getLogsForProfile(LUCAS)).toHaveLength(0);
  });

  it('les préférences sont propres à chaque profil', () => {
    expect(getPreferences(LUCAS).humor).toBe('squatty');
    savePreferences(LUCAS, { humor: 'sobre', activeTrack: 'salle' });
    expect(getPreferences(LUCAS)).toMatchObject({ humor: 'sobre', activeTrack: 'salle', vibration: true });
    expect(getPreferences(MARIE).humor).toBe('squatty');
    expect(getPreferences(MARIE).activeTrack).toBeUndefined();
  });

  it('la séance en cours est propre à chaque profil', () => {
    const draft = {
      runId: 'run-d', profileId: LUCAS, sessionId: SESSION, startedAt: '2026-10-14T08:00:00Z',
      exerciseIndex: 1, setIndex: 0, exercises: makeInput(LUCAS, SESSION, { doneSets: 2 }).exercises, updatedAt: '2026-10-14T08:05:00Z',
    };
    saveDraft(draft);
    expect(getDraft(LUCAS)?.runId).toBe('run-d');
    expect(getDraft(MARIE)).toBeNull();
    clearDraft(LUCAS, 'autre-run');
    expect(getDraft(LUCAS)).not.toBeNull();
    clearDraft(LUCAS, 'run-d');
    expect(getDraft(LUCAS)).toBeNull();
  });
});
