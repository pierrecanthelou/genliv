# TOUR 2 — `tech-lead` — `moteur-dossier` it4

```
RÉPONSE À   — QA, objection 1 (« le test-grep du critère 10 est vert par construction »).
              Retenue en entier : mon fichier 22 était une abstraction à un seul appelant —
              mon biais déclaré. `tsc --noEmit` et la résolution de modules de jest le
              dominent, et la QA les a mesurés rouges sur quatre suppressions simulées. Je
              retire `extinctionArbre.test.ts` ; je ne prends pas non plus sa variante C.3,
              instrument différent exigeant son propre mutant pour un risque déjà tenu.
              Et narratif-ia (C6) : retenu. « Meurt par domicile » décrivait le mécanisme et
              taisait la conséquence ; `docs/REGLES-PLAY.md` entre au lot — le refuser en
              acceptant `EXIGENCE-APERCU-DU-JEU.md` (fichier 21) aurait été incohérent.

MES RÉSERVES — R1 maintenue. R2 maintenue. R3 maintenue.
              R4 maintenue pour les huit renvois périmés hors lot, AMENDÉE d'une exception
              nommée : `moteurSansIA.test.ts` entre, docstring seule.
              R5 RÉÉCRITE : je retire le motif de connexité, réfuté par M-4, et j'adopte la
              substitution. Conclusion N=1 inchangée.
              R6 maintenue.
              R7 NOUVELLE, DURCIE EN VETO DE DÉMARRAGE (M-5) : la porte de mes ouvriers est
              rouge en worktree neuf ; aucun lot ne part avant.

PROPOSITION — un lot unique `extinction-arbre`, type `contrat`, agent `dev-contrat`,
              24 fichiers (15 S / 9 M / 0 N), précédé de la tranche hors cycle `eol-lf`.

VERDICT     — veto de démarrage (R7), levé par `eol-lf`. Sur le fond du découpage : recevable.
```

> **AVEU DE PORTÉE DE L'AUTEUR** — « Je n'ai aucun outil shell dans cette session. Tout ce qui suit
> est un **relevé statique**. Il suffit à trancher le correctif, il **ne suffit pas** à affirmer
> "après correctif, la porte est verte". Cette phrase-là se mesure, et je ne la signe pas. »
>
> **NOTE DE L'ORCHESTRATEUR** — bien lui en a pris : son **second fichier atteint**
> (`worker/frontiere.test.ts:105`) est **réfuté par mesure** (M-8). En ECMAScript `LineTerminator`
> inclut `CR`, donc `$` en mode `m` matche aussi devant `\r` ; la suite **passe** en worktree CRLF.
> **R7 tient quand même** — `contexte.test.ts` seul suffit — mais l'argument de généralité tombe :
> la classe est mesurée sur **UN** fichier, pas deux.

## 1. C8 — cause épinglée à LA ligne

`src/brain/copilote/contexte.test.ts:1745` :

```ts
return source.slice(debut, source.indexOf('\n\n', debut))
```

En CRLF une ligne blanche s'écrit `\r\n\r\n`, qui **ne contient aucun `\n\n`** → `indexOf` rend `-1`
→ `slice(debut, -1)` avale tout le reste du fichier. Consommateurs : l. 1768, 1782, 1799/1805, 2138
→ **exactement quatre `it`**, reproduisant à l'unité le « 4 FAILED / 84 » de M-5. **Cause épinglée,
pas supposée.**

### Les candidats du comité — relevé statique, tous NON atteints

`moteurSansIA.test.ts` (3 regex mono-ligne), `lintIsolation.test.ts` (analyse en mémoire),
`codeKnowledge.test.ts` (`JSON.parse`), `outcomeBlock.test.tsx` (needles mono-ligne),
`CopiloteService.test.ts:1452,1905`, `schemaSortie.test.ts:78`, `couverture.test.ts:1667` (needles
**commençant** par `\n`, donc contenus dans `\r\n`), les dépollueurs `/^[ \t]*\/\/.*$/gm`,
`deltas.test.ts:304-308`.

### La preuve que le rustinage ad hoc a DÉJÀ échoué — 6 sites, 5 fichiers

