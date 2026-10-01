# Revue — `moteur-arbitre` · itération 1

> Plan : `.claude/raffinage/moteur-arbitre-it1.plan.md` (validé le 2026-10-01)
> Essaim : 2 lots séquentiels (`contrat-heros-alea` puis `feature-ecrans-heros`), sans worktree
> QA mode B : **CONFORME**

## En une ligne

L'auteur peut désormais créer son héros à l'ouverture d'une partie (8 caractéristiques réparties par un geste à deux temps, bonus 1D4, une relance), le voir vivre dans un bandeau permanent (nom/PV/PE/XP), et observer son PE remonter de 5 chaque fois qu'il se déplace réellement vers un autre lieu — sans qu'aucun jet ni aucune IA n'entrent en jeu.

## Critères (plan § 6)

| # | Critère | Niveau | Résultat | Preuve |
|---|---|---|---|---|
| 1 | Écran de création sans héros → montage, valider écrit `EtatSession.heros` | composant | **VÉRIFIÉ** | `EcranPartie.test.tsx` — garde 7 |
| 2 | `fixerHeros(session,H)` écrit exactement H | contrat | **VÉRIFIÉ** | `session.test.ts` |
| 3 | Zéro `Math.random`, du montage à la validation | composant | **VÉRIFIÉ** | `EcranCreationHeros.test.tsx` — `jest.spyOn(Math,'random')` à 0 appel |
| 4 | `creerRng(graine,'heros',1)` ≠ indice 0 sur graine épinglée | unitaire | **VÉRIFIÉ** | `alea.test.ts` + test de relance |
| 5 | Bandeau neutre, zéro `--good`/`--bad` | composant | **VÉRIFIÉ** | `BandeauHeros.test.tsx` |
| 6 | A4 : +5 PE plafonné sur changement réel de lieu ; inchangé sinon ; clé absente sans héros | contrat | **VÉRIFIÉ** | `commandes.test.ts` — 5 scénarios |
| 7 | R1/R3 invariants avec/sans héros | contrat | **VÉRIFIÉ** | `contexte.test.ts` — invariance, sentinelle non-défaut |
| 8 | 10 racines de session, 6 dispenses déclarées, zéro ligne morte | contrat | **VÉRIFIÉ** | `sessionCouverture.test.ts` |

## Diff par lot

**Lot A — `contrat-heros-alea`** (`dev-contrat`, seul, en premier) — 11 fichiers `src/brain/**` : `alea.ts`/`alea.test.ts` (N), `session.ts`/`session.test.ts`, `sessionDestinations.ts`, `__fixtures__/session-saturee.ts`, `sessionCouverture.test.ts`, `commandes.ts`/`commandes.test.ts`, `copilote/contexte.test.ts`, `index.ts` (R).

**Lot B — `feature-ecrans-heros`** (`dev-lot`) — fichiers déclarés : `BandeauHeros.tsx`/`.test.tsx`, `EcranCreationHeros.tsx`/`.test.tsx` (N), `CadrePartie.tsx`, `EcranPartie.tsx`/`.test.tsx` (R/N). Périmètre élargi en cours de lot, explicitement autorisé par l'orchestrateur (régression directe de la GARDE 7) : helper partagé `src/features/play-mode/tests/creerHerosDeTest.ts` (N) + correction minimale de 5 fichiers de test préexistants (`deplacement`, `jalonAuJournal`, `ouvertureVerbatim`, `verrouDeTour`, `porteJouable` — un `await terminerCreationHeros(user)` inséré, aucune assertion d'origine modifiée).

Aucun fichier hors de ces deux listes. Aucun chevauchement entre lots.

## Ce qui a été refusé (REJETÉ, plan § 8 — déjà repris dans `specification.json`)

- Signature d'aléa `fluxAlea` (fonction unique) au lieu de `alea`+`creerRng` : aucune base dans le cadrage, aurait réécrit les contrats sans bénéfice.
- A4 inconditionnel (sans condition de changement réel de lieu) : ouvrait une potion infinie sur tout lieu auto-référent.
- Couleurs sémantiques (`--good`/`--bad`) sur le bandeau en it1 : contredisait le contrat retenu — zéro jet en it1, donc zéro condition de déclenchement.
- Réutilisation verbatim de `HeroStatusBar.tsx`/`CharacterCreationScreen.tsx` (`src/player/`) : tutoiement + type `HeroState` concurrent.

