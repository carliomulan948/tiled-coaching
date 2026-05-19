'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Save, Users,
  Dumbbell, Calendar, FileText, Search, X, GripVertical,
  Edit3, Check, ClipboardList, ArrowLeft
} from 'lucide-react';
import { getAuth } from '@/lib/storage';
import { getPrograms, saveProgram, deleteProgram, getProgramsForCoach } from '@/lib/storage';
import { getClients } from '@/lib/storage';
import { exercisesDatabase as exercises } from '@/lib/exercisesData';
import { WorkoutProgram, ProgramDay, ProgramExercise, Client, Exercise } from '@/lib/types';
import { DIFFICULTY_COLORS, CATEGORY_COLORS, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/lib/exercisesData';

function genId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface ExercisePickerProps {
  onAdd: (ex: Exercise) => void;
  onClose: () => void;
}

function ExercisePicker({ onAdd, onClose }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('tous');

  const cats = ['tous', 'musculation', 'yoga', 'cardio', 'mobilite'] as const;
  const catLabels: Record<string, string> = {
    tous: 'Tous', musculation: 'Musculation', yoga: 'Yoga', cardio: 'Cardio', mobilite: 'Mobilité'
  };

  const filtered = exercises.filter(ex => {
    const matchCat = cat === 'tous' || ex.category === cat;
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscles.some(m => MUSCLE_LABELS[m]?.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Ajouter un exercice</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou muscle…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {cats.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${cat === c ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {catLabels[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-8">Aucun exercice trouvé</p>
          )}
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onAdd(ex); onClose(); }}
              className="w-full flex items-center gap-4 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-colors group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${CATEGORY_COLORS[ex.category]}`}>
                {ex.category === 'yoga' ? '🧘' : ex.category === 'cardio' ? '🏃' : ex.category === 'mobilite' ? '🤸' : '💪'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{ex.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {ex.muscles.slice(0, 2).map(m => MUSCLE_LABELS[m]).join(', ')}
                  {ex.equipment.includes('aucun') && <span className="ml-2 text-green-400">• Sans équip.</span>}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${DIFFICULTY_COLORS[ex.difficulty]}`}>
                {ex.difficulty === 'debutant' ? 'Déb.' : ex.difficulty === 'intermediaire' ? 'Inter.' : 'Avancé'}
              </span>
              <Plus className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProgramFormProps {
  initial?: WorkoutProgram;
  clients: Client[];
  coachId: string;
  onSave: (p: WorkoutProgram) => void;
  onCancel: () => void;
}

function ProgramForm({ initial, clients, coachId, onSave, onCancel }: ProgramFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [objective, setObjective] = useState(initial?.objective ?? '');
  const [durationWeeks, setDurationWeeks] = useState(initial?.durationWeeks ?? 8);
  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [days, setDays] = useState<ProgramDay[]>(initial?.days ?? []);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState('');

  const addDay = () => {
    const newDay: ProgramDay = {
      id: genId(),
      name: `Séance ${days.length + 1}`,
      exercises: [],
    };
    setDays(prev => [...prev, newDay]);
    setExpandedDay(newDay.id);
  };

  const removeDay = (id: string) => {
    setDays(prev => prev.filter(d => d.id !== id));
    if (expandedDay === id) setExpandedDay(null);
  };

  const renameDay = (id: string, name: string) => {
    setDays(prev => prev.map(d => d.id === id ? { ...d, name } : d));
  };

  const addExerciseToDay = (dayId: string, ex: Exercise) => {
    const pe: ProgramExercise = {
      id: genId(),
      exerciseId: ex.id,
      sets: ex.defaultSets ?? 3,
      reps: ex.defaultReps ?? '10',
      rest: ex.defaultRest ?? 60,
    };
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, pe] } : d));
  };

  const removeExercise = (dayId: string, exId: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== exId) } : d));
  };

  const updateExerciseField = (dayId: string, exId: string, field: keyof ProgramExercise, value: any) => {
    setDays(prev => prev.map(d =>
      d.id === dayId ? {
        ...d,
        exercises: d.exercises.map(e => e.id === exId ? { ...e, [field]: value } : e)
      } : d
    ));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const program: WorkoutProgram = {
      id: initial?.id ?? genId(),
      name: name.trim(),
      coachId,
      clientId: clientId || undefined,
      objective: objective.trim(),
      durationWeeks,
      days,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(program);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{initial ? 'Modifier le programme' : 'Nouveau programme'}</h2>
          <p className="text-sm text-slate-400">Construisez votre programme d'entraînement</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Nom du programme *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Full body 8 semaines"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Objectif</label>
            <input
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="Ex : Prise de masse, perte de poids…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Assigner à un client</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">— Aucun client (modèle) —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Durée (semaines)</label>
            <input
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={e => setDurationWeeks(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Instructions générales, consignes…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Séances ({days.length})
          </h3>
          <button
            onClick={addDay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une séance
          </button>
        </div>

        {days.length === 0 && (
          <div className="text-center py-10 text-slate-500 bg-slate-900 border border-dashed border-slate-700 rounded-2xl">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Ajoutez votre première séance pour commencer</p>
          </div>
        )}

        {days.map((day, idx) => {
          const isOpen = expandedDay === day.id;
          return (
            <div key={day.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>

                {editingDayId === day.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      value={editingDayName}
                      onChange={e => setEditingDayName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { renameDay(day.id, editingDayName); setEditingDayId(null); }
                        if (e.key === 'Escape') setEditingDayId(null);
                      }}
                      className="flex-1 bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                    />
                    <button onClick={() => { renameDay(day.id, editingDayName); setEditingDayId(null); }} className="text-green-400 hover:text-green-300">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-white truncate">{day.name}</span>
                    <button
                      onClick={() => { setEditingDayId(day.id); setEditingDayName(day.name); }}
                      className="text-slate-600 hover:text-slate-400 flex-shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <span className="text-xs text-slate-500 flex-shrink-0">
                  {day.exercises.length} exercice{day.exercises.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => removeDay(day.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setExpandedDay(isOpen ? null : day.id)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-slate-800 p-4 space-y-3">
                  {day.exercises.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-3">Aucun exercice — ajoutez-en ci-dessous</p>
                  )}
                  {day.exercises.map((pe, eIdx) => {
                    const ex = exercises.find(e => e.id === pe.exerciseId);
                    if (!ex) return null;
                    return (
                      <div key={pe.id} className="bg-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-700 text-slate-400 text-xs flex items-center justify-center flex-shrink-0">
                            {eIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{ex.name}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {ex.muscles.slice(0, 2).map(m => MUSCLE_LABELS[m]).join(', ')}
                            </p>
                          </div>
                          <button
                            onClick={() => removeExercise(day.id, pe.id)}
                            className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Séries</label>
                            <input
                              type="number"
                              min={1}
                              value={pe.sets}
                              onChange={e => updateExerciseField(day.id, pe.id, 'sets', Number(e.target.value))}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Reps / Durée</label>
                            <input
                              type="text"
                              value={pe.reps}
                              onChange={e => updateExerciseField(day.id, pe.id, 'reps', e.target.value)}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Repos (sec)</label>
                            <input
                              type="number"
                              min={0}
                              step={15}
                              value={pe.rest}
                              onChange={e => updateExerciseField(day.id, pe.id, 'rest', Number(e.target.value))}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={pe.notes ?? ''}
                            onChange={e => updateExerciseField(day.id, pe.id, 'notes', e.target.value)}
                            placeholder="Notes (optionnel)…"
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => setPickerDayId(day.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-700 hover:border-blue-500/50 text-slate-500 hover:text-blue-400 rounded-xl text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un exercice
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Save className="w-4 h-4" />
          Enregistrer le programme
        </button>
      </div>

      {pickerDayId && (
        <ExercisePicker
          onAdd={ex => addExerciseToDay(pickerDayId, ex)}
          onClose={() => setPickerDayId(null)}
        />
      )}
    </div>
  );
}

export default function ProgrammesPage() {
  const router = useRouter();
  const [coachId, setCoachId] = useState('');
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editing, setEditing] = useState<WorkoutProgram | undefined>(undefined);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    const cId = auth.user?.id ?? '';
    setCoachId(cId);
    setPrograms(getProgramsForCoach(cId));
    setClients(getClients().filter(c => c.coachId === cId));
  }, []);

  const handleSave = (program: WorkoutProgram) => {
    saveProgram(program);
    setPrograms(getProgramsForCoach(coachId));
    setView('list');
    setEditing(undefined);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce programme ?')) return;
    deleteProgram(id);
    setPrograms(getProgramsForCoach(coachId));
  };

  const filtered = programs.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.objective.toLowerCase().includes(search.toLowerCase())
  );

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId)?.name ?? clientId;
  };

  const totalExercises = (p: WorkoutProgram) =>
    p.days.reduce((acc, d) => acc + d.exercises.length, 0);

  if (view === 'create' || view === 'edit') {
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <ProgramForm
            initial={editing}
            clients={clients}
            coachId={coachId}
            onSave={handleSave}
            onCancel={() => { setView('list'); setEditing(undefined); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Programmes sportifs</h1>
            <p className="text-slate-400 text-sm mt-0.5">Créez et gérez vos programmes d'entraînement</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/exercices')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors border border-slate-700"
            >
              <Dumbbell className="w-4 h-4" />
              Base d'exercices
            </button>
            <button
              onClick={() => { setEditing(undefined); setView('create'); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nouveau programme
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Programmes', value: programs.length, icon: ClipboardList, color: 'text-blue-400' },
            { label: 'Clients assignés', value: new Set(programs.map(p => p.clientId).filter(Boolean)).size, icon: Users, color: 'text-purple-400' },
            { label: 'Séances créées', value: programs.reduce((a, p) => a + p.days.length, 0), icon: Calendar, color: 'text-cyan-400' },
            { label: 'Exercices total', value: programs.reduce((a, p) => a + totalExercises(p), 0), icon: Dumbbell, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher un programme…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Programs list */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-400">Aucun programme</p>
            <p className="text-sm mt-1">
              {search ? 'Aucun résultat pour cette recherche' : 'Créez votre premier programme d\'entraînement'}
            </p>
            {!search && (
              <button
                onClick={() => setView('create')}
                className="mt-4 px-5 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
              >
                Créer un programme
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => {
            const clientName = getClientName(p.clientId);
            return (
              <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-colors group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{p.name}</h3>
                    {p.objective && <p className="text-sm text-slate-400 truncate mt-0.5">{p.objective}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditing(p); setView('edit'); }}
                      className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {clientName && (
                    <span className="flex items-center gap-1 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" />
                      {clientName}
                    </span>
                  )}
                  {!clientName && (
                    <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">Modèle</span>
                  )}
                  <span className="flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {p.durationWeeks} sem.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
                  <div className="text-center">
                    <p className="text-base font-bold text-white">{p.days.length}</p>
                    <p className="text-xs text-slate-500">Séances</p>
                  </div>
                  <div className="text-center border-x border-slate-800">
                    <p className="text-base font-bold text-white">{totalExercises(p)}</p>
                    <p className="text-xs text-slate-500">Exercices</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-slate-500">Créé le</p>
                  </div>
                </div>

                {p.notes && (
                  <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{p.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
