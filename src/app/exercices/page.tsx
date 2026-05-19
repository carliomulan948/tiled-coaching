'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Dumbbell, ChevronDown, ChevronUp, BookOpen, Zap, Leaf, Move } from 'lucide-react';
import { getAuth } from '@/lib/storage';
import { exercisesDatabase, MUSCLE_LABELS, EQUIPMENT_LABELS, EQUIPMENT_COLORS, CATEGORY_COLORS, DIFFICULTY_COLORS } from '@/lib/exercisesData';
import { Exercise, ExerciseCategory, Equipment, MuscleGroup, Difficulty } from '@/lib/types';

const CATEGORIES: { key: ExerciseCategory | 'all'; label: string; icon: any; color: string }[] = [
  { key: 'all', label: 'Tous', icon: BookOpen, color: 'text-slate-400' },
  { key: 'musculation', label: 'Musculation', icon: Dumbbell, color: 'text-blue-400' },
  { key: 'yoga', label: 'Yoga', icon: Leaf, color: 'text-teal-400' },
  { key: 'cardio', label: 'Cardio', icon: Zap, color: 'text-orange-400' },
  { key: 'mobilite', label: 'Mobilité', icon: Move, color: 'text-purple-400' },
];

const DIFFICULTIES: { key: Difficulty | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous niveaux' },
  { key: 'debutant', label: 'Débutant' },
  { key: 'intermediaire', label: 'Intermédiaire' },
  { key: 'avance', label: 'Avancé' },
];

const MUSCLES: { key: MuscleGroup | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous les muscles' },
  { key: 'pectoraux', label: 'Pectoraux' },
  { key: 'dos', label: 'Dos' },
  { key: 'epaules', label: 'Épaules' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'abdominaux', label: 'Abdominaux' },
  { key: 'obliques', label: 'Obliques' },
  { key: 'quadriceps', label: 'Quadriceps' },
  { key: 'ischio_jambiers', label: 'Ischio-jambiers' },
  { key: 'fessiers', label: 'Fessiers' },
  { key: 'mollets', label: 'Mollets' },
  { key: 'corps_entier', label: 'Corps entier' },
  { key: 'gainage', label: 'Gainage' },
];

const EQUIPMENTS: { key: Equipment | 'all'; label: string }[] = [
  { key: 'all', label: 'Tout équipement' },
  { key: 'aucun', label: 'Poids du corps' },
  { key: 'halteres', label: 'Haltères' },
  { key: 'barre', label: 'Barre' },
  { key: 'machine', label: 'Machine' },
  { key: 'elastique', label: 'Élastique' },
  { key: 'barre_traction', label: 'Barre de traction' },
  { key: 'kettlebell', label: 'Kettlebell' },
];

