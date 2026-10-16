import { describe, expect, it } from 'vitest';
import { exercisesDatabase } from '../../exercisesData';
import { EXERCISE_GUIDES, GENERAL_SAFETY, getGuide } from '../guides';
import { getHumorMessage, HUMOR_LEVELS, HUMOR_MESSAGES, HumorMoment, SAFETY_MESSAGES } from '../humor';
import { getAllSessions, getSession, QUEST_TRACKS } from '../programs';

const libraryIds = new Set(exercisesDatabase.map(e => e.id));

// Découpe un texte en mots (lettres accentuées comprises) pour des comparaisons fiables.
function words(text: string): string[] {
  return text.toLowerCase().split(/[^a-zà-öø-ÿœ]+/i).filter(Boolean);
}

const FART_WORDS = ['pet', 'pets', 'prout', 'pète', 'péter', 'pété'];
const BODY_SHAMING_OR_GUILT = [
  'gros', 'grosse', 'graisse', 'bourrelet', 'bourrelets', 'moche', 'flasque', 'maigre', 'kilos',
  'paresseux', 'paresseuse', 'flemmard', 'flemmarde', 'nul', 'nulle', 'honte', 'coupable', 'culpabiliser', 'raté',
];

describe('parcours Quest', () => {
  it('propose trois parcours de quatre semaines : maison, haltères et salle', () => {
    expect(QUEST_TRACKS.map(t => t.id)).toEqual(['maison', 'halteres', 'salle']);
    for (const track of QUEST_TRACKS) {
      expect(track.weeks.map(w => w.week)).toEqual([1, 2, 3, 4]);
      for (const week of track.weeks) expect(week.sessions).toHaveLength(track.sessionsPerWeek);
    }
  });

  it('chaque séance a des séries, des répétitions ou une durée, et une récupération', () => {
    for (const session of getAllSessions()) {
      expect(session.exercises.length).toBeGreaterThan(0);
      expect(session.warmup.length).toBeGreaterThan(0);
      for (const ex of session.exercises) {
        expect(ex.sets).toBeGreaterThan(0);
        expect(ex.restSeconds).toBeGreaterThan(0);
        if (ex.target.kind === 'reps') expect(ex.target.value).toBeGreaterThan(0);
        else expect(ex.target.seconds).toBeGreaterThan(0);
      }
    }
  });

  it('les identifiants de séance sont uniques et retrouvables', () => {
    const ids = getAllSessions().map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(36);
    expect(getSession('salle-s4-c')?.week).toBe(4);
  });

  it('la charge progresse ou se maintient d’une semaine à l’autre', () => {
    for (const track of QUEST_TRACKS) {
      for (let order = 0; order < track.sessionsPerWeek; order++) {
        const volumes = track.weeks.map(w =>
          w.sessions[order].exercises.reduce((n, ex) =>
            n + ex.sets * (ex.target.kind === 'reps' ? ex.target.value : ex.target.seconds), 0));
        for (let i = 1; i < volumes.length; i++) expect(volumes[i]).toBeGreaterThanOrEqual(volumes[i - 1]);
      }
    }
  });
});

describe('fiches d’exercices', () => {
  it('chaque exercice des parcours existe dans la bibliothèque générale et possède une fiche', () => {
    for (const session of getAllSessions()) {
      for (const ex of session.exercises) {
        expect(libraryIds.has(ex.exerciseId), ex.exerciseId).toBe(true);
        expect(getGuide(ex.exerciseId), ex.exerciseId).toBeDefined();
      }
    }
  });

  it('chaque fiche contient consignes, erreurs fréquentes et variantes valides', () => {
    for (const guide of EXERCISE_GUIDES) {
      expect(libraryIds.has(guide.exerciseId), guide.exerciseId).toBe(true);
      expect(guide.cues.length).toBeGreaterThanOrEqual(3);
      expect(guide.mistakes.length).toBeGreaterThanOrEqual(2);
      for (const variant of [guide.easier, guide.harder]) {
        expect(variant.label.length).toBeGreaterThan(0);
        if (variant.exerciseId) expect(libraryIds.has(variant.exerciseId), variant.exerciseId).toBe(true);
      }
    }
    expect(new Set(EXERCISE_GUIDES.map(g => g.exerciseId)).size).toBe(EXERCISE_GUIDES.length);
  });

  it('la bibliothèque générale reste ouverte à tous les niveaux', () => {
    const levels = new Set(exercisesDatabase.map(e => e.difficulty));
    expect(Array.from(levels).sort()).toEqual(['avance', 'debutant', 'intermediaire']);
  });

  it('les consignes techniques ne contiennent pas d’humour', () => {
    const technical = EXERCISE_GUIDES.flatMap(g => [...g.cues, ...g.mistakes, g.safety ?? '']).join(' ');
    for (const word of words(technical)) expect(FART_WORDS).not.toContain(word);
    expect(technical).not.toMatch(/pistache/i);
  });
});

describe('humour', () => {
  const moments = Object.keys(HUMOR_MESSAGES) as HumorMoment[];

  it('propose trois réglages avec des messages pour chaque moment', () => {
    expect(HUMOR_LEVELS.map(l => l.id)).toEqual(['squatty', 'petite_dose', 'sobre']);
    for (const moment of moments) {
      for (const level of HUMOR_LEVELS) {
        expect(HUMOR_MESSAGES[moment][level.id].length, `${moment}/${level.id}`).toBeGreaterThan(0);
        expect(getHumorMessage(moment, level.id, 12345).length).toBeGreaterThan(0);
      }
    }
  });

  it('le réglage Squatty reprend les blagues de référence', () => {
    const all = moments.flatMap(m => HUMOR_MESSAGES[m].squatty).join(' ');
    expect(all).toContain('Tu as une tache ! Pistache !');
    expect(all).toContain('Le premier qui lâche un pet pendant le squat a gagné.');
  });

  it('Petite dose et Sobre ne font pas de blagues de pets', () => {
    for (const moment of moments) {
      for (const level of ['petite_dose', 'sobre'] as const) {
        for (const message of HUMOR_MESSAGES[moment][level]) {
          for (const word of words(message)) expect(FART_WORDS, message).not.toContain(word);
          expect(message).not.toMatch(/pistache/i);
        }
      }
    }
  });

  it('aucun message ne se moque du physique ni ne culpabilise', () => {
    const texts = [
      ...moments.flatMap(m => HUMOR_LEVELS.flatMap(l => HUMOR_MESSAGES[m][l.id])),
      ...Object.values(SAFETY_MESSAGES),
    ];
    for (const text of texts) {
      for (const word of words(text)) expect(BODY_SHAMING_OR_GUILT, text).not.toContain(word);
    }
  });

  it('les messages de douleur restent clairs et sans humour', () => {
    const safety = [...Object.values(SAFETY_MESSAGES), GENERAL_SAFETY].join(' ');
    for (const word of words(safety)) expect(FART_WORDS).not.toContain(word);
    expect(SAFETY_MESSAGES.pain).toMatch(/arrête/i);
    expect(SAFETY_MESSAGES.pain).toMatch(/professionnel de santé/);
    expect(SAFETY_MESSAGES.emergency).toMatch(/15.*112/);
  });

  it('le choix du message est stable pour une même graine', () => {
    expect(getHumorMessage('set_done', 'squatty', 3)).toBe(getHumorMessage('set_done', 'squatty', 3));
    expect(getHumorMessage('set_done', 'sobre', -7)).toBeTruthy();
  });
});