```
src/brain/dossier/atteignabilite.test.ts:38   .replace(/\r\n/g, '\n')
src/brain/dossier/controles.test.ts:45        .replace(/\r\n/g, '\n')
src/brain/dossier/controles.test.ts:1121      .replace(/\r\n/g, '\n')
src/brain/dossier/controles.test.ts:2298      .replace(/\r\n/g, '\n')
src/brain/dossier/evaluate.test.ts:44         .replace(/\r\n/g, '\n')
src/brain/dossier/tourzero.test.ts:36         .replace(/\r\n/g, '\n')
```

**La classe a été rencontrée et rustinée localement cinq fois sans que personne ne la ferme.**
C'est l'argument qui porte `.gitattributes`, et il ne dépend d'aucune sémantique de regex (donc M-8
ne l'atteint pas).

### Correctif — `.gitattributes` racine (aucun n'existe aujourd'hui)

```
* text=auto eol=lf
```

`text=auto` laisse git détecter le binaire (plus sûr que `* text eol=lf`) ; `eol=lf` prime sur
`core.autocrlf=true` et rend LF à **tout** checkout, worktree compris. L'index étant déjà en LF
(M-3), `git add --renormalize .` ne doit produire **aucun** changement de contenu — **s'il en
produit, la mesure était fausse, on s'arrête.**

**Recette, à exécuter et non à supposer** : worktree neuf + jonction `node_modules`,
`npx tsc --noEmit && npx jest --silent`, attendu **0 échec**. ⚠ retirer la jonction **avant** de
supprimer le répertoire.

### Statut : tranche HORS CYCLE `eol-lf`, pas absorbée par it4

Trois motifs : (1) elle toucherait des fichiers qu'aucun lot d'it4 ne possède — le « petit refactor à
côté » que R4 interdit ; (2) le critère 10 d'it4 est un **delta de tests exact**, qu'un diff réparant
des suites CRLF rendrait illisible ; (3) la recette d'`eol-lf` est un run **complet** sans rapport
avec la démolition. **Coût : un PATCH de plus.**

## 2. Le découpage définitif — LOT UNIQUE `extinction-arbre`, 24 fichiers (15 S / 9 M / 0 N)

À N=1, « seul et en premier » est vraie **par vacuité**. **C4 se dissout** : la QA a raison, « la
suite `tree-canvas` reste verte » est un critère **de fusion** — et **à N=1 le lot EST la fusion**.

**Ligne de propriété des documents** (règle à retenir) : un `docs/` que **le code rend faux** entre au
lot ; un `docs/` qui **enregistre** l'itération (`specification.json`, roadmap, `CHANGELOG.md`,
`features_history.json`) reste à l'étape 4 des Build Steps.

| # | Fichier | Mk |
|---|---|:--:|
| 1-3 | `brain/utils/playExport.ts` · `playExport.test.ts` · `buildAdventureDocument.ts` | **S** |
| 4 | `brain/index.ts` — retirer l. 597-604 et 606 | **M** |
| 5 | `brain/tree.ts` — commentaire l. 11 ; **fichier survit** | **M** |
| 6 | `brain/persistenceKeys.ts` — retirer `PLAY_SESSION_KEY_PREFIX` (l. 145-151) ; `DOSSIER_SESSION_KEY_PREFIX:101` **survit** | **M** |
| 7 | `src/EditorScreen.tsx` — § 2.2 A ; **fichier survit** | **M** |
| 8 | `play-mode/components/PlayerModal.tsx` | **S** |
| 9-14 | `PlayerRuntime` · `NodeScreen` · `ChoiceList` · `DecorScreen` · `PnjScreen` · `TrapScreen` | **S** |
| 15-16 | `player/engine/sessionEngine.ts` (+`.test.ts`, 24 tests) | **S** |
| 17 | `player/hooks/usePlaySession.ts` | **S** |
| 18-19 | `player/utils/persist.ts` (+`.test.ts`, 8 tests) | **S** |
| 20 | `player/types.ts` — retirer l. 1, 5, 6 ; **corriger la docstring l. 21** (elle nomme `defaultSessionFields()`, supprimé) ; conserver `HeroState`, `SessionEquipmentState`, `PlayPhase`, `SessionState` (R3) | **M** |
| 21 | `docs/EXIGENCE-APERCU-DU-JEU.md` — l. 9 + fin de l. 49 + bandeau | **M** |
| 22 | **`docs/REGLES-PLAY.md`** — bandeau § A (C6) | **M** |
| 23 | **`play-mode/tests/moteurSansIA.test.ts`** — docstring l. 39 **seule** (C7) | **M** |
| 24 | **`brain/components/EditorTopBar.test.tsx`** — commentaire l. 79-80 **seul** (M-2) | **M** |

