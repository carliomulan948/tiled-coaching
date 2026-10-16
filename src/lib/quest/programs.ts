import { QuestExercisePlan, QuestSession, QuestTrack, QuestTrackId, QuestWeek } from './types';

// Les parcours Quest sont des parcours de démarrage génériques sur 4 semaines.
// Ils sont générés à partir de trois séances types et d'une progression hebdomadaire,
// ce qui garde les 36 séances cohérentes entre elles.

type Weekly = [number, number, number, number];

interface TemplateExercise {
  exerciseId: string;
  reps?: Weekly;
  seconds?: Weekly;
  sets?: Weekly;
  rest?: Weekly;
  perSide?: boolean;
  note?: string;
}

interface SessionTemplate {
  key: 'a' | 'b' | 'c';
  title: string;
  focus: string;
  exercises: TemplateExercise[];
}

interface TrackTemplate extends Omit<QuestTrack, 'weeks'> {
  defaultSets: Weekly;
  defaultRest: Weekly;
  warmup: string[];
  sessions: SessionTemplate[];
}

export const WEEK_THEMES: { theme: string; goal: string }[] = [
  { theme: 'Le départ', goal: 'Découvrir les mouvements avec 2 séries : la technique passe avant tout.' },
  { theme: 'Le sentier', goal: 'Passer à 3 séries et trouver ton rythme.' },
  { theme: 'La montée', goal: 'Quelques répétitions de plus, une récupération un peu plus courte.' },
  { theme: 'Le sommet', goal: 'Consolider : les mêmes mouvements, mieux maîtrisés.' },
];

const COOLDOWN = [
  'Marche tranquille 1 à 2 minutes',
  'Étirements doux de 20 à 30 secondes par zone travaillée',
  'Quelques gorgées d’eau',
];

