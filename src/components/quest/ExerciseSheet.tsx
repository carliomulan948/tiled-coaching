'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import { exercisesDatabase, EQUIPMENT_LABELS, MUSCLE_LABELS, DIFFICULTY_COLORS } from '@/lib/exercisesData';
import { GENERAL_SAFETY, getGuide } from '@/lib/quest/guides';
import { questRoutes } from '@/lib/quest/routes';
import { ExerciseVariant } from '@/lib/quest/types';

const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

export function getLibraryExercise(id: string) {
  return exercisesDatabase.find(e => e.id === id);
}

function VariantLink({ variant, kind }: { variant: ExerciseVariant; kind: 'easier' | 'harder' }) {
  const Icon = kind === 'easier' ? ArrowDownRight : ArrowUpRight;
  const linked = variant.exerciseId ? getLibraryExercise(variant.exerciseId) : undefined;
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${kind === 'easier' ? 'text-sky-300' : 'text-fuchsia-300'}`} />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {kind === 'easier' ? 'Plus facile' : 'Plus difficile'}
        </p>
        <p className="text-sm text-slate-200">{variant.label}</p>
        {linked && (
          <Link href={questRoutes.exercise(linked.id)} className="text-xs text-orange-300 hover:text-orange-200">
            Voir la fiche : {linked.name}
          </Link>
        )}
      </div>
    </div>
  );
}

// Fiche d'exercice : informations de la bibliothèque générale + consignes Quest quand elles existent.
export default function ExerciseSheet({ exerciseId }: { exerciseId: string }) {
  const exercise = getLibraryExercise(exerciseId);
  const guide = getGuide(exerciseId);
  if (!exercise) {
    return <p className="text-slate-400 text-sm">Exercice introuvable.</p>;
  }
  const muscles = [...exercise.muscles, ...(exercise.muscleSecondary ?? [])].map(m => MUSCLE_LABELS[m] ?? m);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
            {DIFFICULTY_LABELS[exercise.difficulty]}
          </span>
          {exercise.equipment.map(eq => (
            <span key={eq} className="text-xs px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">
              {EQUIPMENT_LABELS[eq] ?? eq}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-3">{exercise.description}</p>
        <p className="text-xs text-slate-500 mt-1.5">Muscles : {muscles.join(', ')}</p>
      </div>

      {guide ? (
        <>
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Consignes
            </h3>
            <ol className="space-y-1.5 list-decimal list-inside text-sm text-slate-300 marker:text-slate-500">
              {guide.cues.map(cue => <li key={cue}>{cue}</li>)}
            </ol>
          </section>
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <XCircle className="w-4 h-4 text-rose-400" /> Erreurs fréquentes
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {guide.mistakes.map(m => <li key={m} className="flex gap-2"><span className="text-rose-400">•</span>{m}</li>)}
            </ul>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-white mb-2">Variantes</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              <VariantLink variant={guide.easier} kind="easier" />
              <VariantLink variant={guide.harder} kind="harder" />
            </div>
          </section>
        </>
      ) : (
        exercise.tips && (
          <p className="flex gap-2 text-sm text-slate-300"><Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />{exercise.tips}</p>
        )
      )}

      <p className="flex gap-2 text-xs text-slate-300 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-rose-300 flex-shrink-0" />
        <span>{guide?.safety ? `${guide.safety} ` : ''}{GENERAL_SAFETY}</span>
      </p>
    </div>
  );
}
