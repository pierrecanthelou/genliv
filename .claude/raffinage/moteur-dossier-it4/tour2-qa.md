# TOUR 2 — `qa` — `moteur-dossier` it4

```
RÉPONSE À   — `tech-lead` R1/M3 (« actionEngine.ts : 0 partie arbre, hors lot »). ACCEPTÉ, re-mesuré :
              actionEngine.test.ts (57) survit, mon delta A.1 (214→125) était FAUX. Chiffres
              définitifs : tree-canvas 3 suites / 37 ; src/player 7→5 suites, 177→145 ; périmètre
              214→182 ; ET jest COMPLET 121→118 suites, 1870→1829 (playExport.test.ts, 9 tests,
              meurt dans src/brain/ — hors du périmètre que le conflit nommait). Aucun test
              survivant n'importe un symbole mourant (1 occurrence, un commentaire). Je réponds
              aussi à R4 (« ne pas toucher moteurSansIA ») : REFUSÉ.
MES OBJECTIONS
   Delta A.1 — RETIRÉE. Prémisse fausse, la mesure du tech-lead tient.
   Critère de fusion (C4) — RETIRÉE. À N=1 le lot EST la fusion.
   Veto test-grep (C3) — MAINTENU, et je retire AUSSI ma propre variante C.3 : instrument neuf à
              un seul appelant, sur une feature en sommeil, dont le pouvoir séparateur doit être
              fabriqué par un mutant. LE FICHIER 22 SORT DE LA LISTE.
   Veto critère n° 11 — MAINTENU tel qu'écrit, levé par C.4 + C.5.
   moteurSansIA (C7) — MAINTENUE, MON PROPRE CHIFFRE CORRIGÉ : 14/8/26 = 48, pas 47.
   C8 — NOUVEAU CONSTAT mesuré : le défaut CRLF atteint EXACTEMENT 1 suite / 4 tests sur 121.
   INCIDENT — le node_modules du dépôt principal était DÉTRUIT. Réparé, porte re-mesurée verte.
PROPOSITION — C.1, C.2 (git diff --name-only, JAMAIS git status : 14 faux positifs CR mesurés),
              C.4, C.5, C.6. Définition de fini : EMPREINTE de porte AVANT/APRÈS dans le MÊME
              worktree ; fini = zéro échec NOUVEAU. Jamais « on sait que ce rouge-là est étranger ».
VERDICT     — recevable sous réserve. it4 NE DÉMARRE PAS avant le correctif CRLF ou une empreinte
              HEAD écrite dans le plan.
```

## A0 — INCIDENT D'ENVIRONNEMENT

`npx jest` ne démarrait plus dans le dépôt principal : `Cannot find module '@babel/code-frame'`,
`node_modules` à 486 paquets (756 au lock), **ni `.bin` ni `@babel`**. Réparé
(`npm install --prefer-offline`, puis `git checkout -- package-lock.json` car npm avait resynchronisé
le champ `version`) → `121 passed / 1870 passed`.

> **IMPUTATION PAR L'ORCHESTRATEUR** — c'est **mon erreur**, pas celle de la QA. Mon premier
> `git worktree remove --force` (M-4) a été lancé **alors que la jonction NTFS `node_modules` était
> encore en place** : git a suivi la jonction dans le vrai `node_modules` et en a supprimé une partie
> avant d'échouer sur un fichier verrouillé (« failed to delete … Invalid argument »). J'ai ensuite
> mesuré `ls node_modules | wc -l` → 486 et conclu à tort « intact ». **Vérifié après réparation** :
> 489 paquets, `.bin`/`@babel`/`typescript`/`jest`/`eslint`/`prettier`/`react` présents, `tsc` exit 0,
> `jest` 121/1870 verts, `package-lock.json` non modifié, un seul worktree.
>
> **Dérive préexistante relevée par la QA, laissée telle quelle** : `package-lock.json` porte
> `version: 0.6.19` alors que `package.json` est à `0.7.3` — chaque `npm install` la resynchronise et
> salit l'arbre. Hors périmètre d'it4, à traiter ailleurs.