const TRACK_TEMPLATES: TrackTemplate[] = [
  {
    id: 'maison',
    name: 'Parcours Maison',
    world: 'Le Cocon',
    tagline: 'De ton salon jusqu’au sommet.',
    description: 'Poids du corps uniquement. Un tapis, une chaise stable et un mur suffisent.',
    equipment: ['Tapis ou sol confortable', 'Chaise stable', 'Un mur libre'],
    sessionsPerWeek: 3,
    accent: 'from-emerald-500 to-teal-600',
    defaultSets: [2, 3, 3, 3],
    defaultRest: [60, 60, 50, 45],
    warmup: [
      '1 minute de marche sur place',
      '10 cercles de bras dans chaque sens',
      '10 rotations de hanches de chaque côté',
      '8 squats lents, sans chercher la profondeur',
    ],
    sessions: [
      {
        key: 'a',
        title: 'La vallée des squats',
        focus: 'Jambes et fessiers',
        exercises: [
          { exerciseId: 'bw-08', reps: [10, 12, 14, 15] },
          { exerciseId: 'bw-13', reps: [12, 15, 15, 18] },
          { exerciseId: 'bw-11', reps: [8, 10, 10, 12], perSide: true },
          { exerciseId: 'bw-22', reps: [15, 15, 20, 20] },
          { exerciseId: 'bw-16', seconds: [20, 25, 30, 35] },
        ],
      },
      {
        key: 'b',
        title: 'Le fort du gainage',
        focus: 'Haut du corps et gainage',
        exercises: [
          { exerciseId: 'bw-05', reps: [8, 10, 12, 12], note: 'Mains sur une table, un plan de travail ou un meuble stable.' },
          { exerciseId: 'bw-21', reps: [10, 12, 12, 15] },
          { exerciseId: 'bw-15', reps: [6, 8, 10, 10], note: 'Chaise stable, calée contre un mur.' },
          { exerciseId: 'bw-17', seconds: [15, 20, 20, 25], perSide: true },
          { exerciseId: 'bw-18', reps: [10, 12, 15, 15] },
        ],
      },
      {
        key: 'c',
        title: 'La course au trésor',
        focus: 'Corps entier et cardio',
        exercises: [
          { exerciseId: 'card-01', seconds: [30, 30, 40, 40] },
          { exerciseId: 'bw-32', seconds: [20, 25, 30, 40] },
          { exerciseId: 'bw-05', reps: [8, 10, 12, 12] },
          { exerciseId: 'bw-20', seconds: [20, 25, 30, 30] },
          { exerciseId: 'bw-41', reps: [5, 6, 6, 8] },
        ],
      },
    ],
  },
  {
    id: 'halteres',
    name: 'Parcours Haltères',
    world: 'La Forge',
    tagline: 'Deux haltères, mille aventures.',
    description: 'Une paire d’haltères, idéalement réglables, et un banc ou une chaise stable.',
    equipment: ['Paire d’haltères', 'Banc ou chaise stable', 'Tapis'],
    sessionsPerWeek: 3,
    accent: 'from-amber-500 to-orange-600',
    defaultSets: [2, 3, 3, 3],
    defaultRest: [75, 75, 60, 60],
    warmup: [
      '2 minutes de marche sur place ou de jumping jacks doux',
      '10 cercles de bras dans chaque sens',
      '10 charnières de hanche à vide, mains sur les hanches',
      '1 série légère du premier exercice',
    ],
    sessions: [
      {
        key: 'a',
        title: 'Le chemin des forges',
        focus: 'Bas du corps',
        exercises: [
          { exerciseId: 'db-15', reps: [10, 12, 12, 12], sets: [2, 3, 3, 4] },
          { exerciseId: 'db-17', reps: [10, 10, 12, 12] },
          { exerciseId: 'bw-11', reps: [8, 8, 10, 10], perSide: true, note: 'Ajoute un haltère dans chaque main quand le mouvement est maîtrisé.' },
          { exerciseId: 'db-16', reps: [12, 12, 15, 15], note: 'Haut du dos contre un banc ou un canapé stable.' },
          { exerciseId: 'bw-22', reps: [15, 15, 20, 20] },
        ],
      },
      {
        key: 'b',
        title: 'La tour des forgerons',
        focus: 'Haut du corps',
        exercises: [
          { exerciseId: 'db-01', reps: [10, 10, 12, 12], note: 'Sans banc : allongé au sol (floor press).' },
          { exerciseId: 'db-05', reps: [10, 10, 12, 12], perSide: true, note: 'Une main et un genou en appui sur un banc ou une chaise.' },
          { exerciseId: 'db-11', reps: [8, 10, 10, 12] },
          { exerciseId: 'db-06', reps: [10, 12, 12, 12] },
          { exerciseId: 'db-10', reps: [10, 12, 12, 12] },
        ],
      },
      {
        key: 'c',
        title: 'Le grand circuit',
        focus: 'Corps entier',
        exercises: [
          { exerciseId: 'db-15', reps: [12, 12, 12, 15] },
          { exerciseId: 'db-01', reps: [10, 10, 12, 12] },
          { exerciseId: 'db-05', reps: [10, 10, 12, 12], perSide: true },
          { exerciseId: 'db-12', reps: [10, 12, 12, 12] },
          { exerciseId: 'bw-16', seconds: [20, 25, 30, 35] },
        ],
      },
    ],
  },
  {
    id: 'salle',
    name: 'Parcours Salle',
    world: 'La Citadelle',
    tagline: 'Les machines n’ont qu’à bien se tenir.',
    description: 'Machines guidées et poulies pour poser les bases en sécurité.',
    equipment: ['Machines guidées', 'Poulie', 'Haltères', 'Rameur ou vélo'],
    sessionsPerWeek: 3,
    accent: 'from-fuchsia-500 to-violet-600',
    defaultSets: [2, 3, 3, 3],
    defaultRest: [90, 90, 75, 75],
    warmup: [
      '5 minutes de vélo ou de rameur à allure facile',
      '10 cercles de bras et 10 rotations de hanches',
      '1 série très légère du premier exercice',
    ],
    sessions: [
      {
        key: 'a',
        title: 'Les remparts',
        focus: 'Bas du corps',
        exercises: [
          { exerciseId: 'mach-01', reps: [10, 12, 12, 12], sets: [2, 3, 3, 4] },
          { exerciseId: 'mach-04', reps: [10, 12, 12, 12] },
          { exerciseId: 'mach-07', reps: [10, 12, 12, 12], note: 'Pas de machine dédiée ? Hip thrust à la Smith machine.' },
          { exerciseId: 'mach-06', reps: [12, 12, 15, 15] },
          { exerciseId: 'mach-11', reps: [12, 15, 15, 15] },
        ],
      },
      {
        key: 'b',
        title: 'La tour de guet',
        focus: 'Haut du corps',
        exercises: [
          { exerciseId: 'mach-15', reps: [10, 12, 12, 12] },
          { exerciseId: 'mach-18', reps: [10, 12, 12, 12] },
          { exerciseId: 'mach-22', reps: [10, 12, 12, 12] },
          { exerciseId: 'mach-25', reps: [10, 10, 12, 12] },
          { exerciseId: 'pou-09', reps: [12, 12, 15, 15] },
        ],
      },
      {
        key: 'c',
        title: 'Le tour de la citadelle',
        focus: 'Corps entier et cardio',
        exercises: [
          { exerciseId: 'card-06', seconds: [300, 300, 360, 360], sets: [1, 1, 1, 1], rest: [60, 60, 60, 60], note: 'Allure confortable : tu dois pouvoir parler.' },
          { exerciseId: 'db-15', reps: [10, 12, 12, 12] },
          { exerciseId: 'mach-23', reps: [10, 12, 12, 12] },
          { exerciseId: 'mach-16', reps: [10, 10, 12, 12] },
          { exerciseId: 'mach-13', reps: [10, 12, 12, 12] },
          { exerciseId: 'bw-16', seconds: [20, 25, 30, 35] },
        ],
      },
    ],
  },
];

