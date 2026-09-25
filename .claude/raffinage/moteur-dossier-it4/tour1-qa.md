# TOUR 1 — `qa` — `moteur-dossier` it4

```
RISQUE      — Le critère n° 10 est une affirmation sur la couleur d'un test, et le CADRAGE § 9 la
              sous-estime dangereusement. MESURÉ : la suite `tree-canvas` charge, par DEUX chemins
              indépendants (`nodeView.ts` → baril `brain/index.ts` ; `TreeCanvas.test.tsx` → `App`
              → `EditorScreen` → `PlayerModal` → `PlayerRuntime` → les 5 écrans), la TOTALITÉ de la
              cible. Quatre suppressions simulées, quatre rouges. Ce n'est pas un témoin passif :
              c'est le garde d'intégration le plus fort de l'itération — mais il ne peut être vert
              qu'à la FUSION, jamais lot par lot. Un plan qui l'exige par lot est infaisable.
OBJECTION 1 — Le test-grep du critère n° 10 est VERT PAR CONSTRUCTION : joué aujourd'hui, avant
              toute démolition, il rend zéro occurrence (exit 1). Écrit après la suppression, il
              n'aurait jamais rien mesuré — BUG-084 à l'identique. Il est de surcroît strictement
              plus faible que `tsc --noEmit` et que la résolution de modules de jest.
OBJECTION 2 — Le critère n° 11 n'est PAS satisfiable : `EXIGENCE-APERCU-DU-JEU.md:9` porte 5
              modules ; `src/player/` en importe TROIS de plus qui survivent à it4 — `brain/types.ts`,
              `brain/creatureTypes.ts`, `brain/monsterCapacities.ts`. **Le cadrage en comptait deux.**
OBJECTION 3 — La docstring de `moteurSansIA.test.ts` (« 47 fichiers ») est DÉJÀ FAUSSE aujourd'hui :
              58 mesurés. Défaut KR-258 vivant, dont it4 hérite.
PROPOSITION — (a) « non modifiée » se prouve par `git diff --name-only main -- src/features/tree-canvas/`
              = 0 ligne, constat de revue, pas un test ; (b) le grep se repointe en garde de
              frontière avec mutant écrit ; (c) le critère n° 11 se scinde en deux ; (d) règle de
              lecture chiffrée du total.
VERDICT     — recevable sous réserve, avec VETO CIBLÉ sur le critère n° 11 et sur le test-grep
              TELS QU'ILS SONT ÉCRITS. Levés par les reformulations C.1–C.6.
```

## A.1 — Décomposition de la ligne de base

| Périmètre | Suites | Tests |
|---|---:|---:|
| `src/features/tree-canvas` | 3 | **37** |
| `src/player` | 7 | **177** |
| **Total** | 10 | **214** |

Suites dont le sujet meurt : `sessionEngine.test.ts` **24** · `actionEngine.test.ts` **57** ·
`persist.test.ts` **8** = **89**.

> ⚠ **CORRECTION DE L'ORCHESTRATEUR** — la QA a calculé son delta en supposant qu'`actionEngine.ts`
> meurt. Le `tech-lead` a **mesuré** l'inverse (M3 : 0 occurrence d'arbre sur 346 lignes) et le sort
> hors de tout lot. Si `actionEngine` survit, **`actionEngine.test.ts` survit aussi (57 tests)**, et
> la cible chiffrée devient : `src/player` 177 → **145** (suites 7 → 5), total **214 → 182**
> (suites 10 → 8). Conflit à trancher au tour 2.

## A.2 — Pouvoir séparateur RÉEL de la suite `tree-canvas` — contredit le cadrage

Le cadrage affirmait « `tree-canvas` n'importe aucun symbole de la cible ». **Vrai sur les imports
directs, et sans portée** : le pouvoir séparateur d'une suite jest se lit sur son **graphe de
modules chargés**. `TreeCanvas.test.tsx:4` → `import { App }` → `EditorScreen` → `PlayerModal`
(l. 4) + `buildAdventureDocument` (l. 43).

| Sonde | Module « supprimé » | Résultat | Chaîne de rupture |
|---|---|---|---|
| SIM 1 | `brain/utils/buildAdventureDocument` | **2 suites ROUGES / 3** | `brain/index.ts:606` ← `TreeCanvas.test.tsx:3` |
| SIM 2 | `brain/utils/playExport` | **2 ROUGES / 3** | `brain/index.ts:597` ← `nodeView.ts:1` |
| SIM 4 | `player/components/NodeScreen` | **1 ROUGE / 3** | `PlayerRuntime:6` ← `PlayerModal:3` ← `EditorScreen:4` ← `App:3` |
| SIM 5 | `player/components/PlayerRuntime` | **1 ROUGE / 3** | `PlayerModal:3` ← `EditorScreen:4` ← `App:3` |