**RETIRÉ** : `extinctionArbre.test.ts` (N). **Hors de tout lot** : `actionEngine.ts` (+test),
`EditorTopBar.tsx` (D-6, zéro octet), `play-mode/index.ts`.

### Signature — `src/EditorScreen.tsx`, état cible

```ts
import { useMemo } from 'react'                                              // `useState` sort
import { useBrain, useOpenBook, useBookHealth, EditorTopBar } from './brain'  // `buildAdventureDocument` sort
import { TreeCanvas, AutoLayoutButton, SpacingToggle } from './features/tree-canvas'

const RAISON_APERCU_LIVRE =
	"Aperçu indisponible — un livre ne se joue plus ; l'aperçu se lance depuis un dossier d'aventure."
```

l. 19, 41-44, 61 partent ; l. 59 `onPreview={handlePreview}` **devient**
`previewDisabledReason={RAISON_APERCU_LIVRE}`. **Zéro octet d'`EditorTopBar.tsx`.**

### Sur C2 — ce que le tech-lead signe et ne signe pas

M3 implique **arithmétiquement** que `actionEngine.test.ts` (57) survit. La lecture de
l'orchestrateur (177 → 145, suites 7 → 5 ; total 214 → 182, suites 10 → 8) est **cohérente avec les
suppressions**. « Je ne signe pas le chiffre : c'est une valeur de test, elle appartient à la QA.
**Je signe la composition** : deux suites mortes, aucune autre. »

## 3. Refus motivés — à recopier tels quels au § 8

> **R5 — REJETÉ (la coupe en deux lots / deux itérations). MOTIF SUBSTITUÉ, l'ancien RETIRÉ.** Le motif initial — « la fermeture est connexe, à racine unique, donc TOUTE partition en ≥ 2 lots laisse un lot avec `tsc` rouge » — est **retiré : il est faux**, réfuté par contre-exemple **exécuté** (M-4 : la coupe 4a compile, `tsc --noEmit` exit 0). La condition réelle est la **clôture vers le haut**, pas la connexité. **Le refus est maintenu sur le motif de substitution** : 4a et 4b sont **strictement séquentiels**, donc la coupe **n'achète aucun parallélisme** ; elle achète seulement le passage du lot `contrat` en **second**, c'est-à-dire la dérogation qu'elle prétendait éviter. À N=1, « seul et en premier » est vraie **par vacuité**. *(BUG-080 : un refus juste sur un motif faux cède au premier contradicteur.)*

> **R7 — VETO DE DÉMARRAGE (nouveau au tour 2).** Aucun lot d'it4 ne part avant qu'un worktree **neuf** de `HEAD` rende `tsc --noEmit` **et** `jest` verts. Mesuré (M-5) : `contexte.test.ts` rend **4 FAILED / 84** en worktree pristine contre **84 passed** dans la copie principale. Cause épinglée à la ligne : `contexte.test.ts:1745`, `indexOf('\n\n')` rend `-1` en CRLF ; les quatre `it` consommateurs sont **exactement** les quatre échecs. Ce n'est **pas** it4 qui l'introduit, ce n'est **pas** it4 qui le répare : **tranche hors cycle `eol-lf`** (précédents `outillage-2`, `budget-de-contexte`), correctif `.gitattributes` racine `* text=auto eol=lf`, recette = suite **complète** verte en worktree neuf. *(L'argument du « second fichier atteint » — `worker/frontiere.test.ts:105` — est **réfuté par M-8** : `$` en mode `m` matche aussi devant `\r` en ECMAScript, la suite passe. Le veto tient sur `contexte.test.ts` seul ; le périmètre de `eol-lf` se **mesure** par un run complet, jamais par un relevé statique.)*