// Durée estimée : environ 3 s par répétition, échauffement et retour au calme compris.
function estimateMinutes(exercises: QuestExercisePlan[]): number {
  const seconds = exercises.reduce((total, ex) => {
    const sides = ex.perSide ? 2 : 1;
    const work = ex.target.kind === 'reps' ? ex.target.value * 3 : ex.target.seconds;
    return total + ex.sets * (work * sides + ex.restSeconds);
  }, 0);
  const minutes = seconds / 60 + 8;
  return Math.max(15, Math.round(minutes / 5) * 5);
}

function buildTrack(template: TrackTemplate): QuestTrack {
  const { defaultSets, defaultRest, warmup, sessions, ...track } = template;
  const weeks: QuestWeek[] = WEEK_THEMES.map((theme, w) => {
    const weekSessions: QuestSession[] = sessions.map((session, order) => {
      const exercises: QuestExercisePlan[] = session.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: (ex.sets ?? defaultSets)[w],
        target: ex.seconds
          ? { kind: 'time', seconds: ex.seconds[w] }
          : { kind: 'reps', value: (ex.reps ?? [10, 10, 10, 10])[w] },
        perSide: ex.perSide,
        restSeconds: (ex.rest ?? defaultRest)[w],
        note: ex.note,
      }));
      return {
        id: `${template.id}-s${w + 1}-${session.key}`,
        trackId: template.id,
        week: w + 1,
        order: order + 1,
        title: session.title,
        focus: session.focus,
        estimatedMinutes: estimateMinutes(exercises),
        warmup,
        cooldown: COOLDOWN,
        exercises,
      };
    });
    return { week: w + 1, theme: theme.theme, goal: theme.goal, sessions: weekSessions };
  });
  return { ...track, weeks };
}

export const QUEST_TRACKS: QuestTrack[] = TRACK_TEMPLATES.map(buildTrack);

export const TRACK_IDS: QuestTrackId[] = QUEST_TRACKS.map(t => t.id);

export function isTrackId(value: string): value is QuestTrackId {
  return (TRACK_IDS as string[]).includes(value);
}

export function getTrack(id: string): QuestTrack | undefined {
  return QUEST_TRACKS.find(t => t.id === id);
}

export function getTrackSessions(trackId: QuestTrackId): QuestSession[] {
  return getTrack(trackId)?.weeks.flatMap(w => w.sessions) ?? [];
}

export function getAllSessions(): QuestSession[] {
  return QUEST_TRACKS.flatMap(t => t.weeks.flatMap(w => w.sessions));
}

export function getSession(id: string): QuestSession | undefined {
  return getAllSessions().find(s => s.id === id);
}

export function plannedSetCount(session: QuestSession): number {
  return session.exercises.reduce((n, ex) => n + ex.sets, 0);
}

export function formatTarget(target: QuestExercisePlan['target'], perSide?: boolean): string {
  const base = target.kind === 'reps'
    ? `${target.value} rép.`
    : formatDuration(target.seconds);
  return perSide ? `${base} par côté` : base;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m} min ${s} s`;
}
