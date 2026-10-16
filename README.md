# SQUATTY — Ta séance. Ton aventure.

Application de coaching en deux espaces reliés :

- **Squatty Pro** : l’espace professionnel existant (clients, programmes personnalisés, planning, factures, paiements, progression, messages, bibliothèque d’exercices tous niveaux, boutique).
- **Squatty Quest** : l’espace sportif, avec trois parcours de démarrage sur 4 semaines (maison, haltères, salle), des séances guidées avec minuteurs, des fiches d’exercices, un carnet de séances complètes ou partielles, des missions, des écussons et des XP.

## Lancer l’application

Prérequis : Node.js 18 ou plus récent.

```bash
npm ci          # installe les dépendances
npm run dev     # mode développement : http://localhost:3000
```

Version de production :

```bash
npm run build
npm start       # http://localhost:3000
```

Sur l’écran de connexion, choisissez un rôle (Administrateur, Coach ou Client). Squatty Quest est accessible depuis le menu (section « Squatty Quest ») et depuis la carte Quest du tableau de bord.

## Tests

```bash
npm test                         # tests unitaires (Vitest) : carnet, doublons, profils, progression, humour, minuteur, contenus
npm run build && npm run test:e2e   # tests navigateur (Playwright), format téléphone et ordinateur
```

Pour les tests navigateur sur une nouvelle machine, installez d’abord Chromium : `npx playwright install chromium`.

## Ce qu’il faut savoir

- **Mode démonstration** : la connexion est simulée (pas de mot de passe ni de serveur). Toutes les données, y compris le carnet Quest, sont stockées dans le `localStorage` du navigateur : elles ne sont ni sauvegardées en ligne ni partagées entre appareils.
- **Profils séparés** : l’historique et les préférences Quest sont rattachés à l’utilisateur connecté (profil actif).
- **Parcours génériques ≠ programmes du coach** : les parcours Quest sont des parcours de démarrage communs à tous. Les programmes personnalisés créés dans Squatty Pro restent distincts ; il n’existe aucune synchronisation entre les deux.
- **XP** : les XP récompensent la régularité dans l’application. Ce n’est pas une mesure de condition physique.
- **Humour** : trois réglages par profil (Squatty, Petite dose, Sobre). Les consignes techniques et les messages liés à la douleur restent toujours neutres.

## Organisation du code Quest

| Emplacement | Rôle |
| --- | --- |
| `src/lib/brand.ts` | Identité SQUATTY (noms des espaces, signature, surnom). |
| `src/lib/quest/programs.ts` | Les 3 parcours × 4 semaines × 3 séances, générés à partir de séances types. |
| `src/lib/quest/guides.ts` | Fiches : consignes, erreurs fréquentes, variantes. |
| `src/lib/quest/humor.ts` | Messages par réglage d’humour et messages de sécurité. |
| `src/lib/quest/storage.ts` | Carnet, anti-doublons, préférences et séance en cours, par profil. |
| `src/lib/quest/progress.ts` | Progression, XP, niveaux, écussons, missions, résumé du tableau de bord. |
| `src/app/quest/…` | Pages : aventure, parcours, séance guidée, carnet, fiche d’exercice. |
