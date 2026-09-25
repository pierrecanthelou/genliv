# TOUR 1 — `tech-lead` — `moteur-dossier` it4

```
RISQUE      — Le découpage lui-même. MESURÉ : `dev-lot.md:36` impose la porte
              `Prettier → tsc → ESLint → jest` PAR LOT (« Rouge = tu ne rends pas »),
              `dev-contrat.md:10` s'y soumet, `essaim.md:21` dit « Attends sa porte qualité verte.
              Rien d'autre ne démarre avant. » La porte est donc PAR LOT **et** à l'intégration.
              Or une suppression se propage à CONTRESENS des imports, tandis que la propriété
              exclusive des fichiers se propage DANS leur sens.
OBJECTION 1 — Le goal (et roadmap § 0 bis:66) écrit « les PARTIES ARBRE de sessionEngine /
              actionEngine / usePlaySession ». Pour `actionEngine.ts`, CET ENSEMBLE EST VIDE
              (M3 : 0 occurrence sur 346 lignes). Il ne perd pas des parties, il perd ses cinq
              consommateurs. Un ouvrier qui prend le goal au mot ouvrira 346 lignes pour rien.
OBJECTION 2 — « Repointés » (roadmap:57) est PÉRIMÉ : le repointage a eu lieu en it1–it3 par
              RÉÉCRITURE SOUS D'AUTRES NOMS (`EcranPartie.tsx`, `session.ts`+`commandes.ts`,
              `useSessionPersistee.ts`), jamais par édition. Repointer `PlayerRuntime.tsx` en it4
              est impossible : son remplaçant est déjà livré et n'a pas besoin de lui.
PROPOSITION — UN SEUL LOT, marqué `contrat`, confié à `dev-contrat`. À N=1 la règle « seul et en
              premier » est satisfaite SANS DÉROGATION : le paradoxe d'ordre ne naît qu'à N>1.
              15 (S) / 6 (M) / 1 (N) = 22 fichiers.
VERDICT     — recevable sous réserve (R1 correction du goal sur `actionEngine`, R2 statut écrit
              des orphelins, R3 résidu `SessionState` nommé et daté).
```

> **NOTE DE L'ORCHESTRATEUR** — la justification de R5 (« la fermeture est connexe donc TOUTE
> partition ≥ 2 lots produit un lot rouge ») a été **RÉFUTÉE PAR EXPÉRIENCE** : voir
> `MESURES-ORCHESTRATEUR.md` § M-4. La coupe 4a du PM **compile** (`tsc --noEmit` exit 0). La
> **conclusion** (N=1) est retenue, sur un **autre motif**.

## Le découpage — LOT UNIQUE `extinction-arbre`, type `contrat`, agent `dev-contrat`

| # | Fichier | Mk | Geste |
|---|---|:--:|---|
| 1 | `src/brain/utils/playExport.ts` | **S** | 207 l., racine du type `PlayExport` |
| 2 | `src/brain/utils/playExport.test.ts` | **S** | suite dédiée |
| 3 | `src/brain/utils/buildAdventureDocument.ts` | **S** | 13 l., aucun `.test` associé (M5) |
| 4 | `src/brain/index.ts` | **M** | retirer l. 597-604 et l. 606 |
| 5 | `src/brain/tree.ts` | **M** | commentaire l. 11 ; **le fichier survit** (KR-240) |
| 6 | `src/brain/persistenceKeys.ts` | **M** | supprimer `PLAY_SESSION_KEY_PREFIX` (l. 145-151) ; `DOSSIER_SESSION_KEY_PREFIX:101` **survit** |
| 7 | `src/EditorScreen.tsx` | **M** | retirer l. 2 (partiel), 4, 5, 19, 41-44, 59, 61 ; **le fichier survit** |
| 8 | `play-mode/components/PlayerModal.tsx` | **S** | 95 l. |
| 9 | `src/player/components/PlayerRuntime.tsx` | **S** | 369 l. |
| 10-14 | `NodeScreen` 62 · `ChoiceList` 146 · `DecorScreen` 277 · `PnjScreen` 150 · `TrapScreen` 181 | **S** | |
| 15 | `src/player/engine/sessionEngine.ts` | **S** | 80 l., **intégralement** partie arbre |
| 16 | `src/player/engine/sessionEngine.test.ts` | **S** | |
| 17 | `src/player/hooks/usePlaySession.ts` | **S** | 318 l., aucun `.test` (M5) |
| 18 | `src/player/utils/persist.ts` | **S** | 41 l. |
| 19 | `src/player/utils/persist.test.ts` | **S** | |
| 20 | `src/player/types.ts` | **M** | retirer l. 1, 5, 6 ; **conserver** `HeroState`, `SessionEquipmentState`, `PlayPhase`, `SessionState` (R3) |
| 21 | `docs/EXIGENCE-APERCU-DU-JEU.md` | **M** | l. 7, 11, 62 ; requis par le critère 11 |
| 22 | `play-mode/tests/extinctionArbre.test.ts` | **N** | test-grep du critère 10 |

