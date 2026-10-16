import { HumorLevel } from './types';

// Ton de Squatty Quest. L'humour ne concerne que les encouragements et les transitions :
// les consignes techniques et les messages de sécurité restent neutres quel que soit le réglage.

export type HumorMoment =
  | 'welcome'
  | 'session_start'
  | 'set_done'
  | 'rest_start'
  | 'rest_end'
  | 'next_exercise'
  | 'session_complete'
  | 'session_partial'
  | 'empty_history'
  | 'badge';

export const HUMOR_LEVELS: { id: HumorLevel; label: string; description: string }[] = [
  { id: 'squatty', label: 'Squatty', description: 'Jeux de mots et blagues potaches, pets compris.' },
  { id: 'petite_dose', label: 'Petite dose', description: 'Quelques jeux de mots, sans blagues de pets.' },
  { id: 'sobre', label: 'Sobre', description: 'Messages neutres, sans humour.' },
];

export const DEFAULT_HUMOR: HumorLevel = 'squatty';

export const HUMOR_MESSAGES: Record<HumorMoment, Record<HumorLevel, string[]>> = {
  welcome: {
    squatty: [
      'Bienvenue dans Squatty Quest ! Tu as une tache ! Pistache ! Bon, maintenant, on s’échauffe.',
      'Salut l’aventure ! Ici, on squatte le salon, la salle et les tapis… pas le canapé.',
      'Te revoilà ! Le tapis t’attendait, il commençait à se sentir seul.',
    ],
    petite_dose: [
      'Bienvenue dans Squatty Quest ! Une séance à la fois, une aventure à ton rythme.',
      'Te revoilà ! On reprend l’aventure ?',
    ],
    sobre: [
      'Bienvenue dans Squatty Quest.',
      'Bon retour dans Squatty Quest.',
    ],
  },
  session_start: {
    squatty: [
      'C’est parti ! Le premier qui lâche un pet pendant le squat a gagné.',
      'Ta séance. Ton aventure. Et ton haltère ego, il est prêt ?',
      'On lace ses baskets, on gaine les abdos, et en route, mauvaise troupe !',
    ],
    petite_dose: [
      'C’est parti ! Ta séance, ton aventure.',
      'En route ! La technique d’abord, la vitesse ensuite.',
      'On y va ? Un squat après l’autre.',
    ],
    sobre: [
      'Début de la séance.',
      'Séance lancée. Commence par l’échauffement.',
    ],
  },
  set_done: {
    squatty: [
      'Série validée ! C’est squat-tastique.',
      'Et une de plus ! Fente-astique.',
      'Validé ! Si ça a fait « prout » à la descente, ça compte double. (Non.)',
      'Bien joué ! Tu as une tache ! Pistache ! Pardon, c’était plus fort que moi.',
      'Abdos-lument bien joué.',
    ],
    petite_dose: [
      'Série validée, bien joué !',
      'Et une de plus. C’est squat-tastique !',
      'Joli travail, on continue.',
    ],
    sobre: [
      'Série enregistrée.',
      'Série terminée.',
    ],
  },
  rest_start: {
    squatty: [
      'Pause ! Respire, bois une gorgée, et si un petit pet s’échappe, on accusera le tapis.',
      'Récup : le moment idéal pour chercher la tache. Pistache !',
      'Repos. Les muscles rechargent, les jeux de mots aussi.',
      'Souffle un bon coup. Par la bouche, de préférence.',
    ],
    petite_dose: [
      'Pause : respire et bois une gorgée.',
      'Récupération. Relâche les épaules.',
      'Petite pause, grande aventure.',
    ],
    sobre: [
      'Récupération.',
      'Temps de repos.',
    ],
  },
  rest_end: {
    squatty: [
      'Fin de la pause ! On se remet en selle… enfin, en squat.',
      'Repos terminé. Le canapé t’appelle ? Laisse sonner.',
      'Allez, on y retourne avant que le tapis s’endorme.',
    ],
    petite_dose: [
      'On reprend !',
      'Fin de la pause, à toi de jouer.',
      'C’est reparti pour une série.',
    ],
    sobre: [
      'Fin du repos.',
      'Série suivante.',
    ],
  },
  next_exercise: {
    squatty: [
      'Exercice suivant ! On change de décor, pas d’ambiance.',
      'Nouveau défi en vue. Qui pète le plus haut ? Euh… qui pousse le mieux.',
      'La quête continue : prochaine étape !',
    ],
    petite_dose: [
      'Exercice suivant !',
      'On change d’exercice, même énergie.',
      'Nouvelle étape de la quête.',
    ],
    sobre: [
      'Exercice suivant.',
      'Passage à l’exercice suivant.',
    ],
  },
  session_complete: {
    squatty: [
      'Séance bouclée ! Personne n’a pété plus haut que son squat. Bravo !',
      'Quête accomplie ! Tu peux ranger le tapis. Ta fierté, garde-la.',
      'Fini ! C’était squat-tastique, et c’est toi qui l’as fait.',
    ],
    petite_dose: [
      'Séance terminée, bravo !',
      'Quête du jour accomplie. Fente-astique !',
      'Bien joué, la séance est dans la boîte.',
    ],
    sobre: [
      'Séance terminée.',
      'Séance complète enregistrée.',
    ],
  },
  session_partial: {
    squatty: [
      'Séance partielle enregistrée ! Même un demi-squat reste un squat.',
      'Partie remise ! Ton carnet garde ta place au chaud.',
      'On s’arrête là pour aujourd’hui : chaque série compte, la suite au prochain épisode.',
    ],
    petite_dose: [
      'Séance partielle enregistrée. Chaque série compte.',
      'Tu pourras reprendre la suite quand tu voudras.',
    ],
    sobre: [
      'Séance partielle enregistrée.',
      'Séance enregistrée comme partielle.',
    ],
  },
  empty_history: {
    squatty: [
      'Ton carnet est aussi vide qu’un frigo un dimanche soir. On le remplit ?',
      'Aucune séance pour l’instant. Le tapis ne va pas se dérouler tout seul.',
    ],
    petite_dose: [
      'Aucune séance enregistrée pour l’instant. La première t’attend !',
      'Ton carnet est prêt à accueillir ta première séance.',
    ],
    sobre: [
      'Aucune séance enregistrée.',
    ],
  },
  badge: {
    squatty: [
      'Nouvel écusson ! Accroche-le fièrement, pas besoin de clou.',
      'Écusson débloqué ! Et ça, ce n’est pas du vent.',
    ],
    petite_dose: [
      'Nouvel écusson débloqué !',
      'Bravo, un écusson de plus dans ta collection.',
    ],
    sobre: [
      'Écusson débloqué.',
    ],
  },
};

export function getHumorMessage(moment: HumorMoment, level: HumorLevel, seed = 0): string {
  const list = HUMOR_MESSAGES[moment][level] ?? HUMOR_MESSAGES[moment].sobre;
  const index = Math.abs(Math.trunc(seed)) % list.length;
  return list[index];
}

// ─── Messages de sécurité : jamais d'humour, quel que soit le réglage ───────

export const SAFETY_MESSAGES = {
  painTitle: 'Douleur signalée',
  pain:
    'Arrête l’exercice en cours. Une douleur vive, articulaire ou inhabituelle n’est pas normale. ' +
    'Ne force pas : passe à l’exercice suivant seulement si tu te sens bien, sinon termine la séance. ' +
    'Si la douleur persiste, consulte un professionnel de santé.',
  emergency:
    'Douleur dans la poitrine, malaise ou essoufflement anormal : arrête-toi immédiatement et appelle le 15 ou le 112.',
  painLogged: 'Douleur notée dans le carnet. Pense à en parler à ton coach ou à un professionnel de santé.',
} as const;
