# Revue — `moteur-arbitre` it2

**En une ligne** : l'auteur peut maintenant jouer un geste `agir` et voir le moteur demander un jet à l'IA, le résoudre lui-même (jamais l'IA), et en faire raconter l'issue — sans qu'aucune caractéristique du héros ne quitte jamais la machine.

## Critères (plan § 6)

1. **VÉRIFIÉ** — R2 déclenché ssi `agir`+héros, jamais `aller`, jamais sans héros. Test : `arbitre.test.ts` (unitaire) + `useTourDeJeu.test.ts` (intégration).
2. **VÉRIFIÉ** — Contexte R2 strict (lieu + dangers + canon.ton optionnels + catalogue + saisie, jamais `heros.*`). Test : `CopiloteService.test.ts` (`toEqual` strict), `copilote/contexte.test.ts` (invariance).
3. **VÉRIFIÉ** — `issueDuJet` seule appelante de `resolveChallenge` dans tout le dépôt, rng dérivé de `graine_alea`. Balayage de fichiers confirmé par deux revues indépendantes (orchestrateur + tech-lead).
4. **VÉRIFIÉ** — R3 reçoit une amorce qualitative binaire à l'infinitif, jamais les chiffres, une seule ligne ajoutée à `CE PAS`. Test : `copilote/contexte.test.ts`.
5. **VÉRIFIÉ** — `EntreeJournal.jet` = `{carac,tc}` sans `lieu_id`. Test : `session.test.ts`, table d'audience `sessionDestinations.ts` + fixture complétées en cours de revue (critique 2).
6. **VÉRIFIÉ** — Sortie R2 non conforme → rejeu unique → `sans_epreuve`. `sans_epreuve`/R2 indisponible → aucune carte, aucune bannière, R3 immédiat. Tests : `schemaSortie.test.ts`, `useTourDeJeu.test.ts` (3 scénarios).

## Diff par lot

- **Lot 1 `contrat-arbitre`** (21 fichiers, brain/+worker/) — conforme à la liste § 5 du plan, aucun écart.
- **Lot 2 `jet-joue`** (6 fichiers, play-mode/) — conforme à la liste § 5, plus les corrections post-revue (voir ci-dessous) qui sont restées dans le même périmètre de fichiers.
- **Fichiers hors lots, attendus** : `specification.json`, `CHANGELOG.md`, `code-knowledge.json`, `bug_history.moteur-arbitre.json`, `docs/ROADMAP-BASCULE-IA.md`, `package.json` (doc/versioning, étape 4 du Build Steps) ; `.claude/raffinage/moteur-arbitre-it2*` (le plan et les notes du comité).

## Ce qui a été refusé (registre § 8 du plan)

16 désaccords tranchés en tour 3 du raffinage — notamment : le re-découpage de l'itération (REJETÉ, KR-263/266 déjà acté au cadrage), le renommage complet du schéma de sortie R2 au-delà du wrapper (REJETÉ, `carac`/`tc` restent des rangs re-résolus, aucun homonyme réel), le prédicat anti-tutoiement (REJETÉ, faux positifs ASCII + incohérence avec les 8 rôles frères), la bannière dédiée à R2 indisponible (REJETÉ, fusionnée avec l'état `sans_epreuve`). Détail complet : `.claude/raffinage/moteur-arbitre-it2.plan.md` § 8.

## Ce qui a été reporté

- Le retour de focus au champ de `PlayerInputBar` après le récit (contrat de design § 3) — nécessite un `forwardRef`/`useImperativeHandle` sur `Field` (`brain/components/`, hors des deux lots). Consigné en `open_questions`, propriétaire à assigner.
- Vérification en playtest réel (non exécutable par jest) de la pertinence narrative des propositions de R2.
- Incohérence du roadmap (`combat.ts` rattaché à tort au déclencheur « n°11 ») — relevée au cadrage, hors périmètre de cette feature.

## Écarts assumés et blocages non résolus

Aucun blocage ouvert. Deux écarts architecturaux par rapport au texte du cadrage, tous deux motivés et tranchés en tour 3 : le renommage partiel du schéma de sortie R2 (`jet`→`epreuve`, homonymie avec `EntreeJournal.jet`) et le retrait de `lieu_id` du journal (KR-013, dérivable).

## Porte qualité

- `tsc --noEmit` : vert.
- ESLint : vert (1 warning préexistant, hors périmètre — `CharacterCreationScreen.tsx`).
- `jest` : **131 suites / 2204 tests**, tous verts.
- `npm run test:mutation` : **non dû** — aucun des 4 fichiers de règles (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'a été modifié, seulement consommé.

## RETOUR-COMITÉ

- **La fusion de deux lots en un seul worktree manuel** (plutôt que la fusion automatique `integrateur` attendue sur deux worktrees séparés) a bien fonctionné une fois la cause racine identifiée, mais a coûté trois tentatives avant d'y arriver — le patron `/essaim` suppose implicitement que chaque worktree de lot part d'un `main` à jour, ce qui n'est pas garanti par l'outil d'isolation quand les lots sont lancés à des instants différents. À nommer explicitement dans la skill `essaim` : vérifier `git log -1` du worktree contre `main` avant de lancer un ouvrier, pas après son blocage.
- **`npm run format` sans scope reste un piège répété** (2 agents sur 2 tentatives de lot 2 l'ont déclenché malgré l'avertissement transmis) — mérite d'être une règle ESLint/hook plutôt qu'une note de prompt, puisque la note seule n'a pas suffi deux fois de suite.
- **La revue tech-lead à trois passages a trouvé un défaut par passage** (verrou, audience de session, ré-entrance clavier), chacun dans une classe différente mais liée au même mécanisme (le verrou KR-265 étendu). Signal que l'extension d'un verrou existant à une nouvelle étape mériterait une checklist dédiée (chaque point d'entrée UI qui peut déclencher l'étape finale, pas seulement le point d'entrée nommé par le plan) plutôt qu'une relecture ad hoc.
- **Un agent qui panique sur un artefact d'environnement connu (CRLF/LF) peut détruire son propre travail avec une commande git mal ciblée** — les garde-fous écrits dans le prompt (« ne jamais lancer `git clean`/`checkout -- .` ») n'ont pas suffi pour la tentative #1 ; la tentative #3 avec les mêmes garde-fous a réussi. Pas de changement de process recommandé au-delà de ce qui est déjà écrit — l'échantillon est trop petit pour conclure, mais à surveiller.