## A1 — LA VALEUR PASS/FAIL : le delta, refait

| Périmètre | Suites avant → après | Tests avant → après |
|---|---:|---:|
| `src/features/tree-canvas` | 3 → **3** | 37 → **37** |
| `src/player` | 7 → **5** | 177 → **145** |
| **`tree-canvas` + `player`** | 10 → **8** | **214 → 182** |
| **`jest` complet** | 121 → **118** | **1870 → 1829** |

Suites qui meurent : `sessionEngine.test.ts` (24), `persist.test.ts` (8), `playExport.test.ts` (9,
dans `src/brain/` — **hors du périmètre que le conflit nommait**). `actionEngine.test.ts` (57)
**SURVIT**.

Contrôles de non-contamination : hors des 3 suites mourantes, **une** seule occurrence des symboles
cibles dans les tests — `ouvertureVerbatim.test.tsx:74`, **un commentaire**. Les suites survivantes
important `player/types` ne prennent que `HeroState`, `SessionEquipmentState`, `SessionState`, **tous
conservés** (R3) : aucun ajustement de fixture. Aucun test ne couvre le CTA de `src/EditorScreen.tsx`.

**Limite dite explicitement** : 182 / 1829 est une **projection** dérivée de la liste du tech-lead.
Ce qui est mesuré, c'est la base (214 / 1870) et l'appartenance de chaque suite. D'où : **valeur
exacte au plan, pas borne.**

## A2 — C8 : combien de suites atteintes ? **Une.**

Worktree neuf, jonction PowerShell, run complet :

```
head -c 80 wt/src/brain/copilote/contexte/relations.ts | od -c  →  / * * \r \n   (CRLF confirmé)
Test Suites: 1 failed, 120 passed, 121 total
Tests:       4 failed, 1866 passed, 1870 total
```

Les 4 assertions de `contexte.test.ts` : `Expected length: 4 / Received length: 40` — **confirme à
l'observation** le mécanisme M-7 (la base du balayage s'étend au fichier entier).

**Les 47 autres suites à `readFileSync` sont VERTES** (`lintIsolation`, `moteurSansIA`,
`codeKnowledge`, `outcomeBlock` compris ; `rules.golden.test.ts` ne lit pas le disque).
`tsc --noEmit` **exit 0**. ESLint **exit 0** (1 warning préexistant). **Le CRLF ne casse ni `tsc`, ni
ESLint, ni Prettier ; il casse exactement 4 assertions d'une suite. L'ampleur est petite ; la nature
est grave** (instrument à base variable, dont la moitié des assertions sont des `toContain` positifs
qui **verdiraient** sur une base étendue).

### A2 bis — LE PIÈGE QUE PERSONNE N'AVAIT MESURÉ : `git status` ment en worktree neuf

Après `prettier --write` (étape 1 de la porte de `dev-lot`, qui réécrit en LF) :

```
git status --porcelain | wc -l                                 → 371
git diff --numstat | wc -l                                     → 0
git diff --ignore-cr-at-eol | grep -c "^[+-][^+-]"             → 0
git status --porcelain -- src/features/tree-canvas/ | wc -l    → 14   ← FAUX POSITIFS
git diff --name-only HEAD -- src/features/tree-canvas/ | wc -l → 0    ← JUSTE
```

**Conséquence sur C.2** : l'instrument s'écrit `git diff --name-only`, **jamais** `git status`. Écrit
avec `git status`, le critère « `tree-canvas` non modifiée » **rejette un lot correct**.

## A3 — `moteurSansIA.test.ts` : 14 · 8 · 26 = **48**

