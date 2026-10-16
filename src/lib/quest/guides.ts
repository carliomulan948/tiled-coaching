import { ExerciseGuide } from './types';

// Fiches techniques des exercices utilisés dans les parcours Quest.
// Ton volontairement neutre : l'humour n'intervient jamais dans les consignes.

export const EXERCISE_GUIDES: ExerciseGuide[] = [
  // ── Poids du corps ─────────────────────────────────────────────────────────
  {
    exerciseId: 'bw-08',
    cues: [
      'Pieds à largeur de hanches ou un peu plus, pointes légèrement ouvertes.',
      'Descends en poussant les fesses vers l’arrière, comme pour t’asseoir.',
      'Genoux dans l’axe des pieds, talons au sol pendant tout le mouvement.',
      'Remonte en poussant dans le sol, buste droit.',
    ],
    mistakes: [
      'Genoux qui rentrent vers l’intérieur.',
      'Talons qui décollent en bas du mouvement.',
      'Dos qui s’arrondit pour descendre plus bas.',
    ],
    easier: { label: 'Squat sur chaise : s’asseoir puis se relever' },
    harder: { label: 'Squat goblet avec un haltère', exerciseId: 'db-15' },
  },
  {
    exerciseId: 'bw-13',
    cues: [
      'Sur le dos, pieds à plat à largeur de hanches, talons proches des fesses.',
      'Pousse dans les talons pour monter le bassin.',
      'En haut, épaules, hanches et genoux alignés : serre les fessiers 1 à 2 s.',
      'Redescends lentement.',
    ],
    mistakes: [
      'Cambrer le bas du dos au lieu de monter avec les fessiers.',
      'Pousser sur la pointe des pieds.',
      'Laisser les genoux s’écarter ou se resserrer.',
    ],
    easier: { label: 'Amplitude réduite avec pause de 2 s en haut' },
    harder: { label: 'Hip thrust, dos sur un banc', exerciseId: 'bw-14' },
  },
  {
    exerciseId: 'bw-11',
    cues: [
      'Debout, pieds à largeur de hanches, recule un pied d’un grand pas.',
      'Descends à la verticale : le genou arrière va vers le sol sans le toucher brutalement.',
      'Genou avant au-dessus de la cheville, dans l’axe du pied.',
      'Pousse dans le talon avant pour revenir.',
    ],
    mistakes: [
      'Pas trop court : le genou avant part loin devant.',
      'Buste qui bascule fortement vers l’avant.',
      'Pieds alignés comme sur une corde : l’équilibre devient difficile.',
    ],
    easier: { label: 'Fente arrière avec une main en appui sur un mur ou une chaise' },
    harder: { label: 'Split squat bulgare', exerciseId: 'bw-34' },
  },
  {
    exerciseId: 'bw-22',
    cues: [
      'Debout, pieds à largeur de hanches, une main sur un mur pour l’équilibre.',
      'Monte sur la pointe des pieds le plus haut possible.',
      'Marque 1 s en haut, puis redescends lentement.',
    ],
    mistakes: [
      'Mouvement rapide et rebondi.',
      'Chevilles qui roulent vers l’extérieur.',
    ],
    easier: { label: 'Amplitude partielle, deux mains au mur' },
    harder: { label: 'Sur une marche, talons dans le vide, ou sur une seule jambe' },
  },
  {
    exerciseId: 'bw-16',
    cues: [
      'Avant-bras au sol, coudes sous les épaules.',
      'Corps aligné de la tête aux talons : serre les fessiers et les abdos.',
      'Regard vers le sol, respiration calme et régulière.',
    ],
    mistakes: [
      'Hanches qui s’affaissent et bas du dos qui se creuse.',
      'Fesses trop hautes.',
      'Bloquer sa respiration.',
    ],
    easier: { label: 'Planche sur les genoux' },
    harder: { label: 'Planche en levant un pied à la fois' },
  },
  {
    exerciseId: 'bw-05',
    cues: [
      'Mains sur un support stable, un peu plus écartées que les épaules.',
      'Corps gainé en ligne droite des épaules aux talons.',
      'Descends la poitrine vers le support, coudes à environ 45° du buste.',
      'Repousse sans perdre le gainage.',
    ],
    mistakes: [
      'Hanches qui tombent ou fesses en l’air.',
      'Coudes écartés à 90° du corps.',
      'Support instable qui glisse.',
    ],
    easier: { label: 'Pompes contre un mur' },
    harder: { label: 'Pompes classiques au sol', exerciseId: 'bw-01' },
  },
  {
    exerciseId: 'bw-21',
    cues: [
      'À plat ventre, bras tendus devant, regard vers le sol.',
      'Décolle bras et jambes de quelques centimètres en serrant les fessiers.',
      'Tiens 1 à 2 s, puis redescends en contrôle.',
    ],
    mistakes: [
      'Relever la tête et tirer sur la nuque.',
      'Chercher à monter le plus haut possible en cambrant fort.',
    ],
    easier: { label: 'Lever bras et jambe opposés en alternance' },
    harder: { label: 'Tenue de 3 s en haut, bras en W' },
  },
  {
    exerciseId: 'bw-15',
    cues: [
      'Mains sur le bord d’une chaise stable calée contre un mur, doigts vers l’avant.',
      'Fesses proches de la chaise, genoux fléchis.',
      'Descends en pliant les coudes vers l’arrière, jusqu’à 90° environ.',
      'Remonte en poussant dans les paumes.',
    ],
    mistakes: [
      'Descendre trop bas et tirer sur l’avant des épaules.',
      'Coudes qui s’ouvrent sur les côtés.',
      'Utiliser une chaise qui peut glisser ou basculer.',
    ],
    easier: { label: 'Amplitude réduite, pieds plus proches de la chaise' },
    harder: { label: 'Jambes tendues devant toi' },
    safety: 'Si l’avant de l’épaule tire ou fait mal, réduis l’amplitude ou remplace par des pompes inclinées.',
  },
  {
    exerciseId: 'bw-17',
    cues: [
      'Sur le côté, coude sous l’épaule, jambes l’une sur l’autre ou décalées.',
      'Soulève les hanches pour former une ligne droite.',
      'Garde le bassin face à l’avant, sans basculer.',
    ],
    mistakes: [
      'Hanches qui descendent.',
      'Épaule qui s’affaisse : pousse le sol avec l’avant-bras.',
    ],
    easier: { label: 'Planche latérale, genou du dessous au sol' },
    harder: { label: 'Planche latérale en levant la jambe du dessus' },
  },
  {
    exerciseId: 'bw-18',
    cues: [
      'Sur le dos, genoux fléchis, pieds au sol.',
      'Mains sur les tempes ou croisées sur la poitrine.',
      'Enroule le haut du dos en rapprochant les côtes du bassin.',
      'Expire en montant, redescends lentement.',
    ],
    mistakes: [
      'Tirer sur la nuque avec les mains.',
      'Monter grâce à l’élan.',
      'Décoller le bas du dos du sol.',
    ],
    easier: { label: 'Petite amplitude, mains qui glissent sur les cuisses' },
    harder: { label: 'Hollow body hold', exerciseId: 'bw-38' },
  },
  {
    exerciseId: 'bw-32',
    cues: [
      'Dos plaqué au mur, descends jusqu’à ce que les genoux approchent 90°.',
      'Genoux au-dessus des chevilles, pieds à largeur de hanches.',
      'Poids dans les talons, bras relâchés.',
    ],
    mistakes: [
      'Genoux qui dépassent largement les pieds.',
      'Mains qui poussent sur les cuisses.',
    ],
    easier: { label: 'Descendre moins bas, angle plus ouvert' },
    harder: { label: 'Tenue plus longue, ou un poids posé sur les cuisses' },
  },
  {
    exerciseId: 'bw-20',
    cues: [
      'Position de pompe, mains sous les épaules.',
      'Ramène un genou vers la poitrine, puis alterne.',
      'Hanches basses et stables.',
    ],
    mistakes: [
      'Fesses en l’air.',
      'Mains trop en avant des épaules.',
      'Aller trop vite au détriment du contrôle.',
    ],
    easier: { label: 'Version lente, mains sur un support surélevé' },
    harder: { label: 'Rythme plus soutenu, ou burpees', exerciseId: 'bw-24' },
  },
  {
    exerciseId: 'bw-41',
    cues: [
      'Debout, penche-toi et pose les mains au sol, genoux fléchis si besoin.',
      'Avance les mains jusqu’à la position de planche.',
      'Reviens en marchant avec les mains, puis redresse-toi.',
    ],
    mistakes: [
      'Hanches qui s’affaissent en position de planche.',
      'Forcer pour garder les jambes tendues.',
    ],
    easier: { label: 'Genoux bien fléchis, avancer moins loin' },
    harder: { label: 'Ajouter une pompe en position de planche' },
  },

  // ── Cardio ─────────────────────────────────────────────────────────────────
  {
    exerciseId: 'card-01',
    cues: [
      'Saute en écartant pieds et bras, puis reviens pieds joints.',
      'Atterris sur l’avant du pied, genoux souples.',
      'Garde un rythme régulier et une respiration fluide.',
    ],
    mistakes: [
      'Atterrir jambes tendues sur les talons.',
      'Partir trop vite et s’épuiser en dix secondes.',
    ],
    easier: { label: 'Sans saut : un pied puis l’autre sur le côté' },
    harder: { label: 'Montées de genoux', exerciseId: 'card-02' },
  },
  {
    exerciseId: 'card-06',
    cues: [
      'Poussée dans l’ordre : jambes, puis buste, puis bras.',
      'Retour dans l’ordre inverse : bras, buste, jambes.',
      'Dos droit, épaules relâchées.',
    ],
    mistakes: [
      'Tirer avec les bras avant d’avoir poussé avec les jambes.',
      'Dos arrondi.',
      'Allure trop rapide dès le départ.',
    ],
    easier: { label: 'Vélo stationnaire', exerciseId: 'card-07' },
    harder: { label: 'Intervalles : 30 s plus rapides, 30 s faciles' },
  },

  // ── Haltères ───────────────────────────────────────────────────────────────
  {
    exerciseId: 'db-15',
    cues: [
      'Tiens un haltère à la verticale contre la poitrine, coudes vers le bas.',
      'Pieds un peu plus écartés que les hanches.',
      'Descends entre tes jambes, buste droit, coudes à l’intérieur des genoux.',
      'Remonte en poussant dans tout le pied.',
    ],
    mistakes: [
      'Haltère qui s’éloigne de la poitrine.',
      'Talons qui décollent.',
      'Genoux qui rentrent vers l’intérieur.',
    ],
    easier: { label: 'Squat poids du corps', exerciseId: 'bw-08' },
    harder: { label: 'Haltère plus lourd ou pause de 2 s en bas' },
  },
  {
    exerciseId: 'db-17',
    cues: [
      'Debout, haltères devant les cuisses, genoux légèrement fléchis.',
      'Pousse les hanches vers l’arrière en gardant le dos plat.',
      'Les haltères glissent le long des jambes jusqu’à mi-tibia environ.',
      'Remonte en serrant les fessiers.',
    ],
    mistakes: [
      'Dos qui s’arrondit.',
      'Plier les genoux comme pour un squat.',
      'Haltères qui s’éloignent du corps.',
    ],
    easier: { label: 'Charnière de hanche à vide, mains sur les hanches' },
    harder: { label: 'Soulevé de terre roumain à la barre', exerciseId: 'bar-12' },
    safety: 'Descends seulement tant que ton dos reste plat.',
  },
  {
    exerciseId: 'db-16',
    cues: [
      'Haut du dos contre un banc stable, haltère tenu à deux mains sur les hanches.',
      'Pieds à plat, tibias verticaux en haut du mouvement.',
      'Pousse dans les talons jusqu’à l’alignement épaules-genoux.',
      'Menton rentré, regard vers l’avant.',
    ],
    mistakes: [
      'Cambrer le bas du dos en haut.',
      'Pieds trop loin ou trop près des fesses.',
      'Banc qui glisse.',
    ],
    easier: { label: 'Pont fessier au sol', exerciseId: 'bw-13' },
    harder: { label: 'Hip thrust à la barre', exerciseId: 'bar-16' },
  },
  {
    exerciseId: 'db-01',
    cues: [
      'Allongé, omoplates serrées, pieds bien au sol.',
      'Haltères au-dessus de la poitrine, poignets droits.',
      'Descends en contrôle, coudes à environ 45° du buste.',
      'Pousse vers le haut en rapprochant légèrement les haltères.',
    ],
    mistakes: [
      'Coudes écartés à 90°.',
      'Rebondir en bas du mouvement.',
      'Fesses qui décollent du banc.',
    ],
    easier: { label: 'Floor press : au sol, le sol limite l’amplitude' },
    harder: { label: 'Développé incliné haltères', exerciseId: 'db-03' },
  },
  {
    exerciseId: 'db-05',
    cues: [
      'Une main et un genou sur le banc, dos plat parallèle au sol.',
      'Tire l’haltère vers la hanche, coude près du corps.',
      'Serre l’omoplate en haut, puis redescends lentement.',
    ],
    mistakes: [
      'Tourner le buste pour soulever plus lourd.',
      'Dos rond.',
      'Tirer vers l’épaule avec le biceps.',
    ],
    easier: { label: 'Charge plus légère avec 1 s de pause en haut' },
    harder: { label: 'Rowing barre en pronation', exerciseId: 'bar-17' },
  },
  {
    exerciseId: 'db-11',
    cues: [
      'Assis ou debout, haltères à hauteur d’épaules, paumes vers l’avant.',
      'Abdos et fessiers serrés pour ne pas cambrer.',
      'Pousse jusqu’à avoir les bras presque tendus, puis redescends en contrôle.',
    ],
    mistakes: [
      'Cambrer fortement le bas du dos.',
      'Laisser les coudes partir loin derrière.',
      'Verrouiller brutalement les coudes en haut.',
    ],
    easier: { label: 'Assis avec dossier, charge légère' },
    harder: { label: 'Arnold press', exerciseId: 'db-25' },
  },
  {
    exerciseId: 'db-06',
    cues: [
      'Debout, bras le long du corps, paumes vers l’avant.',
      'Plie les coudes sans les avancer.',
      'Redescends lentement jusqu’aux bras tendus.',
    ],
    mistakes: [
      'Balancer le buste pour monter la charge.',
      'Coudes qui avancent.',
      'Descente trop rapide.',
    ],
    easier: { label: 'Curl alterné, charge plus légère' },
    harder: { label: 'Descente lente en 3 secondes' },
  },
  {
    exerciseId: 'db-10',
    cues: [
      'Buste penché, dos plat, coude collé au corps et plié à 90°.',
      'Tends le bras vers l’arrière en gardant le coude fixe.',
      'Marque 1 s bras tendu, puis reviens lentement.',
    ],
    mistakes: [
      'Coude qui monte et descend.',
      'Balancer l’haltère.',
      'Dos arrondi.',
    ],
    easier: { label: 'Un bras à la fois, main libre en appui sur un banc' },
    harder: { label: 'Extension triceps couché', exerciseId: 'db-09' },
  },
  {
    exerciseId: 'db-12',
    cues: [
      'Debout, haltères légers le long du corps, coudes légèrement fléchis.',
      'Monte les bras sur les côtés jusqu’à hauteur d’épaules.',
      'Redescends lentement.',
    ],
    mistakes: [
      'Hausser les épaules vers les oreilles.',
      'Prendre trop lourd et compenser avec le buste.',
      'Monter au-dessus de la ligne des épaules.',
    ],
    easier: { label: 'Un bras à la fois, charge plus légère' },
    harder: { label: 'Élévation latérale à la poulie', exerciseId: 'pou-10' },
  },

  // ── Machines et poulies ────────────────────────────────────────────────────
  {
    exerciseId: 'mach-01',
    cues: [
      'Dos et bassin plaqués contre le dossier.',
      'Pieds à largeur de hanches, au milieu de la plateforme.',
      'Descends jusqu’à environ 90° aux genoux sans décoller le bassin.',
      'Pousse sans verrouiller les genoux en haut.',
    ],
    mistakes: [
      'Bassin qui décolle en bas et dos qui s’arrondit.',
      'Genoux verrouillés en extension.',
      'Genoux qui rentrent vers l’intérieur.',
    ],
    easier: { label: 'Amplitude réduite, charge plus légère' },
    harder: { label: 'Hack squat machine', exerciseId: 'mach-02' },
    safety: 'Vérifie les sécurités de la machine avant et après chaque série.',
  },
  {
    exerciseId: 'mach-04',
    cues: [
      'Règle le dossier pour aligner le genou avec l’axe de la machine.',
      'Boudin au-dessus des talons, cuisses bloquées.',
      'Fléchis les genoux, marque 1 s, puis remonte lentement.',
    ],
    mistakes: [
      'Décoller les cuisses du siège.',
      'Laisser la charge remonter brutalement.',
    ],
    easier: { label: 'Charge plus légère, amplitude complète' },
    harder: { label: 'Leg curl debout, une jambe à la fois', exerciseId: 'mach-05' },
  },
  {
    exerciseId: 'mach-07',
    cues: [
      'Dos contre le support, boudin ou ceinture sur les hanches.',
      'Pieds à plat, poussée dans les talons.',
      'Monte jusqu’à l’alignement épaules-genoux et serre les fessiers 1 s.',
    ],
    mistakes: [
      'Cambrer le bas du dos en haut.',
      'Pousser avec la pointe des pieds.',
    ],
    easier: { label: 'Pont fessier au sol', exerciseId: 'bw-13' },
    harder: { label: 'Hip thrust à la barre', exerciseId: 'bar-16' },
  },
  {
    exerciseId: 'mach-06',
    cues: [
      'Genou aligné avec l’axe de rotation de la machine.',
      'Boudin sur le bas du tibia.',
      'Tends les jambes sans à-coup, puis redescends lentement.',
    ],
    mistakes: [
      'Donner de l’élan.',
      'Siège mal réglé : genou décalé de l’axe.',
    ],
    easier: { label: 'Amplitude partielle, charge légère' },
    harder: { label: 'Tempo lent : 3 s pour redescendre' },
    safety: 'Si le genou devient douloureux, réduis l’amplitude ou la charge.',
  },
  {
    exerciseId: 'mach-11',
    cues: [
      'Épaules sous les appuis, avant des pieds sur la marche.',
      'Descends les talons en contrôle, puis monte au maximum.',
      'Pause de 1 s en haut.',
    ],
    mistakes: [
      'Rebondir en bas.',
      'Plier les genoux pour pousser.',
    ],
    easier: { label: 'Élévation des mollets au poids du corps', exerciseId: 'bw-22' },
    harder: { label: 'Pause de 2 s en haut et en bas' },
  },
  {
    exerciseId: 'mach-15',
    cues: [
      'Règle le siège : poignées à hauteur de poitrine.',
      'Omoplates serrées contre le dossier.',
      'Pousse sans verrouiller les coudes, reviens lentement.',
    ],
    mistakes: [
      'Épaules qui avancent en fin de poussée.',
      'Siège trop bas ou trop haut.',
    ],
    easier: { label: 'Pompes inclinées', exerciseId: 'bw-05' },
    harder: { label: 'Développé couché haltères', exerciseId: 'db-01' },
  },
  {
    exerciseId: 'mach-16',
    cues: [
      'Règle le siège : poignées au niveau du haut de la poitrine.',
      'Omoplates serrées, pieds au sol.',
      'Pousse vers le haut et vers l’avant, retour lent.',
    ],
    mistakes: [
      'Épaules qui avancent.',
      'Coudes trop écartés.',
    ],
    easier: { label: 'Chest press horizontal', exerciseId: 'mach-15' },
    harder: { label: 'Développé incliné haltères', exerciseId: 'db-03' },
  },
  {
    exerciseId: 'mach-18',
    cues: [
      'Cuisses bloquées sous les boudins, buste légèrement incliné vers l’arrière.',
      'Prise un peu plus large que les épaules.',
      'Tire la barre vers le haut de la poitrine en abaissant les coudes.',
      'Remonte lentement jusqu’aux bras presque tendus.',
    ],
    mistakes: [
      'Tirer derrière la nuque.',
      'Se balancer en arrière pour tirer.',
      'Hausser les épaules.',
    ],
    easier: { label: 'Tirage prise neutre, charge légère', exerciseId: 'mach-19' },
    harder: { label: 'Traction assistée', exerciseId: 'mach-29' },
  },
  {
    exerciseId: 'mach-22',
    cues: [
      'Assis, pieds sur les cales, genoux légèrement fléchis.',
      'Dos droit, tire la poignée vers le nombril.',
      'Serre les omoplates, puis laisse revenir en contrôle.',
    ],
    mistakes: [
      'Se balancer d’avant en arrière.',
      'Dos qui s’arrondit au retour.',
      'Épaules qui montent.',
    ],
    easier: { label: 'Charge plus légère avec 1 s de pause' },
    harder: { label: 'Rowing câble à un bras', exerciseId: 'pou-12' },
  },
  {
    exerciseId: 'mach-23',
    cues: [
      'Poitrine contre l’appui, poignées à bout de bras.',
      'Tire les coudes vers l’arrière en serrant les omoplates.',
      'Reviens lentement, bras tendus.',
    ],
    mistakes: [
      'Décoller la poitrine de l’appui.',
      'Hausser les épaules.',
    ],
    easier: { label: 'Charge plus légère' },
    harder: { label: 'Rowing haltère', exerciseId: 'db-05' },
  },
  {
    exerciseId: 'mach-25',
    cues: [
      'Siège réglé : poignées à hauteur d’épaules.',
      'Dos plaqué, abdos serrés.',
      'Pousse vers le haut sans verrouiller, redescends jusqu’aux épaules.',
    ],
    mistakes: [
      'Cambrer pour pousser.',
      'Descendre trop bas en forçant sur les épaules.',
    ],
    easier: { label: 'Charge légère, amplitude contrôlée' },
    harder: { label: 'Développé militaire haltères', exerciseId: 'db-11' },
  },
  {
    exerciseId: 'mach-13',
    cues: [
      'Règle l’appui pour que le bassin dépasse et que les hanches puissent plier.',
      'Descends le buste, dos plat, en pliant les hanches.',
      'Remonte jusqu’à l’alignement du corps, sans cambrer au-delà.',
    ],
    mistakes: [
      'Cambrer fortement en haut.',
      'Monter par à-coups.',
      'Arrondir le dos en bas.',
    ],
    easier: { label: 'Superman au sol', exerciseId: 'bw-21' },
    harder: { label: 'Tenir un disque contre la poitrine' },
  },
  {
    exerciseId: 'pou-09',
    cues: [
      'Poulie à hauteur du visage, corde en main, pouces vers l’arrière.',
      'Tire la corde vers le visage en écartant les mains, coudes hauts.',
      'Serre l’arrière des épaules, puis reviens lentement.',
    ],
    mistakes: [
      'Tirer vers le cou ou le ventre.',
      'Se pencher en arrière.',
      'Charge trop lourde.',
    ],
    easier: { label: 'Élastique fixé à hauteur du visage' },
    harder: { label: 'Oiseau aux haltères', exerciseId: 'db-14' },
  },
];

export const GENERAL_SAFETY =
  'Une douleur vive, articulaire ou inhabituelle n’est pas normale : arrête l’exercice. Si elle persiste, consulte un professionnel de santé.';

export function getGuide(exerciseId: string): ExerciseGuide | undefined {
  return EXERCISE_GUIDES.find(g => g.exerciseId === exerciseId);
}
