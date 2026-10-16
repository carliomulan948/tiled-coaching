'use client';

import { CopyPlus, Replace } from 'lucide-react';
import { QuestSessionLog } from '@/lib/quest/types';
import { describeLog, formatDay, formatTime } from './format';

interface ConflictDialogProps {
  existing: QuestSessionLog;
  busy: boolean;
  onReplace: () => void;
  onAdd: () => void;
  onCancel: () => void;
}

// Affiché quand la même séance a déjà été notée le même jour pour ce profil.
export default function ConflictDialog({ existing, busy, onReplace, onAdd, onCancel }: ConflictDialogProps) {
  const info = describeLog(existing);
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
      <div className="modal-content p-5 max-w-md">
        <h2 id="conflict-title" className="text-lg font-bold text-white">Séance déjà notée aujourd’hui</h2>
        <p className="text-sm text-slate-300 mt-2">
          « {info.title} » figure déjà dans ton carnet le {formatDay(existing.date, true)} (enregistrée à {formatTime(existing.updatedAt)}) :
          {' '}{existing.setsDone}/{existing.setsPlanned} séries, {existing.status === 'complete' ? 'complète' : 'partielle'}.
        </p>
        <p className="text-sm text-slate-400 mt-2">Que veux-tu faire de cette nouvelle saisie ?</p>
        <div className="mt-5 grid gap-2">
          <button type="button" disabled={busy} onClick={onReplace} className="btn-quest justify-center disabled:opacity-60">
            <Replace className="w-4 h-4" /> Remplacer l’entrée existante
          </button>
          <button type="button" disabled={busy} onClick={onAdd} className="btn-secondary justify-center disabled:opacity-60">
            <CopyPlus className="w-4 h-4" /> Garder les deux (séance refaite)
          </button>
          <button type="button" disabled={busy} onClick={onCancel} className="text-sm text-slate-400 hover:text-white py-2">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
