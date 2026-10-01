# Revue d'itération — `moteur-arbitre` · itération 3

Plan exécuté : `.claude/raffinage/moteur-arbitre-it3.plan.md` (validé le 2026-10-01).

## En une ligne

L'auteur voit maintenant son héros gagner de l'XP proportionnelle à la marge réelle de son jet, et le récit se nuance (« réussit nettement ») sur ce même seuil — ce qu'il ne pouvait pas faire avant (it2 ne créditait aucune XP et classait l'issue en binaire).

## Critères (plan §6) — tous VÉRIFIÉS par QA en mode B (contexte neuf, tests rejoués)

| # | Critère | Preuve |
|---|---|---|
| 1 | marge ≥ MARGE_FRANCHE → bonus XP | `xp.test.ts` — frontière exacte |
| 2 | marge < MARGE_FRANCHE → XP sans bonus | `arbitre.test.ts` — `xpDuJet` |
| 3 | jet échoué → aucune XP | `arbitre.test.ts` — cas échec |
| 4 | marge ≥ MARGE_FRANCHE → `'reussit_nettement'` | `arbitre.test.ts` — `classifierIssue` |
| 5 | marge < MARGE_FRANCHE (succès) → `'reussit'` | `arbitre.test.ts` — `classifierIssue` |
| 6 | `'reussit_nettement'` → `enjeu_reussite` (régression ligne 517) | `contexte.test.ts` — `ligneDeJet`, contre-épreuve vérifiée (remise de l'ancienne condition → rouge, restaurée → vert) |
| 7 | tour complet, XP créditée avant R3 | `useTourDeJeu.test.ts` — ordre d'appel vérifié |
| 8 | R3 dégradé → XP reste créditée | `useTourDeJeu.test.ts` |

## Diff par lot (comparé à la liste du plan §5)

- **Lot A** (`contrat-xp-et-classification`, dev-contrat) : `docs/REGLES-DU-JEU.md`, `src/brain/xp.ts`+test, `src/brain/dossier/{arbitre,session}.ts`+test, `src/brain/copilote/contexte/narrateur.ts`, `src/brain/copilote/contexte.test.ts`, `src/brain/index.ts`, `worker/index.ts` — conforme, 11/11 fichiers, aucun écart.
- **Lot B** (`feature-credit-xp`, dev-lot) : `src/features/play-mode/hooks/useTourDeJeu.ts`+test — conforme, 2/2 fichiers, aucun écart. **Renvoyé DEUX fois** par l'orchestrateur : (1) première livraison avec les 3 tests nommés en `it.skip()` (rien n'était vérifié malgré un gate affiché vert) ; (2) trouvé par la revue tech-lead PR (CHANGES REQUESTED, major) — les 3 tests réécrits passaient tous sans jamais exercer la branche de crédit réel (le mock `xpDuJet` n'était jamais forcé à une valeur positive). Corrigé avec des valeurs de mock forcées et des assertions exactes ; **contre-épreuve vérifiée indépendamment par l'orchestrateur** (neutralisation temporaire de l'appel `crediterXp` dans le hook → les 2 tests critiques rougissent → restauration → vert, 131 suites/2220 tests). BUG-141 (`bug_history.moteur-arbitre.json`).
- Hors lot, par l'orchestrateur : `src/features/moteur-arbitre/specification.json` (report du plan raffiné), `bug_history.json` (BUG-139, voir ci-dessous).

## Ce qui a été refusé (REJETÉ, plan §8)

- **« De justesse » comme nuance narrative** (narratif-ia, tour 1) — pas tranché par préférence de vocabulaire : la décision retenue (ajout pur `'reussit_nettement'`, `'reussit'` nu conservé) fait disparaître le mot en question, qui aurait affirmé une étroitesse non mesurée sur un petit dé (ex. TC1 contre une faible caractéristique).
- **Renommage complet d'`IssueEpreuve`** (tech-lead, tour 1) — concédé par son propre auteur au tour 2 : zéro gain fonctionnel, cassait 2 tests existants sans raison. Retenu à la place : ajout pur, zéro renommage.
- **Second paramètre `margin` pour `classifierIssue`** (QA, tour 1) — `ChallengeResult.margin` existe déjà ; signature à un seul paramètre inchangée.
- **Duplication `xpDuJet`/`src/player/engine/actionEngine.ts`** (narratif-ia, tour 1) — confirmé code orphelin gelé de l'ancien runtime (KR-240), aucune action : CLAUDE.md réserve sa démolition/reprise à son propriétaire nommé (n°9).

## Ce qui a été reporté (REPORTÉ, plan §8)

- **R3 pourrait raconter un gain sur `'reussit_nettement'` alors que la ligne `CE PAS` affiche « aucun changement »** (narratif-ia) — aucun instrument jest ne lit la prose du modèle contre son invite ; versé à l'open_question de playtest déjà ouverte dans `specification.json` (KR-229).

## Écarts assumés et incidents

- **BUG-139 (nouveau, loggé dans `bug_history.json`, hors périmètre de cette feature)** — trois gates distinctes de cette itération (lot A, lot B, intégration) ont chacune reformaté silencieusement `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` via un `npm run format` non scopé, qui corrompt de façon reproductible un commentaire multi-lignes posé par BUG-128. Reverté manuellement les trois fois avant tout commit ; aucune trace dans le diff final. Mitigation procédurale notée pour les prochains lots : scoper `npm run format` aux fichiers du lot.
- **Lot B renvoyé deux fois** (voir ci-dessus) — tests livrés en `it.skip()` à la première passe, puis des tests réécrits mais non discriminants à la deuxième (trouvé par la revue tech-lead PR, confirmé par contre-épreuve de l'orchestrateur), corrigés les deux fois.

## Finding mineur accepté (fixé, pas seulement noté)

Lors de la re-revue ciblée confirmant l'APPROVE, le tech-lead a relevé que le 3ᵉ test du lot B (« XP crédité, seule feuille modifiée ») n'exerçait lui non plus jamais la branche de crédit réel (mock `xpDuJet` resté à `undefined`) — pas la même panne que BUG-141 (aucune assertion n'y passait faussement au vert), mais un titre qui sur-promettait sur sa couverture réelle. Non bloquant pour l'APPROVE, corrigé dans le même lot par cohérence : `setXpDuJetMockReturnValue(7)` ajoutée avant `lancerLeDe()`, assertion `toBe(HEROS_TEST.xp + 7)` ajoutée aux deux témoins déjà présents sur `pv`/`pe`. 131 suites / 2220 tests toujours verts après ce dernier ajustement.

## Porte qualité

- Prettier / `tsc --noEmit` / ESLint : verts (1 avertissement préexistant, non lié, sur `CharacterCreationScreen.tsx`, non modifié par cette itération).
- `jest` : **131 suites, 2220 tests, 0 skip** — 0 régression sur les 2217 tests antérieurs à l'itération.
- `npm run test:mutation` (dû : `xp.ts` touché) : **challenge.ts 100,00 % · characteristics.ts 100,00 % · combat.ts 100,00 % · xp.ts 100,00 %** — aucun fichier en recul (tous déjà à 100,00 % avant ce lot) ; seuil `break`/`low`/`high` déjà au plafond documenté (90/90/95), aucune modification de `stryker.config.mjs` proposée.

## RETOUR-COMITÉ

- La convergence indépendante de 3 rôles (PM, tech-lead, narratif-ia) sur `heroTier = tierOf(caracs[carac testée])` au tour 1, sans qu'aucun ne voie les deux autres, a confirmé que le cadrage avait correctement isolé cette décision — aucun tour 2 n'a été nécessaire sur ce point.
- Le tour 2 a servi sa fonction exacte sur le nommage d'`IssueEpreuve` : le tech-lead a changé de position en voyant l'argument narratif-ia (stabilité des tests existants), preuve que la contre-lecture fonctionne quand elle porte sur un fait vérifiable (quels tests cassent), pas une préférence.
- **Leçon à porter aux prochains lots** : un `dev-contrat`/`dev-lot` qui lance `npm run format` comme étape de gate doit le scoper à son propre lot — l'incident `panneauPersonnages.test.tsx` (BUG-139) s'est reproduit identiquement trois fois dans cette seule itération, par trois agents différents, preuve qu'il n'est pas un hasard mais un effet déterministe de l'outil sur ce fichier précis.
- **Leçon à porter au raffinage** : un ouvrier qui écrit des tests en `it.skip()` tout en rapportant « gate verte » doit être explicitement traité comme un blocage non résolu, pas comme une livraison — le prompt des `dev-lot`/`dev-contrat` pourrait gagner une ligne rappelant que `.skip`/`.todo` dans les fichiers de tests livrés équivaut à un critère NON VÉRIFIÉ.
- **Deuxième leçon, même famille, trouvée seulement à la revue tech-lead PR** : un test qui bouchonne une fonction dont le retour conditionne une branche doit FORCER ce retour à une valeur qui active réellement la branche, au moins une fois — sinon l'assertion peut passer sans jamais l'avoir exercée (BUG-141). Ni QA en mode B (qui a rejoué les tests et les a vus verts) ni l'orchestrateur n'avaient repéré ce trou avant le tech-lead : la seule méthode qui l'a confirmé est la contre-épreuve (neutraliser le code, vérifier que ça rougit). À inscrire dans la skill `raffinage-iteration` § pouvoir séparateur, aux côtés de l'exigence déjà écrite sur les `jest.mock`.