> **R4 — MAINTENUE, AMENDÉE D'UNE EXCEPTION NOMMÉE.** Les renvois périmés vers `PlayerModal.tsx` (`EcranPartie.tsx:22,23,41`, `CadrePartie.tsx:18,72,91`, `PanneauEvenements.tsx:80`, `play-mode/index.ts:7`, `ouvertureVerbatim.test.tsx:74`) **restent hors lot** : `dev-lot.md` §1 interdit le « petit refactor à côté », et ces renvois deviennent **périmés**, pas menteurs. **Exception unique** : `moteurSansIA.test.ts`, docstring l. 39 seule — it4 fabrique elle-même la quasi-coïncidence du total, et c'est la **dernière** itération où le défaut est lisible. « Ne pas toucher » a ici un coût mesuré ; sur les huit autres renvois, non.

> **RETIRÉ PAR SON AUTEUR (tech-lead) — `extinctionArbre.test.ts`, mon fichier 22.** La QA l'a mesuré **vert par construction** — zéro occurrence des 14 symboles cibles, code de sortie 1, **avant** toute démolition — et strictement dominé par `tsc --noEmit` et la résolution de modules de jest, cette dernière mesurée **rouge sur quatre suppressions simulées**. C'était une abstraction à un seul appelant : ma dette déclarée, pas un contrat. **Sa variante C.3 n'est pas reprise non plus** — instrument différent, exigeant son propre mutant, pour un risque déjà tenu par `tsc` et les règles ESLint d'isolation : ce serait une **seconde** dette à un seul appelant dans le même lot. Le critère 10 se prouve par **C.1** et **C.2**.

> **REJETÉ (tech-lead) — `PLANCHER_PAR_RACINE` dans it4.** Le **diagnostic est retenu** (plancher global de 20 sur base 58 = 65 % de perte tolérée ; l'assertion par racine ne garde que la disparition **totale**). Le **geste est refusé ICI** : re-dériver le seuil d'un instrument sur une mesure **produite par le lot que cet instrument garde** épingle ce que la démolition a fait — **y compris une suppression de trop, qui est précisément ce que le plancher existe pour voir**. Même faute que d'écrire une valeur dorée depuis le code plutôt que depuis `docs/REGLES-DU-JEU.md` : le vert est ce que l'instrument produit, donc la panne est invisible. Le garde de rétrécissement appartient à la **n° 10**, sur une base stabilisée. it4 livre à la place, à coût nul : la **docstring datée et ventilée par racine**, qui est la base dont la n° 10 dérivera son seuil.

> **REJETÉ (tech-lead) — qu'it4 absorbe la réparation CRLF.** (1) Elle ferait entrer des fichiers qu'aucun lot d'it4 ne possède ; (2) le critère 10 est un **delta de tests exact** (« toute autre valeur est un rejet, y compris supérieure ») qu'un diff réparant des assertions CRLF rendrait non opposable ; (3) la recette d'`eol-lf` est un run **complet** dont le résultat ne dit rien d'it4. **Une réparation d'outillage se livre seule, sinon on ne sait jamais lequel des deux gestes a produit le vert.**

## 4. Décisions prises en autonomie faute de spécification

- **Statut d'`eol-lf`** → tranche hors cycle, comité tech-lead seul, un PATCH → si it4 l'absorbe, son delta de tests exact devient illisible et deux fichiers hors propriété entrent au lot.
- **Forme du correctif EOL** → `.gitattributes` plutôt qu'une normalisation test par test → si l'inverse, on répare un site et on laisse la classe ouverte **en croyant la porte réparée**.
- **`text=auto` plutôt que `text`** → git détecte le binaire → si l'inverse, une police ou une image mal classée est corrompue au checkout, visible seulement au `build`.
- **Propriété du commentaire d'`EditorTopBar.test.tsx:79-80`** (laissée sans preneur par l'UX) → attribuée au lot, commentaire seul → si personne ne la prend, une justification fausse reste dans un test vert (KR-258 / BUG-124).
- **`docs/REGLES-PLAY.md` au lot** → oui, bandeau § A seul → si l'inverse, deux règles n'ont plus ni implémentation ni propriétaire écrit et reviennent par une consigne de prompt à la n° 13.
- **Ligne de propriété des `docs/`** → un document que le **code rend faux** entre au lot ; un document qui **enregistre** l'itération reste à l'étape 4.
- **24 fichiers, zéro créé** → un lot de démolition ne crée rien.
