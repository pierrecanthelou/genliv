# Exigence — runtime de jeu extractible (et « Aperçu du jeu »)

> **Réécrit le 2026-10-08** — c'est le lot `.md` promis à la clôture de `moteur-fins` (open question #2, soldée). L'ancienne version décrivait le pipeline d'arbre `livre → AdventureDocument → runtime`, supprimé avec ses deux seuls lecteurs par `moteur-dossier` it4 (KR-240) ; elle est dans git.

## Ce qui est livré

Le CTA **« Aperçu du jeu »** de l'éditeur lance une partie réelle sur le dossier **en mémoire** — un clic, aucune sauvegarde ni export préalable. `RapportControles.jouable` en est la **porte**, re-vérifiée au montage du shell : précondition de correction de l'évaluateur bivalent, pas une ergonomie (KR-239). La reprise après rechargement et la relance à graine égale sont livrées par `moteur-fins` (`validerSession`, KR-304/305) ; la répétition synthétique sans IA par `dossier-repetition`. Le test n'écrit jamais dans le dossier : tout ce qui bouge vit dans l'état de session (décision n° 7).

## La contrainte qui reste contraignante

> **`src/player/` est un module autonome et extractible** — il n'importe ni les features ni les services de l'éditeur. La même unité de code sert l'« Aperçu du jeu » **et** toute surface future de distribution (autre webapp, application mobile).

- **Tenu par ESLint** : le bloc `src/player/**` de `.eslintrc.cjs` refuse tout import de feature (message `MSG_PLAYER_VERS_FEATURE`), dans les deux formes statique et dynamique.
- **La console et le journal de `play-mode` ne descendent jamais dans `src/player/`** : copié en entier à l'extraction, un outil de développeur voyagerait jusqu'au build mobile.
- **La session est un état d'appareil** (magasin brut, hors file de synchronisation) ; toute relecture passe par `validerSession`, jamais un `as EtatSession` (KR-116/305).

## Le bundle extractible

`src/player/` + les fonctions pures et types de `brain/` qu'il importe (characteristics, combat, xp, challenge, equipment, monsterCapacities, creatureTypes, types) + les modules purs de `brain/dossier/` (types, amorce, session, sessionDestinations, commandes, faits, evaluate, …) **plus leurs dépendances non facultatives** (`expr.ts`, `deltas.ts`, `curseurs.ts`, `destinations.ts`, `identifiers.ts` → `brain/utils/id.ts`, `predicates.ts`). `sessionDestinations.ts` voyage comme **contrat d'audience** de l'état de session, pas pour être exécuté.

Cette liste a été **mesurée au 2026-09-25** (balayage des spécificateurs d'import, n° 9 it3) ; depuis, le Temps 2 y a ajouté des modules (`alea.ts`, `sessionCombat.ts`, `fin.ts`, …). **Elle se re-mesure, elle ne se recopie pas** (KR-159) : le jour d'une extraction réelle, le relevé des imports fait foi, pas ce document.

**Point d'entrée du bundle : à définir** par le premier chantier d'extraction — l'`AdventureDocument` historique n'existe plus (KR-240) et aucune extraction n'a encore eu lieu.