*(SIM 3 était verte — **faux négatif de la sonde elle-même** : `PlayerRuntime` importe `'./NodeScreen'`,
le spécificateur ne contient pas `components/`. Consigné parce que c'est le mode de panne que la
skill décrit : la QA a failli signer « aucun pouvoir séparateur » sur une sonde cassée.)*

**Trois conséquences** : (1) la suite `tree-canvas` **ne peut pas rester verte lot par lot** — le
critère n° 10 est un critère **de fusion** ; (2) il est bien plus fort qu'annoncé et **remplace** le
test-grep ; (3) la suite ne repasse au vert que si `EditorScreen.tsx` cesse de rendre `PlayerModal`.

## A.3 — Le test-grep : VERT PAR CONSTRUCTION

`grep -rn` des 14 symboles cibles sur `src/features/tree-canvas/` → **zéro occurrence, exit 1**,
**aujourd'hui, avant toute suppression**. Pouvoir séparateur **nul**, et redondant avec `tsc --noEmit`
(qui voit les `import type` que jest efface) et la résolution de modules de jest.

## A.4 — `moteurSansIA.test.ts` — recompte

| | `player` | `play-mode` | `brain/dossier` | Total |
|---|---:|---:|---:|---:|
| Docstring (2026-09-20) | — | — | — | 47 |
| **Aujourd'hui** | 23 | 9 | **26** | **58** |
| Après démolition projetée | 13 | 8 | 26 | **47** |

1. Le plancher tient (47 ≥ 20) — **et c'est un problème** : `brain/dossier` **seul** (26) dépasse le
   plancher, donc le plancher global a un pouvoir séparateur **nul sur `src/player`**. Ce qui garde
   réellement la racine est l'assertion **par racine** (l. 81-83).
2. La docstring l. 39 est **déjà fausse aujourd'hui** (58 vs 47). Défaut **préexistant** à it4.
3. **Le piège** : après it4 le total redevient **47**, le chiffre même de la docstring — juste **par
   coïncidence**, sur une composition entièrement différente (23/9/26 vs 13/8/26).

## A.5 — Critère n° 11 : TROIS modules hors liste, pas deux

| Module | Occ. | Dans la liste ? | Survit à it4 ? |
|---|---:|---|---|
| `characteristics` 19 · `challenge` 8 · `combat` 7 · `equipment` 5 · `xp` 4 | — | oui | oui |
| **`types`** | 12 | **NON** | **OUI** |
| **`monsterCapacities`** | 4 | **NON** | **OUI** |
| **`creatureTypes`** | 1 | **NON** | **OUI** |
| `tree` | 5 | NON | **non** |
| `utils/playExport` | 1 | NON | **non** |

Instrument existant : **aucun** (`grep -rln "EXIGENCE-APERCU\|extractable"` sur les `*.test.ts*` →
aucun fichier). Seule la moitié « pas d'import de feature » est tenue, par ESLint via
`lintIsolation.test.ts:110`.

## Critères proposés

**C.1** (remplace n° 10, moitié « verte », **constat de fusion**) — **Étant donné** la démolition
livrée en totalité, **quand** `npx jest src/features/tree-canvas` est exécuté seul, **alors** il rend
exactement **3 suites / 37 tests verts**, et `npx jest src/player` rend exactement le delta chiffré
retenu au tour 2. **Toute autre valeur est un rejet, y compris supérieure.**

**C.2** (remplace n° 10, moitié « sans avoir été modifiée », **constat de revue, PAS un test**) —
**Étant donné** le diff complet d'it4, **quand** `git diff --name-only main -- src/features/tree-canvas/`
est exécuté, **alors** il ne rend **aucune ligne**, sortie recopiée dans la revue. *Aucun test ne sait
dire qu'un autre test n'a pas bougé.*