Les 9 morts de `src/player` : `PlayerRuntime`, `NodeScreen`, `ChoiceList`, `DecorScreen`,
`PnjScreen`, `TrapScreen`, `sessionEngine.ts`, `usePlaySession.ts`, `persist.ts`. `play-mode` :
`PlayerModal.tsx`. **Mon A.4 disait 13/8/26 = 47 : faux d'une unité.** La « coïncidence à 47 » que
j'invoquais **n'a pas lieu** — ce qui reste est **pire** : la docstring annoncera 47 contre 48, écart
qu'aucune relecture ne rattrape. *L'argument de corriger dans it4 survit à la correction de mon
propre chiffre ; l'argument « ne pas toucher » perd le sien.*

## A4 — Critère n° 11 : **3 modules** hors liste

`types` 12 · `monsterCapacities` 4 · `creatureTypes` 1, **tous survivants**. `tree` (4 en production)
et `playExport` (1) **tombent à 0**. `monsterCapacities` est **déjà en l. 49, absent de la l. 9** :
les deux listes se contredisent avant it4. Les deux phrases du `narratif-ia` sont **signées sans
amendement**.

## B — Critères définitifs

**C.1 — le delta chiffré** *(exécution de suite, constat de lot)* — **Étant donné** le lot livré en
totalité, **quand** on exécute `npx jest src/features/tree-canvas src/player --silent` puis
`npx jest --silent`, **alors** le premier rend **exactement 8 suites / 182 tests** (dont
`tree-canvas` **3 / 37**) et le second **exactement 118 suites / 1829 tests**. **Toute autre valeur
est un rejet, y compris supérieure.**

**C.2 — `tree-canvas` non modifiée** *(constat de revue)* — `git diff --name-only HEAD --
src/features/tree-canvas/` rend une sortie **vide**, recopiée dans la revue. **Interdit :
`git status --porcelain`** — 14 faux positifs mesurés.

**C.4 — le runtime n'importe plus l'arbre** *(contrat, greppable + `tsc`)* — aucun import de
`src/player/**` ne vise `brain/tree` ni `brain/utils/playExport` (**4+1 aujourd'hui → 0**), ni
`src/features/**`, ni un service `brain/` à état. **ROUGE aujourd'hui : pouvoir séparateur
constatable sans mutant.**

**C.5 — la liste documentaire** *(documentaire ; `NON VÉRIFIÉ` si non amendé)*.

**C.6 — `moteurSansIA` re-dérivé** *(unitaire, dans la porte)*.

*(Critère retiré par la QA : le test-grep du n° 10 **sous toutes ses formes**, y compris sa propre C.3.)*

## C — Définition de fini

1. **Empreinte différentielle**, dans le **même worktree** : `jest --json` sur HEAD pristine (E₀)
   puis après le lot (E₁). **Fini ⇔ E₁ ⊆ E₀** et les totaux de C.1. **E₀ écrit nommément au plan** :
   ∅ si le correctif CRLF est passé avant, sinon les 4 assertions nommées. *Sans les noms, l'ouvrier
   décide seul quel rouge est étranger — c'est ainsi qu'une vraie régression passe.*
2. Porte dans l'ordre, **`tsc --noEmit` en tête** (exit 0 mesuré en worktree neuf, donc tout rouge
   `tsc` sera imputable à it4).
3. `git diff --name-only HEAD -- src/features/tree-canvas/` vide, sortie recopiée.
4. C.4 constaté par balayage, sortie recopiée (avant 4+1 ; après 0+0).
5. **`npm run test:mutation` NON requis** — aucun des 4 fichiers mutés n'est touché.
6. **Aucun test réécrit pour compenser une suppression.**
7. La revue nomme **ce que personne n'a vérifié** : C.5 est documentaire.

## D — Refus motivés — à recopier tels quels au § 8

> **`REJETÉ` (QA) — le test-grep du critère n° 10, sous TOUTE forme, y compris son repointage en garde de frontière.** MESURÉ avant toute démolition : `grep -rn` des 14 symboles cibles sur `src/features/tree-canvas/` rend **zéro occurrence, exit 1**. Asserté `toEqual([])`, ce témoin est **vert par construction** et le resterait si le répertoire était renommé. Pouvoir séparateur **nul** (BUG-084). Strictement plus faible que deux instruments **déjà dans la porte** : `tsc --noEmit` (exit 0 mesuré en worktree neuf) et la résolution de modules de jest (mesurée **ROUGE sur 4 suppressions simulées**). **La QA retire également sa propre variante C.3** : un instrument neuf à un seul appelant, dont le pouvoir séparateur doit être **fabriqué** par un mutant, posé sur une feature en sommeil jusqu'après le Temps 2, coûte plus que la dette qu'il garde. Retenus : **C.2** et **C.4**.

