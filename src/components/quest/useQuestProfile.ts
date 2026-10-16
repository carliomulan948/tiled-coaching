'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/storage';
import { UserRole } from '@/lib/types';
import {
  DEFAULT_PREFERENCES, getLogsForProfile, getPreferences, QUEST_CHANGE_EVENT, savePreferences,
} from '@/lib/quest/storage';
import { QuestPreferences, QuestSessionLog } from '@/lib/quest/types';

export interface QuestProfile {
  id: string;
  name: string;
  role: UserRole | null;
}

// Profil actif = utilisateur connecté (connexion de démonstration). Le carnet et les préférences
// sont lus pour ce profil uniquement et rafraîchis à chaque modification.
export function useQuestProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<QuestProfile | null>(null);
  const [logs, setLogs] = useState<QuestSessionLog[]>([]);
  const [prefs, setPrefs] = useState<QuestPreferences>(DEFAULT_PREFERENCES);

  const load = useCallback((id: string) => {
    setLogs(getLogsForProfile(id));
    setPrefs(getPreferences(id));
  }, []);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/');
      return;
    }
    const current = { id: auth.user.id, name: auth.user.name, role: auth.role };
    setProfile(current);
    load(current.id);
    const onChange = () => load(current.id);
    window.addEventListener(QUEST_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(QUEST_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [router, load]);

  const updatePrefs = useCallback((patch: Partial<QuestPreferences>) => {
    if (!profile) return;
    setPrefs(savePreferences(profile.id, patch));
  }, [profile]);

  return { profile, logs, prefs, updatePrefs };
}