**`actionEngine.ts` n'entre dans AUCUN lot** — ni (M) ni (S).

## Mesures

- **M1** `rg 'playExport|buildAdventureDocument'` → 10 lignes, 7 fichiers, **aucun consommateur hors liste**.
- **M1 bis** symboles du baril → aucun consommateur hors `playExport.ts`(+test), `buildAdventureDocument.ts`, `brain/index.ts`, `persist.ts`(+test), `persistenceKeys.ts:151`.
- **M2** consommateurs des écrans/runtime → 7 lignes, **chaîne linéaire à racine unique `src/EditorScreen.tsx`**.
- **M3** `rg 'AdventureDocument|PlayNode|PlayExport|\bEdge\b|brain/tree|SessionState|currentNodeId|visitedNodes|bookId' src/player/engine/actionEngine.ts` → **`No matches found`** (0/346). **LA mesure de cette note.**
- **M4** `rg 'SessionState' src/player/engine/combatEngine.ts` → **7 lignes** (`:18` import ; `:38 :43 :85 :119 :196 :467` paramètres). Fonde R3.
- **M5** suites associées : existent `sessionEngine.test.ts`, `persist.test.ts`, `playExport.test.ts` → entrent (S). N'existent pas : `usePlaySession.test.*`, `PlayerRuntime.test.*`, `buildAdventureDocument.test.*`, ni aucun test des 5 écrans. **Aucune suite orpheline derrière.**
- **M6** `moteurSansIA.test.ts` : plancher 20, après lot `player` 14 · `play-mode` 8 · `brain/dossier` 15 = 37 ≥ 20 ✔. Docstring l. 39 (« 47 ») devient fausse → consigné, **pas** au lot.
- **M7** `play-mode` survit : 8 production + 7 suites ; `index.ts:7` atteste que `PlayerModal` n'est pas au baril → `index.ts` **n'entre pas au lot**.
- **M8** `EditorTopBar.tsx` hors lot : `onPreview?` optionnel (l. 41), `disabled={!onPreview}` (l. 126) → `EditorScreen` cesse simplement de passer la prop. **D-6 tenue sans effort.**
- **M9** résidus de docstring vers `PlayerModal.tsx` : `EcranPartie.tsx:22,23,41`, `CadrePartie.tsx:18,72,91`, `dossier-registres/PanneauEvenements.tsx:80`. **Aucun ne rougit.**

## Frontière `sessionEngine` / `actionEngine`

`sessionEngine.ts` : **100 % arbre**, le fichier entier meurt. `findSommaire`, `getNode`,
`listChoices`, `determinePhase`, `navigate`, `createSession`, `createSessionFromHero`,
`filterChoicesByPrereq` dépendent tous de l'arbre. `defaultSessionFields()` **non** — il meurt
**par domicile** (ses 2 consommateurs, `createSessionFromHero` et `persist.ts:2`, meurent).
`PE_PER_TRANSITION` meurt avec son unique lecteur `navigate`. **Distinction à écrire au plan.**

`actionEngine.ts` : **ZÉRO partie arbre**, survit intégralement en orphelin. Les 10 fonctions
(`resolveTrap`, `computeInventoryLoss`, `resolveDecorReveal`, `resolveTakeableRoll`, `applyPnjGift`,
`autoEquipObject`, `computeCaracUpgrade`, `applyCaracUpgrade`, `computeMcUpgrade`, `applyMcUpgrade`)
**survivent toutes, sans une ligne modifiée**. Elles perdent leurs 5 consommateurs.

## Les orphelins — périmètre RÉEL plus large que celui du cadrage

Après ce lot, `src/player/` n'a **plus aucun consommateur de production, EN ENTIER** — pas 7
fichiers/~1 380 l., mais **~4 400 l.** Chaîne : `EditorScreen` → `PlayerModal` → `PlayerRuntime` →
tout le reste. `PlayerRuntime` mort, la racine de composition de `src/player/` disparaît.

**Ils restent**, pour trois motifs : (1) propriétaire **daté à une itération de distance** (n° 10
écrans/runtime, n° 13 `combatEngine`) — différence de fond avec le modèle d'arbre dont le
propriétaire est « après le Temps 2 » ; (2) tenus par des suites de logique **qui survivent** ;
(3) les supprimer coûterait la n° 13 entière.

## Réserves — à recopier telles quelles au § 8

> **R1 — RETENU (correction de goal, mesurée).** La formule « les parties arbre de `sessionEngine` / `actionEngine` / `usePlaySession` » est **fausse pour `actionEngine.ts`** : `rg -n 'AdventureDocument|PlayNode|PlayExport|\bEdge\b|brain/tree|SessionState|currentNodeId|visitedNodes|bookId' src/player/engine/actionEngine.ts` → **0 match sur 346 lignes**. `actionEngine.ts` **n'entre dans aucun lot**. Il perd ses cinq consommateurs (`DecorScreen`, `TrapScreen`, `PnjScreen`, `XpShopScreen`, `usePlaySession`) et rejoint les orphelins de la n° 10. Le goal d'it4 et le roadmap § 0 bis:57/66 sont corrigés en conséquence. *(KR-258 appliqué au goal.)*