**C.3** (remplace le test-grep, **seulement s'il est conservé**) — **Étant donné** la liste des
fichiers de `src/features/tree-canvas/**` **dérivée du disque**, **quand** leurs spécificateurs
d'import sont balayés, **alors** aucun ne vise autre chose que `react`, `dagre`, `'../../../brain*'`
ou un chemin relatif interne — **pouvoir séparateur prouvé DANS LE LOT** en ajoutant
`import type { EtatSession } from '../../../player/types'` à un fichier de `tree-canvas`,
**vérifiant ROUGE**, puis retirant. Non-vacuité : **≥ 8 fichiers** (11 mesurés).

**C.4** (remplace n° 11, moitié **observable dès it4**) — **Étant donné** `src/player/**` après
repointage, **quand** ses imports sortants sont listés, **alors** aucun ne vise `src/features/**`,
aucun ne vise un service `brain/` à état, et **aucun ne vise `brain/tree` ni `brain/utils/playExport`**
— mesurés à 5 et 1 occurrences aujourd'hui, **tombant à 0**. Cette clause est **rouge aujourd'hui**,
donc son pouvoir séparateur est constatable **sans écrire de mutant**.

**C.5** (remplace n° 11, moitié **liste**, niveau documentaire) — la liste de
`EXIGENCE-APERCU-DU-JEU.md:9` porte **exactement** les modules réellement importés, `types`,
`creatureTypes`, `monsterCapacities` compris, **sans** `tree` ni `utils/playExport`. Non amendée
dans l'itération → critère **`NON VÉRIFIÉ`**, jamais « vérifié parce que jest est vert ».

**C.6** (dette KR-258 héritée) — la docstring de `moteurSansIA.test.ts:39` porte une mesure **datée
et ventilée par racine**, jamais un total nu.

## Définition de fini proposée

1. Porte verte, **`tsc` en tête** (il voit les `import type` que jest efface).
2. **Delta de tests exact** (valeur arrêtée au tour 2), `tree-canvas` **37 → 37**, aucune tolérance.
3. `git diff --name-only main -- src/features/tree-canvas/` **vide**, sortie recopiée.
4. Mutant du garde de frontière joué et **rouge**, ou motif d'abandon écrit au registre.
5. **`npm run test:mutation` NON requis** : it4 ne touche aucun des 4 fichiers mutés.

## Refus motivés — à recopier tels quels au § 8

> **`REJETÉ` (QA) — le test-grep du critère n° 10 tel qu'il est écrit.** MESURÉ le 2026-09-24, **avant toute démolition** : `grep -rn` des 14 symboles cibles sur `src/features/tree-canvas/` rend **zéro occurrence, code de sortie 1**. Asserté `toEqual([])`, ce témoin est **vert par construction** — il l'est déjà sur le dépôt actuel, le serait sur un dépôt où la démolition n'aurait pas eu lieu, et le resterait si `src/features/tree-canvas/` était renommé. Pouvoir séparateur **nul** (BUG-084). Il est en outre strictement plus faible que deux instruments déjà dans la porte : `tsc --noEmit` et la résolution de modules de jest, cette dernière mesurée ROUGE sur 4 suppressions simulées. Retenu à la place : C.2 (constat `git diff`) et, en option, C.3 (garde de frontière avec mutant écrit et vérifié rouge dans son propre lot).

> **`REJETÉ` (QA) — le critère n° 11 tel qu'il est écrit.** Non satisfiable et non observable à it4. MESURÉ : le document liste **5** modules ; `src/player/**` en importe **trois de plus qui SURVIVENT** — `brain/types.ts` (12 occ.), `brain/monsterCapacities.ts` (4), `brain/creatureTypes.ts` (1). **Le cadrage en annonce deux : il manque `monsterCapacities`.** Aucun test ne garde ce critère aujourd'hui ; seule la moitié « pas d'import de feature » est tenue, par ESLint via `lintIsolation.test.ts:110`. Un critère adossé à une liste périmée n'est pas un critère. Retenu à la place : scission en C.4 et C.5.

> **`REJETÉ` (QA) — la lecture « le cadrage établit que `tree-canvas` est aveugle à la démolition ».** L'affirmation vaut sur les **imports directs** et sans portée : le pouvoir séparateur d'une suite jest se lit sur son **graphe de modules chargés**. MESURÉ : `TreeCanvas.test.tsx:4` importe `../../../App`, qui charge `EditorScreen` → `PlayerModal` → `PlayerRuntime` → les 5 écrans ; `nodeView.ts:1` charge le baril, qui ré-exporte `playExport` (l. 597-604) et `buildAdventureDocument` (l. 606). Quatre suppressions simulées, **quatre rouges**. Conséquence : le critère n° 10 est un critère **DE FUSION**, jamais une condition de fin d'un lot isolé.

> **`REJETÉ` (QA) — toute citation d'une couverture globale comme preuve d'it4, y compris à la hausse.** Supprimer ~1 500 lignes dont une part non couverte fait monter le ratio sans qu'aucun test n'ait été écrit : le chiffre mesure le dénominateur.

## Décisions prises en autonomie faute de spécification

- **« tree-canvas reste verte » : par lot ou à la fusion ?** → **à la fusion uniquement**, mesuré infaisable par lot → si l'inverse, le découpage doit fusionner `brain/index.ts` + `EditorScreen.tsx` + `src/player/**` + `play-mode` en **un lot unique**.
- **`tsc` ou `jest` comme instrument principal du n° 10 ?** → **`tsc`** → si on s'en remet à jest, une référence de type pendante passe la porte et n'apparaît qu'au `build` Vite, après le commit.
- **Sort du test-grep** → **abandon recommandé** → si on le garde sans mutant écrit, on livre un instrument dont on ne saura jamais s'il mesure.
- **Périmètre du n° 11** → **scindé en deux** → si on le laisse entier, il sort en `NON VÉRIFIÉ` quoi qu'il arrive.
- **Le delta de tests** → posé comme **valeur exacte, pas comme borne** → en borne (« ≥ N »), une suite supprimée en trop passe inaperçue.
- **Correction de la docstring `moteurSansIA` (KR-258)** → **dans it4**, bien que le défaut lui préexiste → si on la reporte, elle redevient « 47 » et **juste par coïncidence**, donc définitivement non corrigible par lecture.
