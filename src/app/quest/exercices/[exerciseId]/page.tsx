'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AppShell from '@/components/AppShell';
import ExerciseSheet from '@/components/quest/ExerciseSheet';
import { getAuth } from '@/lib/storage';
import { getAllSessions, getTrack } from '@/lib/quest/programs';
import { questRoutes } from '@/lib/quest/routes';

export default function QuestExercisePage() {
  const params = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAuth().isAuthenticated) { router.push('/'); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  // Parcours et séances types où l'exercice apparaît (une ligne par séance type).
  const usages = new Map<string, { trackId: string; title: string }>();
  for (const session of getAllSessions()) {
    if (session.exercises.some(e => e.exerciseId === params.exerciseId)) {
      usages.set(`${session.trackId}-${session.title}`, { trackId: session.trackId, title: session.title });
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-5">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="card-dark">
          <ExerciseSheet exerciseId={params.exerciseId} />
        </div>
        {usages.size > 0 && (
          <section className="card-dark">
            <h2 className="text-sm font-semibold text-white mb-2">Dans les parcours Quest</h2>
            <ul className="space-y-1.5">
              {Array.from(usages.values()).map(u => (
                <li key={`${u.trackId}-${u.title}`}>
                  <Link href={questRoutes.track(u.trackId)} className="text-sm text-orange-300 hover:text-orange-200">
                    {getTrack(u.trackId)?.name} · {u.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