> **`REJETÉ` (QA) — le critère n° 11 tel qu'il est écrit.** `EXIGENCE-APERCU-DU-JEU.md:9` liste **5** modules ; `src/player/**` en importe **trois de plus qui SURVIVENT** — `types` (12), `monsterCapacities` (4), `creatureTypes` (1). Le cadrage en annonçait deux ; `monsterCapacities` est **déjà en l. 49 et absent de la l. 9** : les deux listes se contredisent avant it4. Aucun instrument ne garde ce critère. Un critère adossé à une liste périmée n'est pas un critère. Retenu : scission en **C.4** (rouge aujourd'hui) et **C.5** (documentaire, `NON VÉRIFIÉ` si non amendé).

> **`REJETÉ` (QA) — « ne pas toucher `moteurSansIA.test.ts` » (tech-lead R4, pour ce fichier seulement).** La règle « pas de petit refactor à côté » vise un fichier que le lot ne rend pas faux. Ici le lot **change la valeur mesurée** que ce fichier affirme : 58 aujourd'hui (docstring : 47), **48** après. Même raisonnement que celui qui fait entrer `docs/EXIGENCE-APERCU-DU-JEU.md` au lot, accepté par ailleurs. Traiter les deux différemment est incohérent.

> **`REJETÉ` (QA) — `git status --porcelain` comme instrument du critère « `tree-canvas` non modifiée ».** MESURÉ en worktree neuf après l'étape Prettier : `git status --porcelain -- src/features/tree-canvas/` rend **14 fichiers**, `git diff --name-only HEAD -- …` rend **0**. Tout l'écart est du CR en fin de ligne. Écrit avec `git status`, le critère **rejette un lot correct**.

> **`REJETÉ` (QA) — démarrer it4 sans traiter le défaut CRLF, ou le traiter DANS le lot.** MESURÉ : worktree neuf pristine → **1 suite / 4 tests en échec sur 121 / 1870** ; les 47 autres suites à `readFileSync` vertes ; `tsc` exit 0 ; ESLint exit 0. Démarrer sans rien écrire laisse l'ouvrier juger seul quel rouge est étranger. Faire entrer un fichier de `brain/copilote/` dans un lot de démolition casse la propriété de fichiers. Retenu : **correctif préalable hors it4** (+ entrée `bug_history.json` `major`), **ou** à défaut une **empreinte E₀ nommée** au plan.

> **`REJETÉ` (QA) — toute citation d'une couverture globale comme preuve d'it4, y compris à la hausse.** Supprimer ~1 500 lignes dont une part non couverte fait monter le ratio sans qu'aucun test n'ait été écrit.

## E — Décisions prises en autonomie faute de spécification

- **Réparer `node_modules` pour pouvoir mesurer** → réparé → sinon aucune mesure de ce tour n'existait et le tour 2 rendait un avis sur des chiffres dont deux étaient faux.
- **Périmètre du delta** → **les deux chiffres**, 182 et 1829 → si on ne garde que 182, la mort de `playExport.test.ts` n'est gardée par aucun critère.
- **Valeur exacte, pas borne** → en borne, une suite supprimée en trop passe inaperçue.
- **Sort de sa propre variante C.3** → **retirée** → sinon on livre un fichier de test dont le pouvoir séparateur n'existe que le jour où quelqu'un écrit le mutant, sur une feature que personne ne rouvrira avant le Temps 2.
- **Traitement du CRLF** → correctif préalable hors it4, à défaut empreinte E₀ nommée.
- **Instrument du « non modifié »** → `git diff --name-only`, jamais `git status`.
