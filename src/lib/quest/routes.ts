// Chemins des pages Squatty Quest, partagés par le menu, le tableau de bord et les tests.
export const questRoutes = {
  home: '/quest',
  carnet: '/quest/carnet',
  track: (trackId: string) => `/quest/parcours/${trackId}`,
  session: (sessionId: string) => `/quest/seance/${sessionId}`,
  resume: (sessionId: string, logId: string) => `/quest/seance/${sessionId}?reprendre=${encodeURIComponent(logId)}`,
  exercise: (exerciseId: string) => `/quest/exercices/${exerciseId}`,
} as const;
