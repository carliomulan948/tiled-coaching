// ─── Squatty Quest : parcours génériques (distincts des programmes du coach) ───

export type QuestTrackId = 'maison' | 'halteres' | 'salle';

export type QuestTarget =
  | { kind: 'reps'; value: number }
  | { kind: 'time'; seconds: number };

export interface QuestExercisePlan {
  exerciseId: string;
  sets: number;
  target: QuestTarget;
  perSide?: boolean;
  restSeconds: number;
  note?: string;
}

export interface QuestSession {
  id: string;            // ex. "maison-s1-a"
  trackId: QuestTrackId;
  week: number;          // 1 à 4
  order: number;         // 1 à 3 dans la semaine
  title: string;
  focus: string;
  estimatedMinutes: number;
  warmup: string[];
  cooldown: string[];
  exercises: QuestExercisePlan[];
}

export interface QuestWeek {
  week: number;
  theme: string;
  goal: string;
  sessions: QuestSession[];
}

export interface QuestTrack {
  id: QuestTrackId;
  name: string;
  world: string;
  tagline: string;
  description: string;
  equipment: string[];
  sessionsPerWeek: number;
  accent: string;        // classes Tailwind du dégradé
  weeks: QuestWeek[];
}

export interface ExerciseVariant {
  label: string;
  exerciseId?: string;   // renvoie vers la bibliothèque générale quand l'exercice y figure
}

export interface ExerciseGuide {
  exerciseId: string;
  cues: string[];
  mistakes: string[];
  easier: ExerciseVariant;
  harder: ExerciseVariant;
  safety?: string;
}

// ─── Carnet ──────────────────────────────────────────────────────────────────

export interface QuestSetLog {
  done: boolean;
  reps?: number;
  seconds?: number;
  weightKg?: number;
}

export interface QuestExerciseLog {
  exerciseId: string;
  target: QuestTarget;
  perSide?: boolean;
  sets: QuestSetLog[];
  pain?: boolean;
}

export type QuestLogStatus = 'complete' | 'partial';
export type QuestLogSource = 'guided' | 'carnet';

export interface QuestSessionLog {
  id: string;              // identifiant de la tentative : sert de clé anti-doublon
  profileId: string;
  source: QuestLogSource;
  trackId: QuestTrackId;
  sessionId: string;
  week: number;
  date: string;            // AAAA-MM-JJ (heure locale)
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  status: QuestLogStatus;
  setsDone: number;
  setsPlanned: number;
  exercises: QuestExerciseLog[];
  feeling?: number;        // ressenti d'effort de 1 (facile) à 5 (très difficile)
  painReported?: boolean;
  notes?: string;
  resumedFromPartial?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Préférences et séance en cours ──────────────────────────────────────────

export type HumorLevel = 'squatty' | 'petite_dose' | 'sobre';

export interface QuestPreferences {
  humor: HumorLevel;
  sound: boolean;
  vibration: boolean;
  activeTrack?: QuestTrackId;
}

export interface QuestDraft {
  runId: string;
  profileId: string;
  sessionId: string;
  startedAt: string;
  exerciseIndex: number;
  setIndex: number;
  exercises: QuestExerciseLog[];
  resumedFromPartial?: boolean;
  baseDurationSeconds?: number;   // durée déjà effectuée lors d'une reprise
  logDate?: string;               // jour de la séance dans le carnet (AAAA-MM-JJ)
  feeling?: number;
  notes?: string;
  updatedAt: string;
}