function ExerciseCard({ ex, expanded, onToggle }: { ex: Exercise; expanded: boolean; onToggle: () => void }) {
  const diffLabel = ex.difficulty === 'debutant' ? 'Débutant' : ex.difficulty === 'intermediaire' ? 'Intermédiaire' : 'Avancé';
  const catGrad = CATEGORY_COLORS[ex.category];

  return (
    <div className={`bg-slate-800/60 border rounded-xl overflow-hidden transition-all duration-200 ${expanded ? 'border-blue-500/40' : 'border-slate-700/50 hover:border-slate-600'}`}>
      <button onClick={onToggle} className="w-full text-left p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${catGrad} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Dumbbell className="w-5 h-5 text-white/80" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm leading-tight">{ex.name}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLORS[ex.difficulty]}`}>
                {diffLabel}
              </span>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>

          {/* Muscles */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {ex.muscles.map(m => (
              <span key={m} className="text-xs bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">{MUSCLE_LABELS[m]}</span>
            ))}
            {ex.muscleSecondary?.map(m => (
              <span key={m} className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{MUSCLE_LABELS[m]}</span>
            ))}
          </div>

          {/* Equipment */}
          <div className="flex flex-wrap gap-1 mt-1">
            {ex.equipment.map(eq => (
              <span key={eq} className={`text-xs px-1.5 py-0.5 rounded border ${EQUIPMENT_COLORS[eq] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                {EQUIPMENT_LABELS[eq]}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700/50 space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">{ex.description}</p>

          {ex.tips && (
            <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <span className="text-amber-400 text-xs font-bold flex-shrink-0 mt-0.5">💡 Conseil</span>
              <p className="text-xs text-amber-200/80">{ex.tips}</p>
            </div>
          )}

          {/* Default programming */}
          <div className="grid grid-cols-3 gap-2">
            {ex.defaultSets && (
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-white">{ex.defaultSets}</div>
                <div className="text-xs text-slate-500">séries</div>
              </div>
            )}
            {(ex.defaultReps || ex.defaultDuration) && (
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-white">{ex.defaultReps ?? ex.defaultDuration}</div>
                <div className="text-xs text-slate-500">{ex.defaultReps ? 'rép.' : 'durée'}</div>
              </div>
            )}
            {ex.defaultRest !== undefined && ex.defaultRest > 0 && (
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-white">{ex.defaultRest}s</div>
                <div className="text-xs text-slate-500">repos</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExercicesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setMounted(true);
    const auth = getAuth();
    if (!auth.isAuthenticated) router.push('/');
  }, [router]);

  const filtered = useMemo(() => {
    return exercisesDatabase.filter(ex => {
      if (category !== 'all' && ex.category !== category) return false;
      if (difficulty !== 'all' && ex.difficulty !== difficulty) return false;
      if (muscle !== 'all' && !ex.muscles.includes(muscle) && !ex.muscleSecondary?.includes(muscle)) return false;
      if (equipment !== 'all' && !ex.equipment.includes(equipment)) return false;
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase()) &&
          !ex.muscles.some(m => MUSCLE_LABELS[m]?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [category, difficulty, muscle, equipment, search]);

  // Stats
  const stats = useMemo(() => ({
    total: exercisesDatabase.length,
    musculation: exercisesDatabase.filter(e => e.category === 'musculation').length,
    yoga: exercisesDatabase.filter(e => e.category === 'yoga').length,
    cardio: exercisesDatabase.filter(e => e.category === 'cardio').length,
    mobilite: exercisesDatabase.filter(e => e.category === 'mobilite').length,
    sansEquipement: exercisesDatabase.filter(e => e.equipment.includes('aucun') || e.equipment.includes('tapis')).length,
  }), []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Base d'exercices</h1>
          <p className="text-slate-400 text-sm mt-1">{exercisesDatabase.length} exercices • Musculation, Yoga, Cardio, Mobilité</p>
        </div>
        <button
          onClick={() => router.push('/programmes')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Dumbbell className="w-4 h-4" /> Créer un programme
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Musculation', value: stats.musculation, color: 'text-blue-400' },
          { label: 'Yoga', value: stats.yoga, color: 'text-teal-400' },
          { label: 'Cardio', value: stats.cardio, color: 'text-orange-400' },
          { label: 'Mobilité', value: stats.mobilite, color: 'text-purple-400' },
          { label: 'Sans équipement', value: stats.sansEquipement, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un exercice, un muscle..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition-colors
              ${showFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            <Filter className="w-4 h-4" /> Filtres
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                ${category === c.key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}
            >
              <c.icon className={`w-3.5 h-3.5 ${category === c.key ? 'text-white' : c.color}`} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Niveau</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {DIFFICULTIES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Muscle ciblé</label>
              <select
                value={muscle}
                onChange={e => setMuscle(e.target.value as any)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {MUSCLES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Équipement</label>
              <select
                value={equipment}
                onChange={e => setEquipment(e.target.value as any)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {EQUIPMENTS.map(eq => <option key={eq.key} value={eq.key}>{eq.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="text-white font-semibold">{filtered.length}</span> exercice{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </p>
        {(category !== 'all' || difficulty !== 'all' || muscle !== 'all' || equipment !== 'all' || search) && (
          <button
            onClick={() => { setCategory('all'); setDifficulty('all'); setMuscle('all'); setEquipment('all'); setSearch(''); }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Exercise grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(ex => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            expanded={expandedId === ex.id}
            onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-500">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun exercice trouvé avec ces critères.</p>
          </div>
        )}
      </div>
    </div>
  );
}