## Ce qui a été reporté

- A4 invisible à l'écran en it1 (PE toujours pleins, rien ne les consomme) — propriété acceptée du squelette.
- Absence de reprise de session (`useSessionPersistee` write-only) : un rechargement contourne la relance unique — hors périmètre it1, propriétaire futur = l'itération de reprise de session.
- Jet et toute IA d'arbitrage (R2/R3), calcul d'XP : it2/it3, comme planifié.

## Écarts assumés — trouvés en cours de lot, corrigés avant acceptation

1. **GARDE 7 cassait 5 tests préexistants** montant `EcranPartie` directement (`useSessionPersistee` est write-only, chaque montage ouvre une session neuve). Corrigé dans le même lot par un helper partagé. **BUG-135 / KR-276.**
2. **`EcranCreationHeros` livré une première fois avec une auto-assignation séquentielle des dés** (un seul clic), contredisant son propre texte d'instruction et le contrat de design (trois états visuels dé dispo/sélectionné/assigné). Trouvé en vérification indépendante, corrigé en geste à deux temps réel avant acceptation.
3. **Boucle de distribution du bonus ne cliquait que le premier bouton `+`**, bloquant silencieusement le test sur certains tirages aléatoires (l'écran réel appelle le vrai `Math.random` via `tirerGraine()`). Trouvé en re-vérifiant la suite complète plusieurs fois après un premier rapport d'agent affirmant à tort la stabilité. **BUG-136 / KR-277.**

Aucun blocage non résolu.

## Porte qualité

- Prettier / `tsc --noEmit` / `npm run lint` : verts.
- `npx jest` (suite complète) : vert — 128 suites / 2120 tests. Vérifié **15 exécutions consécutives** de `src/features/play-mode/` sans échec (68 tests × 15), pour écarter la flakiness liée au tirage aléatoire de graine.
- Seul échec résiduel observé par intermittence : `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` (timeout 5 s sous charge) — **préexistant, non touché par cette itération** (confirmé par QA mode B), déjà journalisé historiquement (BUG-128).
- `npm run test:mutation` : **sans objet** — aucun des 4 fichiers de règles (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) ni leur test dédié n'est touché par les lots A/B (confirmé par `git diff --name-only`).

## Budget de contexte

- `bug_history.json` était à 61 o de son plafond (15 360 o) ; les deux leçons de cette itération sont promues le jour même (KR-276, KR-277) et écrites directement dans un nouveau `bug_history.moteur-arbitre.json` (11ᵉ fichier, même critère que `bug_history.moteur-interprete.json`). BUG-131/BUG-133 (moteur-interprete, leçon déjà promue KR-013/113) y rejoignent BUG-130 dans l'archive existante, libérant `bug_history.json` à 12 129 o.
- `code-knowledge.json` : 70 291 / 71 680 o — sous le plafond, marge restante faible (~1,4 kio).
- `docs/ROADMAP-BASCULE-IA.md` : 30 695 / 30 720 o — sous le plafond par 25 o. À surveiller à la prochaine itération touchant ce fichier.
- `src/features/moteur-arbitre/specification.json` : 30 584 o, large marge sous son plafond (65 kio).

## RETOUR-COMITÉ

- **La non-régression d'une garde bloquante neuve doit être un critère explicite du plan, pas une découverte d'exécution.** Le plan d'it1 n'a cité aucun des 5 fichiers de test préexistants qui montent `EcranPartie` ; le raffinage suivant qui introduit une garde de précondition devrait faire lister par le tech-lead, au § 4/§ 5, les montages existants du composant parent qu'elle affecte — un grep de 30 secondes (`grep -rl "import.*EcranPartie" src/features/`) l'aurait anticipé entièrement.
- **Un helper de test qui simule un geste à choix multiples sous plafond par cible doit être spécifié au plan avec sa preuve de couverture totale** (ici : somme des marges ≥ maximum distribuable), pas laissé à l'implémentation d'un ouvrier — le bug de distribution (BUG-136) aurait été évité si le plan avait nommé l'exigence « itère sur toutes les cibles, jamais une seule ».
- **Confirmé, à répéter** : la vérification indépendante de l'orchestrateur après chaque compte rendu d'agent (relire le code, relancer la suite complète plusieurs fois, jamais se fier à un seul run vert annoncé) a trouvé les deux seuls défauts réels de cette itération. Aucun n'aurait été vu par la porte qualité seule sur un run unique.