> **R2 — RETENU.** Les orphelins de `src/player/` **ne sont pas supprimés** : propriétaire nommé **et daté à une itération de distance**, suites de logique survivantes — double différence avec le modèle d'arbre. **Contrepartie obligatoire** : la revue écrit **le nombre mesuré** de fichiers de production de `src/player/` sans consommateur après le lot, et la ligne de roadmap qui nomme leur repreneur. Une promesse de reprise n'est pas un garde. **Aucun test d'inventaire d'orphelins n'est demandé** : abstraction à un seul appelant, plus chère que la dette gardée.

> **R3 — RETENU (résidu nommé et daté).** `src/player/types.ts` **conserve** `SessionState` : `rg -n 'SessionState' src/player/engine/combatEngine.ts` → **7 lignes**. Le narrowing correct (`combatEngine` ne lit que `activeProtection`, `activeShield`, `permanentArmorBonus`, donc devrait prendre `SessionEquipmentState`) est **refusé ici** : il ferait entrer `combatEngine.ts`, `capacityEffects.ts`, `CombatScreen.tsx`, `useCombat.ts` et 2 suites dans un lot de démolition, soit +6 fichiers et un moteur de règles ouvert sans raison. Ce qui reste n'est **pas** du modèle d'arbre : trois `string`/`string[]`, aucun type de `brain/tree`. Propriétaire : **n° 10**.

> **R4 — REJETÉ, et consigné.** Corriger dans ce lot les six renvois ancrés à la ligne vers `PlayerModal.tsx` (`EcranPartie.tsx:22,23,41`, `CadrePartie.tsx:18,72,91`) et `PanneauEvenements.tsx:80`. **Motif du refus** : ces fichiers n'appartiennent pas au lot, et `dev-lot.md` §1 interdit le « petit refactor à côté ». **Motif de la consignation** : renvois vers un fichier supprimé, dans des commentaires — **rien ne rougira jamais** (KR-258). À traiter dans le **geste de doc de l'étape 4**, avec M6 (docstring « 47 fichiers »).

> **R5 — REJETÉ (option (b) du point dur), MOTIF RÉFUTÉ PAR L'ORCHESTRATEUR (M-4).** Le tech-lead écrivait : « la fermeture est connexe, à racine unique, donc TOUTE partition en ≥ 2 lots laisse un lot avec `tsc` rouge ». **L'expérience M-4 le réfute : la coupe 4a du PM compile (`tsc --noEmit` exit 0).** La condition réelle n'est pas la connexité mais la **clôture vers le haut**. **La conclusion N=1 est néanmoins retenue, sur le motif de substitution** : les deux lots sont strictement séquentiels, donc la coupe n'achète **aucun parallélisme** — elle achète seulement le passage du lot `contrat` en SECOND, c'est-à-dire exactement la dérogation qu'on voulait éviter.

> **R6 — REJETÉ.** Inventer un second lot pour « justifier un essaim ». **Motif** : `/essaim` étape 2 prévoit « 1 ou 2 lots → un seul `dev-lot`, en séquence. C'est le cas courant sur ce codebase, et c'est très bien », et le découpage ne crée pas le parallélisme, il le révèle. Ici il n'y a rien à révéler.

## Décisions prises en autonomie faute de spécification

- **Ordre d'une démolition vs règle `contrat` seul-et-premier** → un lot unique marqué `contrat` ; la règle devient vraie **par vacuité** au lieu d'être dérogée → si l'inverse, le premier lot rend `tsc` rouge, `/essaim` étape 3 le met en `BLOCAGE`, deux tours perdus.
- **Sort d'`actionEngine.ts`** → hors de tout lot, intouché (0 référence mesurée) → si l'inverse, un ouvrier cherche une frontière inexistante et risque d'en **inventer** une, amputant des fonctions de règles dont les n° 10 et 11 ont besoin intactes.
- **`SessionState` conservé** → résidu nommé, propriétaire n° 10 → si l'inverse, +6 fichiers et ~1 000 l. entrent au lot, et on ouvre un moteur de règles dans une démolition.
- **`persist.ts` supprimé** alors que le roadmap § 0 bis:58 le range en « conservé » → supprimé (appelant unique mort, `localStorage` brut, clé dupliquée sous « must stay in sync », second chemin de persistance face au port d'it2) → si l'inverse, deux chemins de persistance coexistent sur deux préfixes différents, dont un sans consommateur.
- **Domicile du témoin neuf** → `play-mode/tests/extinctionArbre.test.ts` (D-10) → si l'inverse (dans `tree-canvas/tests/`), le critère 10 exige que la suite de `tree-canvas` soit **non modifiée** : y ajouter un fichier rendrait le critère invérifiable au diff par celui-là même qui le prouve.
- **Commentaires périmés hors lot** → non corrigés, consignés en R4 → si l'inverse, on viole la propriété exclusive sur trois fichiers et on normalise le « petit refactor à côté ».
