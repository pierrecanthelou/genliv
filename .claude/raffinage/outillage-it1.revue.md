# Revue d'exécution — `outillage-1` · **lot A `outil-mutation`** (`contrat`)

> Exécuté par : `dev-contrat`, seul et en premier, le 2026-08-02
> Plan de référence : `.claude/raffinage/outillage-it1.plan.md` § 5 lot A
> État : **lot A terminé, porte verte, rien de commité, aucun bump de version**
> Lot B (`lint-invariants`) peut démarrer.

---

## 1 — Scores mesurés

### Global

| | mutants notés | tués | timeout | survécu | sans couv. | **erreurs** | **score** |
|---|---|---|---|---|---|---|---|
| **S0** — 4 fichiers, avant table dorée | 327 | 217 | 1 | 100 | 9 | **0** | **66,67 %** |
| **S2** — après table dorée + neutralisation | 258 | 209 | 1 | 39 | 9 | **0** | **81,40 %** |

`S0 = (217 + 1) / 327 = 66,67 %` — **conforme au chiffre projeté par le plan (66,67 %, 218/327)**, à la répartition près : le plan écrivait `38` tués pour `challenge.ts`, la mesure donne `37 tués + 1 timeout` (un timeout compte comme détecté). Aucun écart de score.

`S2 = (209 + 1) / 258 = 81,40 %` — projection du plan « ≈ 80 % », vérifiée. La neutralisation a retiré **69 mutants** du dénominateur : **61 survivants et 8 tués**, soit très majoritairement des survivants — c'est la condition qui rendait l'opération légitime (§ 5 : « si S2 < 65, le lot s'arrête »).

### Par fichier — garde-fou « aucun fichier ne recule »

Reporter `clear-text`, recopié tel quel :

| Fichier | S0 | S2 | Δ | tués (S2) | timeout | survécu | sans couv. | **erreurs** |
|---|---|---|---|---|---|---|---|---|
| `src/brain/challenge.ts` | 63,33 | **86,84** | +23,51 | 32 | 1 | 3 | 2 | **0** |
| `src/brain/characteristics.ts` | 44,59 | **94,12** | +49,53 | 32 | 0 | 2 | 0 | **0** |
| `src/brain/combat.ts` | 59,49 | **62,50** | +3,01 | 45 | 0 | 20 | 7 | **0** |
| `src/brain/xp.ts` | 87,72 | **87,72** | 0,00 | 100 | 0 | 14 | 0 | **0** |

**Aucun fichier n'a reculé.** `xp.ts` est stable à la décimale près — attendu : c'est le seul des quatre sans registre, donc le seul que la neutralisation ne touche pas. `combat.ts` reste le point bas (62,50 %) : c'est là que se concentre le bucket (a) de `outillage-2` (20 survivants + 7 sans couverture).

**`RuntimeError` : 0 sur les 4 fichiers** (colonne `# errors` intégralement à zéro, sur les trois runs). Les 2 `RuntimeError` de la mesure initiale étaient dans `bestiary.ts`, qui est sorti du périmètre muté — la question tombe, comme le prévoyait le plan.

### Seuil posé

```
break = floor(81,40 / 5) × 5 = 80
low   = break              = 80
high  = min(80 + 10, 95)   = 90
```

Écrit dans `stryker.config.json` : `"thresholds": { "high": 90, "low": 80, "break": 80 }`. Aucun chiffre non mesuré dans la config. 3ᵉ run de vérification : `Final mutation score of 81.40 is greater than or equal to break threshold 80`, **exit code 0**.

---

## 2 — Inventaire bucketé des 49 mutants restants

**Attention aux numéros de ligne** : ils ont bougé de +1 à +3 par rapport au plan à cause des commentaires de neutralisation insérés. Les lignes ci-dessous sont celles **du dépôt après ce lot** — ce sont elles que `outillage-2` doit utiliser.

### Bucket (b) — neutralisés, épinglés par la table dorée · **fait dans ce lot**

69 mutants passent en `Ignored` (retirés du dénominateur), tous couverts valeur par valeur par `src/brain/rules.golden.test.ts` :

| Cible | Mutants `Ignored` | Directive | Épinglé par |
|---|---|---|---|
| `CHALLENGE_TIERS` (l.26-31) + `DEFAULT_CHALLENGE_TIER` (l.34) | 22 (13 `StringLiteral`, 9 `ObjectLiteral`) | `disable StringLiteral,ObjectLiteral,ArrayDeclaration` l.25 → `restore` l.35 | `CHALLENGE_TIERS est fige pour les 4 tiers` |
| `CHARACTERISTICS` (l.29-38) + `DEFAULT_CHARACTERISTIC` (l.44) + `MONSTER_CHARACTERISTICS` (l.51) | 40 (30 `StringLiteral`, 9 `ObjectLiteral`, 1 `ArrayDeclaration`) | `disable …` l.28 → `restore` l.52 | `CHARACTERISTICS expose exactement les 8 caracteristiques` |
| Libellés de `POSTURES` (l.24, 29, 34) | 3 `StringLiteral` | `disable StringLiteral` l.21 → `restore` l.39 | `POSTURES expose 3 postures avec leurs facteurs de degats` |
| `atA > atD` (`combat.ts` l.113) | 4 (2 `ConditionalExpression`, 2 `EqualityOperator`) | `disable next-line ConditionalExpression,EqualityOperator` — équivalence, bucket (c) | égalité déjà traitée l.110 |
| `BESTIARY` (22 lignes × 11 champs) | hors `mutate` | fichier retiré du périmètre | `la table du bestiaire est figee (22 lignes, tous champs)` + `chaque monstre du bestiaire a un templateId unique` |

**Vérification que la neutralisation est chirurgicale** (extrait du rapport JSON, `combat.ts` l.22-38) :

```
24 StringLiteral      Ignored     ← libellé 'Normale'
29 StringLiteral      Ignored     ← libellé 'Précise'
34 StringLiteral      Ignored     ← libellé 'Défensive'
26 ArithmeticOperator Survived    ← généré : c'est tout l'intérêt (bucket a5)
31 ArithmeticOperator Survived    ← généré (bucket a6)
36 ArithmeticOperator Survived    ← généré (bucket a7)
31 ArrowFunction      Survived    ← généré (bucket a6)
22/23/28/33 ObjectLiteral Killed  ← générés, tués par la table dorée
```

Et le `restore` de `combat.ts` tombe bien **avant** `ecartBand` : les 7 `StringLiteral` des libellés de bandes (l.61-65, `'Manqué'`, `'Coup éraflé'`…) sont toujours générés et **toujours survivants** — ils restent du travail pour `outillage-2`, ils n'ont pas été maquillés en tués.

### Bucket (a) — survivants à tuer · **`outillage-2`, aucun test écrit ici**

39 survivants + 9 sans couverture + 1 timeout (détecté). Correspondance avec les 23 tests nommés du plan :

| Fichier:ligne (dépôt) | ligne au plan | Mutateur(s) | Test du plan |
|---|---|---|---|
| `challenge.ts:52:6` + `52:22` | 50 | Conditional, String (`NoCoverage`) | a1 |
| `challenge.ts:53:6` + `53:22` | 51 | Conditional, String (`NoCoverage`) | a2 |
| `challenge.ts:88:26` | 86 | Equality | a3 |
| `combat.ts:26:45` | 25 | Arithmetic | a5 |
| `combat.ts:31:45` + `31:14` | 30 | Arithmetic, ArrowFunction | a6 |
| `combat.ts:36:53` | 35 | Arithmetic | a7 |
| `combat.ts:61:6` ×2, `61:25`, `61:36`, `61:51` | 59 | Conditional, Equality, Object + String (`NoCoverage`) | a11 |
| `combat.ts:62:37 … 65:39` (7) | 60-63 | String ×7 | a12 |
| `combat.ts:75:9` | 73 | Arithmetic | a9 |
| `combat.ts:107:74/75`, `108:74/75` | 105-106 | Boolean ×4 | a8 |
| `combat.ts:110:6`, `110:26`, `110:36`, `110:93` | 108 | Conditional + Object + String (`NoCoverage`) | a13 |
| `combat.ts:121:14` | 118 | Arithmetic | a10 |
| `combat.ts:125:39` | 122 | String (`NoCoverage`) | a14 |
| `characteristics.ts:80:6` | 78 | Equality | a17 |
| `characteristics.ts:81:6` | 79 | Equality | a16/a17 |
| `xp.ts:27:6` | 27 | Conditional | a18 |
| `xp.ts:45:3` | 45 | Conditional | a19 |
| `xp.ts:48:41` | 48 | Conditional | a20 |
| `xp.ts:68:6`, `68:15`, `69:6`, `69:15` | 68-69 | Conditional + String | a21 |
| `xp.ts:86:6` ×2, `87:6` ×2, `88:6` ×2 | 86-88 | Conditional + Equality ×6 | a22 |
| `xp.ts:99:6` | 99 | Conditional | a23 |
| `challenge.ts:69:29` | — | UpdateOperator → `i--` | **Timeout = détecté**, rien à faire |

**Trois corrections à apporter au bucket (a) avant `outillage-2`** — constatées sur la mesure, pas sur le plan :

1. **a4 et a15 sont mal attribués.** Le plan les motive par « les paramètres `rng` par défaut ne sont pas exécutés ». C'est faux : les 2 `NoCoverage` de `challenge.ts` sont les `StringLiteral` `'TC2'`/`'TC3'` (l.52-53), et les 7 de `combat.ts` sont les littéraux des **branches jamais prises** (`ecart <= 0` l.61, égalité l.110, `'defender'` l.125). Ils seront tués par a1/a2/a11/a13/a14 — **a4 et a15 n'ont pas d'objet propre** et peuvent être retirés, ce qui ramène `outillage-2` à 21 tests.
2. **a16 vise la mauvaise ligne.** `characteristics.ts` old l.78 (`pe < EN / 5`, nouvelle l.80) est une frontière, pas le cas `pe <= 0` : ce dernier n'a **aucun mutant survivant**, il est déjà tenu par `gameSystem.test.ts`. a16 et a17 portent en réalité sur les deux mêmes frontières (l.80 et l.81).
3. **a9 est confirmé tel quel** : `combat.ts:75:9` survit bien avec `× → /` — les deux armes testées ont un multiplicateur de 1, le mutant est indistinguable. Le test doit utiliser une arme à multiplicateur ≠ 1.

### Bucket (c) — équivalents annotés · **fait dans ce lot**

| Fichier:ligne | Mutant | Annotation posée |
|---|---|---|
| `combat.ts:113` (`atA > atD`) | `>` → `>=` | `// Stryker disable next-line ConditionalExpression,EqualityOperator: egalite deja traitee l.108, le mutant >= est equivalent` |

Vérifié dans le rapport JSON : 4 mutants `Ignored` à la l.113, aucun mutant noté. C'est le seul équivalent annoté du lot ; tout autre survivant reste compté.

---

## 3 — Sorties de commande (preuves)

### Porte qualité — inchangée

```
$ npx prettier --check src/brain/rules.golden.test.ts stryker.config.json jest.mutation.cjs package.json
Checking formatting...
All matched files use Prettier code style!

$ npx tsc --noEmit
TSC_OK                                   (exit 0, aucune sortie)

$ npx jest
Test Suites: 55 passed, 55 total
Tests:       644 passed, 644 total
Time:        15.582 s
```

Référence du plan : 54 suites / 639 tests / 19,6 s → **55 suites / 644 tests / 15,6 s**. +1 suite et +5 tests = exactement `rules.golden.test.ts`. La durée ne dégrade pas (mesures successives : 15,5 / 15,3 / 15,6 s).

```
$ npm run lint
✖ 13 problems (13 errors, 0 warnings)

$ npm run lint 2>&1 | grep -c "stryker-tmp"
0
```

**13 erreurs, exactement la base rouge préexistante — aucune ajoutée, aucune corrigée** (elles appartiennent au lot B). Aucun chemin `stryker-tmp` dans la sortie.

> **Écart signalé au lot B, à ne pas découvrir en route** : la table « Base rouge » du plan (§ 5 lot B) énumère 12 erreurs alors qu'elle en annonce 13. La 13ᵉ, absente de la table **et absente de la liste de fichiers du lot B**, est :
> `src/brain/components/ImageUpload.test.tsx:68:32 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
> Sans elle, le critère « `npm run lint` = 0 erreur / 1 warning » du § 10 est inatteignable. Elle est mécanique (typer le mock à la place de `any`) mais elle est **hors du périmètre du lot A** : je ne l'ai pas touchée.

### Run de mutation

```
$ npm run test:mutation
19:10:59 INFO DryRunExecutor Initial test run succeeded. Ran 198 tests in 2 seconds (net 76 ms, overhead 2357 ms).
...
--------------------|------------------|----------|-----------|------------|----------|----------|
                    | % Mutation score |          |           |            |          |          |
File                |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
--------------------|--------|---------|----------|-----------|------------|----------|----------|
All files           |  81.40 |   84.34 |      209 |         1 |         39 |        9 |        0 |
 challenge.ts       |  86.84 |   91.67 |       32 |         1 |          3 |        2 |        0 |
 characteristics.ts |  94.12 |   94.12 |       32 |         0 |          2 |        0 |        0 |
 combat.ts          |  62.50 |   69.23 |       45 |         0 |         20 |        7 |        0 |
 xp.ts              |  87.72 |   87.72 |      100 |         0 |         14 |        0 |        0 |
--------------------|--------|---------|----------|-----------|------------|----------|----------|
INFO MutationTestReportHelper Final mutation score of 81.40 is greater than or equal to break threshold 80
INFO JsonReporter  Your report can be found at: .../reports/mutation/mutation.json
INFO HtmlReporter  Your report can be found at: .../reports/mutation/index.html
INFO MutationTestExecutor Done in 46 seconds.
EXIT=0
```

**Budget tenu** : dry run **2 s** (plafond 20 s), run complet **46 s** (plafond 5 min) à `concurrency: 4` — la référence du plan était 1 min 37 s sur 5 fichiers. `ignoreStatic` **n'a pas été activé** : la définition du score est intacte, le cliquet démarre sur une base saine.

```
$ ls -d stryker-tmp
ls: cannot access 'stryker-tmp': No such file or directory
$ ls -1 reports/mutation/
index.html
mutation.json
```

`cleanTempDir: true` fait son travail : aucun bac à sable ne subsiste pour polluer le `npm run lint` du lot B.

### La table dorée verrouille réellement (sonde, puis restauration)

Une neutralisation n'est légitime que si sa contrepartie échoue quand la valeur bouge. Sonde : `describe` de `AG` modifié dans `characteristics.ts`, run du seul fichier de test, restauration depuis une sauvegarde vérifiée par empreinte.

```
$ md5sum src/brain/characteristics.ts
b0b6273eb3d11017874a37e972846ca0   (avant)

$ sed -i "s/describe: 'Souplesse et vitesse.'/describe: 'Souplesse.'/" src/brain/characteristics.ts
$ npx jest src/brain/rules.golden.test.ts
    expect(received).toBe(expected) // Object.is equality
    Expected: "Souplesse et vitesse."
    Received: "Souplesse."
    > 420 |  expect(CHARACTERISTICS[c].describe).toBe(expected[c].describe)
Tests: 1 failed, 4 passed, 5 total

$ md5sum src/brain/characteristics.ts
b0b6273eb3d11017874a37e972846ca0   (après restauration — identique)
$ git diff --stat src/brain/characteristics.ts
 src/brain/characteristics.ts | 2 ++     (les 2 commentaires Stryker, rien d'autre)
```

Ce test-là tourne dans la **porte de commit**, pas seulement en fin d'itération : c'est le durcissement annoncé au § 5, et il vaut aussi pour le `BESTIARY`, qui n'était couvert par rien.

### Périmètre — aucun fichier touché hors du lot

```
$ git status --short
 M .gitignore
 M CHANGELOG.md
 M docs/WORKFLOW.md
 M package-lock.json
 M package.json
 M src/brain/challenge.ts
 M src/brain/characteristics.ts
 M src/brain/combat.ts
?? jest.mutation.cjs
?? src/brain/rules.golden.test.ts
?? stryker.config.json

$ git diff --stat src/brain/
 src/brain/challenge.ts       | 2 ++
 src/brain/characteristics.ts | 2 ++
 src/brain/combat.ts          | 3 +++
 3 files changed, 7 insertions(+)      ← 7 lignes, 7 commentaires, 0 ligne de logique

$ node -e "console.log(JSON.stringify(require('./package.json').dependencies))"
{"dagre":"^0.8.5","react":"^18.3.1","react-dom":"^18.3.1"}
```

`jest.config.cjs`, `.eslintrc.cjs`, `src/brain/xp.ts`, `src/brain/bestiary.ts`, `code-knowledge.json`, `bug_history.json`, `src/features/**` : **non modifiés**. `stryker-run.log` supprimé. `dependencies` de production strictement inchangées.

---

## 4 — Définition de fini (§ 10) — état à la fin du lot A

| Critère | État |
|---|---|
| Porte qualité verte, inchangée (Prettier → `tsc` → ESLint → `jest`) | **fait** — `tsc` 0, jest 55/644 |
| `npm run lint` = 0 erreur / 1 warning | **lot B** — 13 erreurs préexistantes intactes, aucune ajoutée |
| Aucun chemin `stryker-tmp` / `reports` dans la sortie ESLint | **fait** — `grep -c` = 0 |
| `pre-commit-gate.sh` inchangé (`tsc` + `jest` seuls) | **fait** — fichier non touché |
| Durée `npx jest` à ±10 % de 19,6 s | **fait** — 15,6 s |
| `npm run test:mutation` sort en 0, produit `index.html` + `mutation.json` | **fait** |
| Dry run < 20 s, run < 5 min | **fait** — 2 s / 46 s |
| `stryker-tmp/` absent après le run | **fait** |
| Zéro `RuntimeError` sur les 4 fichiers | **fait** — colonne `# errors` à 0 |
| `thresholds.break = floor(S2/5)×5`, S0 et S2 consignés | **fait** — 80, S0 66,67 / S2 81,40 |
| 4 scores par fichier recopiés, aucun fichier n'a reculé | **fait** — § 1 |
| Cliquet, garde-fou, règle `RuntimeError` dans `docs/WORKFLOW.md` | **fait** — section « Score de mutation — hors porte de commit » |
| Table dorée **et** commentaires livrés ensemble | **fait** — même lot, sonde de vérification § 3 |
| Règle 4 : heuristique dans `docs/WORKFLOW.md` | **fait** — étape 5 d'auto-revue |
| Aucune dépendance de production ajoutée | **fait** |
| Aucun fichier touché hors du lot | **fait** |
| 3 règles ESLint + 5 sondes · 2 couleurs · `code-knowledge.json` KR-151/152/153 | **lot B** |
| Répercussion `CLAUDE.md` / `templates/` / skill `raffinage-iteration` | **non fait — hors périmètre du lot A**, à traiter après le lot B |
| `package.json` PATCH +1 (0.5.33 → 0.5.34) | **non fait, volontairement** — après approbation utilisateur |

---

## 5 — Écarts au plan

| # | Écart | Motif |
|---|---|---|
| 1 | `mutate` de `stryker.config.json` reformaté sur une ligne par Prettier (contenu identique au plan, 4 fichiers) | `npx prettier --check` échouait sur ce fichier ; le dépôt garde ses JSON racine prettier-propres (dernier commit : `prettier --write` sur toute la codebase). Aucune valeur modifiée. |
| 2 | La table dorée épingle aussi `label`/`abbr`/`describe` de `CHARACTERISTICS`, `label` de `CHALLENGE_TIERS` et les libellés de `POSTURES` — au-delà des champs listés au § 7 | Ces littéraux **sont dans les régions neutralisées**. Ne pas les épingler aurait laissé 31 `StringLiteral` (24 de `CHARACTERISTICS`, 4 libellés de tiers, 3 de postures) hors du dénominateur **et** hors de tout test : un relâchement, pas le durcissement annoncé. Aucune valeur inventée, toutes relues dans les fichiers source. |
| 3 | Ajout de `expect(DEFAULT_CHALLENGE_TIER).toBe('TC1')` | Même motif : `DEFAULT_CHALLENGE_TIER` (l.34) est dans la région neutralisée du plan, mais le § 7 ne le faisait épingler par aucun test — alors que son pendant `DEFAULT_CHARACTERISTIC` l'était. Il a 3 consommateurs (`RevealEditor`, `ObjectEditModal`, `TrapEditor`) et aucun test unitaire ne fixait sa valeur. |
| 4 | S0 : `challenge.ts` mesuré à `37 tués + 1 timeout` là où le plan écrivait `38 tués` | Écriture du plan, pas divergence de mesure : un timeout est détecté et compte au numérateur. Score global identique au chiffre projeté (66,67 %). |
| 5 | 13ᵉ erreur ESLint absente de la table « Base rouge » du plan (`ImageUpload.test.tsx:68`, `no-explicit-any`) | Signalée au lot B, **non corrigée** : hors périmètre du lot A, et le fichier n'est pas dans la liste du lot B non plus — à arbitrer avant de viser « 0 erreur ». |
| 6 | Corrections 1 à 3 du bucket (a) (§ 2 ci-dessus) | Constatées sur la mesure post-neutralisation. Elles ne changent rien au lot A ; elles rendent `outillage-2` exécutable sans re-mesure. |
| 7 | L'annotation d'équivalence dit « egalite deja traitee **l.110** » là où le § 7 bucket (c) écrivait « l.108 » | Les commentaires de neutralisation décalent `combat.ts` de +2 lignes : le test d'égalité `atA === atD` est à la l.110 dans le fichier livré. Le texte du plan référençait la numérotation d'avant insertion — une justification qui pointe la mauvaise ligne ne se relit pas. Mutateurs visés et motif inchangés. |

Aucun écart ne touche une signature, un type, un contrat `brain/` ou une ligne de logique.
