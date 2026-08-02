# Plan d'outillage — `qualité` · itération `outillage-1`

> Statut : `porte 1 verte, en attente de validation`
> Produit par : tech-lead (cadrage outillage — le comité ne siège pas) — le 2026-08-02
> Composition : `1 rôle` — motif : outillage de vérification, aucun comportement utilisateur, aucun contrat de design, aucun narratif.
> Exécution : `séquentielle` (2 lots, A puis B — pas d'essaim, pas de worktree)

## Fiche de validation

| | |
|---|---|
| **Démo** | « À la fin, une arithmétique fausse dans les règles de `brain/` fait rougir un instrument. » |
| **Tranche** | outillage seul : runner de mutation hors porte de commit + 3 règles ESLint. Aucun contrat `brain/` touché, aucune dépendance de production. |
| **Lots** | 2 lots · dont `contrat` : **oui** (lot A — il touche `src/brain/`, il s'exécute seul et en premier) |
| **Hors périmètre** | écrire les 23 tests qui tuent les survivants (→ `outillage-2`, spécifiée au § 7) · muter `src/features/**`, `src/player/**`, les services `brain/` · une règle ESLint pour l'état dérivé (refusée et motivée, § 5 lot B règle 4) · l'incohérence « 23 monstres » de `bestiary.ts:2` |
| **Reporté** | élargissement du périmètre muté à `kinds.ts`, `equipment.ts`, `monsterCapacities.ts`, `brain/utils/playExport.ts` |

---

## 1 — But raffiné

À la fin de cette itération, une mutation de l'arithmétique des règles (`challenge`, `combat`, `xp`, `characteristics`) qu'aucun test ne distingue est comptée et opposable par un score mesuré, et trois invariants d'architecture sont refusés par ESLint au lieu d'être relus à la main.

## 2 — Hors périmètre

- Écrire les tests du bucket (a) — c'est `outillage-2`, dont le § 7 ci-dessous est la spécification.
- Muter `src/features/**`, `src/player/**`, les services `brain/`, les composants React.
- Une règle ESLint pour le KR-013/113 (état dérivé) — refusée, remplacée par une heuristique de revue.
- Corriger `src/brain/bestiary.ts:2` (« 23 canonical monsters » pour 22 lignes) — `bug_history.json`, `minor`.

---

## 4 — Contrats `brain/` touchés

**Aucun.** Le lot A modifie trois fichiers de `src/brain/` mais n'y ajoute que des **commentaires** `// Stryker disable` / `restore` et une annotation d'équivalence. Aucun type, aucune signature de service, aucun événement, aucun registre n'est modifié. Le lot reste marqué `contrat` et ordonné en premier au titre de la règle « tout lot touchant `brain/` », et il est exécuté par `dev-contrat`.

---

## 5 — Lots

> Listes de fichiers disjointes. Ordre imposé : **A puis B**.

### Lot A — `outil-mutation` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : rendre le score de mutation exécutable en une commande sur les 4 fichiers de règles, poser le seuil sur une mesure, et verrouiller les registres de données par une table dorée qui tourne, elle, dans la porte de commit.
- **Fichiers** :
  - `package.json` (R) — script `test:mutation`, devDeps `^9.6.1`
  - `package-lock.json` (R)
  - `stryker.config.json` (R)
  - `jest.mutation.cjs` (N)
  - `.gitignore` (R)
  - `docs/WORKFLOW.md` (R)
  - `CHANGELOG.md` (R — les deux entrées, lot A et lot B)
  - `src/brain/rules.golden.test.ts` (N)
  - `src/brain/challenge.ts` (R — commentaires de neutralisation uniquement)
  - `src/brain/characteristics.ts` (R — idem)
  - `src/brain/combat.ts` (R — idem + annotation d'équivalence l.110)
  - `stryker-run.log` (suppression)
- **Ne touche pas** : `jest.config.cjs` (la porte de commit ne bouge pas), `.eslintrc.cjs`, `src/brain/xp.ts` (aucun registre, rien à neutraliser), `src/brain/bestiary.ts` (sort du périmètre muté).

#### Outil

`@stryker-mutator/core` + `@stryker-mutator/jest-runner` en `^9.6.1`, **devDependencies** — `dependencies` reste strictement `dagre`, `react`, `react-dom`. Pas de `@stryker-mutator/typescript-checker` : `disableTypeChecks` suffit, et le checker transformerait en `CompileError` des mutants `StringLiteral` qu'on veut voir survivre.

#### Script npm — ajout pur

```json
"test:mutation": "stryker run"
```

`test`, `build`, `typecheck`, `lint`, `format` inchangés. Le hook `.claude/hooks/pre-commit-gate.sh` n'exécute que `npx tsc --noEmit` et `npx jest` : la mutation reste **hors** de la porte, appelée en fin d'itération.

#### `stryker.config.json`

```json
{
	"$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
	"packageManager": "npm",
	"testRunner": "jest",
	"jest": {
		"projectType": "custom",
		"configFile": "jest.mutation.cjs",
		"enableFindRelatedTests": true
	},
	"mutate": [
		"src/brain/challenge.ts",
		"src/brain/combat.ts",
		"src/brain/xp.ts",
		"src/brain/characteristics.ts"
	],
	"ignorePatterns": [
		"stryker-tmp", "reports", "claude-design", "livraison", "templates",
		"design_handoff_gamebook_editor", "docs", "brief", "public", "dist",
		".claude", "genliv_changes", "worker"
	],
	"disableTypeChecks": "{src,test}/**/*.{ts,tsx}",
	"coverageAnalysis": "perTest",
	"reporters": ["clear-text", "progress", "json", "html"],
	"jsonReporter": { "fileName": "reports/mutation/mutation.json" },
	"htmlReporter": { "fileName": "reports/mutation/index.html" },
	"tempDirName": "stryker-tmp",
	"cleanTempDir": true,
	"timeoutMS": 20000,
	"dryRunTimeoutMinutes": 10,
	"concurrency": 4,
	"thresholds": { "high": 75, "low": 65, "break": 65 }
}
```

Trois réglages sont porteurs, chacun établi par une mesure :

1. **`enableFindRelatedTests: true`** — avec `false`, chaque mutant statique rejoue les 639 tests : run mesuré à **~12 h** (256/467 en 9 min). Avec `true` et le projet jest restreint : **1 min 37 s**. Un test qui n'importe pas le fichier muté ne peut pas le tuer, le rétrécissement ne perd aucun kill.
2. **`tempDirName: "stryker-tmp"` — sans point.** Mesuré : avec `.stryker-tmp`, `npx jest --listTests` dans le bac à sable retourne **zéro test** et Stryker sort sur `No tests were executed` ; le `testMatch` ancré sur `<rootDir>/src/**` ne traverse pas un segment de chemin commençant par un point. Conséquence : `ignorePatterns` d'ESLint (lot B) devient **porteur** et non plus ceinture-et-bretelles, et `cleanTempDir: true` est la seule protection de `npm run lint` entre les deux lots.
3. **`configFile: "jest.mutation.cjs"`** — le run n'exécute que la couche logique. Décision assumée : un mutant de règle que seul un test RTL de composant pouvait tuer est, par définition de cet instrument, un survivant. L'arithmétique doit être épinglée à l'unité, pas incidemment par un rendu.

#### `jest.mutation.cjs` (N)

```js
// Projet Jest DÉDIÉ au run de mutation (hors porte de commit).
// Même transform / même environnement que la porte, mais restreint à la couche
// logique : brain/ + player/engine. Les tests RTL de features sont exclus —
// ils ne doivent pas maquiller un trou d'arithmétique en mutant tué.
const base = require('./jest.config.cjs')

module.exports = {
	...base,
	testMatch: ['<rootDir>/src/brain/**/*.test.ts', '<rootDir>/src/player/**/*.test.ts'],
	collectCoverage: false,
}
```

`testEnvironment` reste `jsdom` (hérité) : `BookService.test.ts`, `UIPreferencesService.test.ts` et `LocalStorageTransport.test.ts` utilisent `window.localStorage`.

#### Périmètre muté et justification des exclusions

| Fichier | Muté | Motif |
|---|---|---|
| `src/brain/challenge.ts` | oui | dés + résolution réussite/échec — le cœur du « le code lance les dés ». |
| `src/brain/combat.ts` | oui | postures, AT, écart, PF, dégâts — l'arithmétique la plus chère du projet. |
| `src/brain/xp.ts` | oui | matrice de gain XP + boutique de progression, entièrement en branches. |
| `src/brain/characteristics.ts` | oui | `maxPV`, `healthState`, `enduranceMalus` — seuils de vie et malus, tous à frontière. |
| `src/brain/bestiary.ts` | **non** | **retiré après mesure** : 134 des 232 survivants y sont, tous `StringLiteral`/`ObjectLiteral` de table. Il change d'instrument, il n'est pas abandonné — la table dorée est un test Jest, donc dans la **porte de commit**, alors que le score ne tourne qu'en fin d'itération. C'est un durcissement. |
| `src/brain/types.ts` | non | types seuls, effacés à la compilation : aucun mutant exécutable. |
| `equipment.ts`, `monsterCapacities.ts`, `outcomes.ts`, `creatureTypes.ts` | non | registres sans branche : n'y produiraient que des mutants de littéraux, mieux tenus par une table dorée que par un score. |
| `kinds.ts` | non | comporte des prédicats mais est hors du périmètre « règles du jeu » ; déjà couvert par `kinds.test.ts`. Candidat d'élargissement déclaré. |
| `**/index.ts` | non | barils de ré-export, aucune logique (déjà exclus de la couverture Jest). |
| `*Service.ts`, `EventBus`, `Router`, `PersistenceService` | non | état + effets, tenus par des tests de contrat ; la mutation y sera utile, mais pas sous le motif « les dés ». |
| `src/brain/components/**`, `src/features/**` | non | composants React : mutants de JSX/style, sans rapport avec les règles ; et ×20 sur le temps de run. |
| `src/player/**` | non | c'est le runtime, pas les règles ; il *consomme* `brain/` et ses tests moteur servent de tueurs dans le run. |

#### Seuil — établi par la mesure, jamais arrondi à un chiffre rond

Mesure de référence du 2026-08-02, 467 mutants, 40,15 tests par mutant, **1 min 37 s** :

| Fichier | Score | tués | timeout | survécu | sans couv. | erreurs |
|---|---|---|---|---|---|---|
| **Tous (5 fichiers)** | **48.17** | 223 | 1 | 232 | 9 | 2 |
| `bestiary.ts` | 4.35 | 6 | 0 | 132 | 0 | 2 |
| `challenge.ts` | 63.33 | 37 | 1 | 20 | 2 | 0 |
| `characteristics.ts` | 44.59 | 33 | 0 | 41 | 0 | 0 |
| `combat.ts` | 59.49 | 47 | 0 | 25 | 7 | 0 |
| `xp.ts` | 87.72 | 100 | 0 | 14 | 0 | 0 |

Le score global de 48,17 % ne mesurait pas la qualité des tests, il mesurait la **densité de littéraux** : `xp.ts` est le seul des cinq fichiers sans registre, et le seul déjà à 87,72 %. C'est un problème de dénominateur, pas de seuil — d'où le retrait de `bestiary.ts` et la neutralisation par mutateur des registres restants.

**Sur le périmètre à 4 fichiers**, à tests inchangés :

```
S0_règles = (38 + 47 + 33 + 100) / (60 + 79 + 74 + 114) = 218 / 327 = 66,67 %
break = floor(66,67 / 5) × 5 = 65
```

→ première écriture : `"thresholds": { "high": 75, "low": 65, "break": 65 }` — vert par construction, à vérifier par un run.

**Après** la table dorée et les commentaires de neutralisation, relancer, lire `S2`, et écrire `break = floor(S2 / 5) × 5`, `low = break`, `high = min(break + 10, 95)`. Projection à vérifier et non à écrire : S2 ≈ 80 %. **Si S2 < 65, le lot s'arrête et rend la main** : cela signifierait que la neutralisation a retiré plus de mutants tués que de survivants.

**Cliquet** : +5 points par itération touchant l'un des 4 fichiers, plafond **90** (relevé de 85 : le dénominateur ne contient plus de données, la queue d'équivalents est plus fine). Jamais desserré. Au-delà du plafond, tout survivant doit porter un `// Stryker disable next-line <Mutator>: <justification>` — un survivant non annoté est un défaut de revue, pas un défaut de seuil.

**Garde-fou par fichier, sans script** : les 4 scores du reporter `clear-text` sont recopiés dans la revue à chaque run. **Aucun fichier ne recule** — `combat.ts` et `challenge.ts` nommément suivis. Pas de script maison : une abstraction à un seul appelant est une dette.

**`RuntimeError`** : Stryker les exclut du dénominateur, donc ils **rétrécissent la base en silence**. Zéro toléré sur les 4 fichiers de logique ; s'il en apparaît un, c'est une panne d'instrument et le score n'est pas lisible tant qu'il est là. (Les 2 observés sont dans `bestiary.ts`, qui quitte le périmètre — la question tombe.)

**Budget** : dry run < 20 s, run complet < 5 min à `concurrency: 4`. Unique levier autorisé si dépassé : `"ignoreStatic": true` — et il faut alors écrire noir sur blanc que le score **change de définition**, ce qui remet le cliquet à zéro sur une nouvelle base.

#### Ordre d'exécution du lot A

1. `.gitignore` d'abord (`stryker-tmp/`, `.stryker-tmp/`, `reports/`, `stryker-run.log`), puis supprimer `stryker-run.log`.
2. Écrire `stryker.config.json` (4 fichiers mutés) + `jest.mutation.cjs` ; confirmer les 2 devDeps et le script `test:mutation`.
3. Porte intacte : `npx tsc --noEmit`, `npx jest`, `npm run lint` — et **aucun chemin `stryker-tmp` dans la sortie ESLint**.
4. `npm run test:mutation` → **S0_règles**, à confirmer ≈ 66,67 %. Écrire `thresholds` à 65.
5. Écrire `src/brain/rules.golden.test.ts`, puis les `// Stryker disable` des trois fichiers de règles. **Les deux atterrissent ensemble ou ni l'un ni l'autre** — c'est ce qui rend la neutralisation légitime.
6. Re-gate. `npm run test:mutation` → **S2**. Écrire `thresholds` définitif. Re-run une 3ᵉ fois pour vérifier l'exit code 0.
7. `docs/WORKFLOW.md` : le script hors-porte, le cliquet, le garde-fou par fichier, la règle `RuntimeError`, et l'heuristique de revue du KR-013/113.
8. Écrire les 4 scores et l'inventaire bucketé dans `.claude/raffinage/outillage-it1.revue.md`.

---

### Lot B — `lint-invariants`

- **Ouvrier** : `dev-lot`
- **But** : faire descendre trois invariants de `CLAUDE.md` dans ESLint, avec messages en français, et rendre `npm run lint` vert.
- **Fichiers** :
  - `.eslintrc.cjs` (R)
  - `src/styles/tokens/colors.css` (R) — ajout de `--overlay-soft`
  - `src/brain/components/Modal.tsx` (R) — 1 couleur en dur
  - `src/features/node-editor/components/NodePreviewModal.tsx` (R) — 1 couleur en dur
  - `code-knowledge.json` (R) — KR-151/152/153 (max actuel : KR-150)
  - `bug_history.json` (R) — la dette `exhaustive-deps`
  - **Purge de la base ESLint rouge** (voir « Base rouge » ci-dessous) : `src/brain/components/ImageUpload.test.tsx` (R), `src/brain/components/ObjectEditor.tsx` (R), `src/features/action-trap/components/TrapEditor.tsx` (R), `src/features/cloud-sync/components/CloudSyncSettings.tsx` (R), `src/player/engine/combatEngine.ts` (R), `src/player/components/CharacterCreationScreen.tsx` (R — **apostrophe l.158 uniquement** ; le `useMemo` l.35 n'est pas touché, il part en dette)
- **Aucune dépendance ajoutée** : les trois règles sont natives (`no-restricted-globals`, `no-restricted-properties`, `no-restricted-imports`, `no-restricted-syntax`).

#### Piège structurel à respecter

**Les options d'une règle ne fusionnent pas entre la racine et un `overrides`** : un `overrides` qui redéclare `no-restricted-syntax` **écrase** le tableau racine. Factoriser les sélecteurs en constantes en tête de `.eslintrc.cjs` (c'est du `.cjs`, donc du JS) et les *spreader* dans chaque bloc. `.eslintrc.cjs` est déjà dans `ignorePatterns` : pas de circularité.

Ajouter à `ignorePatterns` : `'stryker-tmp'`, `'.stryker-tmp'`, `'reports'`.

#### Règle 1 — aucun stockage brut dans une feature (KR-011/111)

**Mécanisme** — `overrides` sur `files: ['src/features/**/*.ts', 'src/features/**/*.tsx']`, `excludedFiles: ['src/features/*/tests/**', 'src/features/**/*.test.ts', 'src/features/**/*.test.tsx']` :

```js
'no-restricted-globals': ['error',
	{ name: 'localStorage', message: MSG_STOCKAGE },
	{ name: 'sessionStorage', message: MSG_STOCKAGE },
],
'no-restricted-properties': ['error',
	{ object: 'window', property: 'localStorage', message: MSG_STOCKAGE },
	{ object: 'window', property: 'sessionStorage', message: MSG_STOCKAGE },
	{ object: 'globalThis', property: 'localStorage', message: MSG_STOCKAGE },
],
```

`no-restricted-globals` seul ne voit pas `window.localStorage` (c'est un `MemberExpression`) : les **deux** règles sont nécessaires. Le `'no-restricted-globals': 'off'` racine reste tel quel, l'override le réactive pour les seules features.

**Message (`MSG_STOCKAGE`)** :
> `Stockage brut interdit dans une feature : passe par PersistenceService (document livre) ou useUIPreferences() (état d'interface), avec une clé déclarée dans brain/persistenceKeys.ts (KR-011/111).`

**Violations existantes : 0** — vérifié deux fois (tech-lead, puis contre-vérification orchestrateur). Dans `src/features/**`, les seules occurrences de `localStorage` en `.ts`/`.tsx` sont des `window.localStorage.clear()` **dans des fichiers de test** — d'où l'`excludedFiles` : un test a besoin de remettre le vrai stockage à zéro. Les autres sont dans `src/brain/**` (implémentations légitimes) et `src/player/utils/persist.ts` (**écart délibéré et documenté**, KR-134 : le runtime doit rester extractible, le préfixe est miroité dans `persistenceKeys.ts`). Ni `brain/` ni `player/` ne sont dans le périmètre de la règle. → **`error` d'emblée, aucune marche `warn`.**

#### Règle 2 — aucun import inter-features

**Mécanisme** — même `overrides` (**sans** exclusion des tests : un test de feature n'a pas plus le droit d'importer une feature sœur) :

```js
const FEATURE_DIRS = [
	'action-decor', 'action-monster', 'action-pnj', 'action-trap',
	'book-creation', 'book-export', 'book-library', 'choice-linking',
	'cloud-sync', 'node-editor', 'outline-view', 'play-mode', 'tree-canvas',
]

'no-restricted-imports': ['error', {
	patterns: [{
		group: FEATURE_DIRS.flatMap((f) => [`**/${f}`, `**/${f}/**`]),
		message: MSG_CROISE,
	}],
}],
```

`no-restricted-imports` (globs minimatch) plutôt qu'un sélecteur AST à regex : pas d'échappement de `/` dans une chaîne esquery, et la règle couvre nativement `import` **et** `export … from`. Le glob `**/action-pnj/**` attrape `'../../action-pnj/utils/gift'` et laisse passer `'../../../brain'`, `'./components/X'`, `'../utils/y'`.

Complément pour l'import dynamique (`no-restricted-imports` ne voit pas `import()` en ESLint 8), dans le `no-restricted-syntax` du même override — aucune barre oblique, donc aucun échappement :

```js
{
	selector: "ImportExpression[source.value=/(action-decor|action-monster|action-pnj|action-trap|book-creation|book-export|book-library|choice-linking|cloud-sync|node-editor|outline-view|play-mode|tree-canvas)/]",
	message: MSG_CROISE,
}
```

**Message (`MSG_CROISE`)** :
> `Import inter-features interdit : une feature ne parle au reste que par brain/ (services, événements, registres). Déplace l'utilitaire partagé dans brain/utils/ (KR-110), le composant partagé dans brain/components/ (KR-109), ou passe par un contrat brain/.`

**Violations existantes : 0** — contre-vérifié. Tous les imports remontants de `src/features/**` visent `brain/` ou `App`. Le seul import hors-feature restant est `src/features/play-mode/components/PlayerModal.tsx:2-3` → `'../../../player/types'` et `'../../../player/components/PlayerRuntime'` : `player/` est le **runtime extractible**, pas une feature ; il est délibérément absent de `FEATURE_DIRS`, ce qui laisse cet import légal. → **`error` d'emblée.**

*Limite connue, à écrire en commentaire dans la config* : un fichier de la feature `X` qui s'auto-référencerait par un chemin remontant (`'../../X/…'`) serait signalé à tort. Il y en a 0 aujourd'hui, et c'est de toute façon un chemin à écrire en relatif court.

#### Règle 3 — aucune couleur en dur dans le code

**Mécanisme** — `no-restricted-syntax`, sélecteurs déclarés une fois et spreadés dans le tableau racine *et* dans celui de l'override features (piège de non-fusion). Portée `src/**/*.ts` **et** `src/**/*.tsx` — l'extension aux `.ts` est gratuite (0 violation) et ferme le trou des styles extraits en objets `React.CSSProperties`.

```js
const NO_HARDCODED_COLOR = [
	{ selector: "Literal[value=/^\\s*#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\s*$/]", message: MSG_COULEUR },
	{ selector: "Literal[value=/^\\s*(rgb|rgba|hsl|hsla)\\(/]", message: MSG_COULEUR },
	{ selector: "TemplateElement[value.raw=/^\\s*(#[0-9a-fA-F]{3}|rgba?\\(|hsla?\\()/]", message: MSG_COULEUR },
]
```

Le premier sélecteur est **ancré début-fin** : il ne vise que les chaînes qui *sont* une couleur, jamais une ancre `'#main'`.

**Message (`MSG_COULEUR`)** :
> `Couleur en dur interdite : rends uniquement depuis un token du design system (var(--nom)). Cherche le nom exact dans src/styles/tokens/ ; s'il manque, ajoute le token, ne code pas la valeur.`

**Violations existantes : 2** — contre-vérifiées à la ligne près :

| Fichier:ligne | Valeur | Correction, dans ce lot |
|---|---|---|
| `src/brain/components/Modal.tsx:89` | `background: 'rgba(43, 43, 41, 0.32)'` | → `var(--overlay-soft)`, **nouveau token** avec **exactement** `rgba(43, 43, 41, 0.32)`. Ne **pas** réutiliser `--overlay` (`rgba(0,0,0,0.45)`) : ce serait un changement visuel non demandé. |
| `src/features/node-editor/components/NodePreviewModal.tsx:342` | `background: 'rgba(0,0,0,0.45)'` | → `var(--overlay)`, token existant (`src/styles/tokens/colors.css:83`), **valeur identique** — vérifié. |

Ajout dans `src/styles/tokens/colors.css`, section `/* ---- Overlay / scrim ---- */`, après la ligne 84 :

```css
	--overlay-soft: rgba(43, 43, 41, 0.32); /* scrim de modale légère (Modal) */
```

Correction petite et exacte → **`error` d'emblée**, pas de marche `warn`.

#### Règle 4 — `useEffect` d'état dérivé (KR-013/113) : **aucune règle. Motif, et remplacement.**

Aucune règle native ni aucun plugin déjà présent ne capture « dérivé ». L'AST ne voit qu'une **forme**, pas une sémantique. Le seul sélecteur plausible serait « un `useEffect` dont le corps entier est un unique `setX(...)` » :

```
CallExpression[callee.name='useEffect'] > ArrowFunctionExpression:first-child > BlockStatement > ExpressionStatement:only-child > CallExpression[callee.name=/^set[A-Z]/]
```

Les **24 `useEffect` du dépôt** (18 fichiers) ont été inspectés : abonnements (`events.on`), écouteurs DOM, `ResizeObserver`, `scrollIntoView`, focus impératif, nettoyage de timers, enregistrement de features dans `App.tsx`. **Zéro miroir d'état dérivé** — le sélecteur remonterait 0 aujourd'hui. Mais ses faux positifs futurs sont des motifs *légitimes* et fréquents (`useEffect(() => { setMounted(true) }, [])`, reset au changement de route). Une règle qui se trompe là-dessus sera désactivée dans le mois, et emportera les deux autres avec elle. **Verdict : pas de règle.**

Remplacement — **heuristique de revue, non bloquante**, à inscrire dans `code-knowledge.json` (KR-153, lot B) et `docs/WORKFLOW.md` (étape 5 d'auto-revue, lot A) :

1. Commande de repérage avant chaque auto-revue touchant un composant ou un hook :
   `rg -n -U --multiline-dotall "useEffect\(\(\) => \{[^}]{0,120}\bset[A-Z]\w*\(" src/`
2. Pour chaque site remonté, **une** question : « la valeur posée par ce `setX` est-elle calculable à partir des props/état déjà présents au rendu ? » Si oui → `useMemo` ou calcul en ligne, l'effet part.
3. `react-hooks/exhaustive-deps` reste à `'error'` : il attrape la sous-classe des miroirs à dépendances mensongères. `// eslint-disable-next-line react-hooks/exhaustive-deps` reste interdit — il y en a 0 dans le dépôt.

#### Base rouge — 13 erreurs ESLint préexistantes sur `main`

Découvert par l'orchestrateur pendant la mesure, **hors cadrage initial du tech-lead**. `git status --short src/` est vide : aucune n'est causée par l'outillage.

La porte annoncée dans `docs/WORKFLOW.md` est « Prettier → `tsc` → ESLint → jest », mais le hook `pre-commit-gate.sh` n'exécute que `tsc` + `jest`. ESLint a donc dérivé sans que rien ne le signale. Ajouter trois règles sur une base rouge rend le critère « `npm run lint` = 0 erreur » invérifiable.

| Fichier | Erreurs | Nature |
|---|---|---|
| `src/brain/components/ImageUpload.test.tsx` | 1 (l.68) | `@typescript-eslint/no-explicit-any` — **oubli de mon énumération initiale** (lecture tronquée de la sortie ESLint : le total 13 était juste, la liste n'en détaillait que 12). Correctif mécanique et déjà idiomatique dans le fichier : les l.61 et 69 portent exactement le `// eslint-disable-next-line @typescript-eslint/no-explicit-any` qui manque au-dessus de la l.68. Préférer supprimer le `any` (`globalThis.Image`) si `tsc` passe ; sinon aligner sur l'idiome voisin. |
| `src/brain/components/ObjectEditor.tsx` | 2 (l.86, 125) | `react/no-unescaped-entities` — apostrophe |
| `src/features/action-trap/components/TrapEditor.tsx` | 2 (l.137, 171) | idem |
| `src/features/cloud-sync/components/CloudSyncSettings.tsx` | 1 (l.79) | idem |
| `src/player/components/CharacterCreationScreen.tsx` | 1 (l.158) | idem |
| `src/player/engine/combatEngine.ts` | 4 (l.284, 285, 383, 384) | `prefer-const` — auto-corrigeable |
| `src/player/engine/combatEngine.ts` | 1 (l.186) | `no-unused-vars` — `_wD` |
| `src/player/components/CharacterCreationScreen.tsx` | 1 (l.35) | `react-hooks/exhaustive-deps` — `assignedIndices` à envelopper dans `useMemo` |

**Décision utilisateur du 2026-08-02 — option (b).**

**12 sont mécaniques** (échappement d'apostrophe, `--fix`, suppression de la variable morte `_wD`, le `no-explicit-any` de `ImageUpload.test.tsx`) et sont corrigées dans le lot B.

**La 13ᵉ passe en dette tracée** : `react-hooks/exhaustive-deps` sur `CharacterCreationScreen.tsx:35` demande d'envelopper `assignedIndices` dans un `useMemo`, soit un vrai changement de code dans le runtime joueur — hors périmètre d'un lot de configuration. Traitement exact :

1. `// eslint-disable-next-line react-hooks/exhaustive-deps` est **interdit** par `CLAUDE.md` et le reste — on ne l'utilise pas ici.
2. À la place, un `overrides` ciblé **sur ce seul fichier**, avec le motif en commentaire dans `.eslintrc.cjs` :

```js
{
	// DETTE — BUG-xxx : `assignedIndices` (l.35) doit passer en useMemo pour
	// stabiliser les dépendances du useCallback l.46. Changement de comportement
	// potentiel dans le runtime joueur : hors périmètre d'un lot de configuration.
	// À repasser en 'error' dès que la correction est faite.
	files: ['src/player/components/CharacterCreationScreen.tsx'],
	rules: { 'react-hooks/exhaustive-deps': 'warn' },
},
```

3. Entrée dans `bug_history.json`, sévérité `minor`, `discovered_at: "regression"`, avec la correction attendue (`useMemo`) et la mitigation (règle en `warn` ciblé, portée à un seul fichier, à lever).

Résultat : `npm run lint` sort **0 erreur / 1 warning connu et tracé**. La dérive est arrêtée et la sortie ESLint redevient lisible pour vérifier les 3 nouvelles règles.

---

## 7 — Tests nommés

### Bucket (b) — tués en bloc, aucun test unitaire à écrire · **lot A**

| Cible | Mutants | Instrument |
|---|---|---|
| `BESTIARY` (22 lignes × 11 champs) | 134 survivants + 2 `RuntimeError` | `rules.golden.test.ts`, table `EXPECTED` explicite. Fichier **sorti de `mutate`**. |
| `CHARACTERISTICS` l.29-36, `DEFAULT_CHARACTERISTIC` l.43, `MONSTER_CHARACTERISTICS` l.50 | 30 `StringLiteral` + 8 `ObjectLiteral` + 1 `ArrayDeclaration` | table dorée + `// Stryker disable StringLiteral,ObjectLiteral,ArrayDeclaration: registre verrouille par rules.golden.test.ts` |
| `CHALLENGE_TIERS` l.25-30, `DEFAULT_CHALLENGE_TIER` l.33 | 12 `StringLiteral` + 5 `ObjectLiteral` | idem |
| Étiquettes de `POSTURES` l.23, 28, 33 | 3 `StringLiteral` | `// Stryker disable StringLiteral` sur le bloc l.21-37 **uniquement** — les `ArithmeticOperator` l.25/30/35 restent générés, c'est tout l'intérêt de neutraliser par mutateur. Le `restore` doit tomber **avant l.58** : les étiquettes de `ecartBand` sont du retour de fonction, pas du registre. |

Tests de la table dorée (tous en **porte de commit**, `src/brain/rules.golden.test.ts`) :

| Test | Assertion |
|---|---|
| `la table du bestiaire est figee (22 lignes, tous champs)` | `EXPECTED[22]` comparé champ à champ à `BESTIARY` (`name`, `tier`, `creatureType`, `stats`, `mc`, `pv`, `pvVariance`, `armour`, `weaponMultiplier`, `capacity`, `templateId`) |
| `chaque monstre du bestiaire a un templateId unique` | `new Set(templateIds).size === BESTIARY.length` |
| `CHALLENGE_TIERS est fige pour les 4 tiers` | `dice`, `notation`, `baseXp`, `difficulty` des 4 tiers, un par un |
| `CHARACTERISTICS expose exactement les 8 caracteristiques` | `CHARACTERISTIC_VALUES` = les 8 codes dans l'ordre ; `MONSTER_CHARACTERISTICS` = les 5 ; `CHARACTERISTIC_MAX === 12` ; `DEFAULT_CHARACTERISTIC === 'FO'` |
| `POSTURES expose 3 postures avec leurs facteurs de degats` | `normale` 1, `precise` 2, `defensive` 0 |

### Bucket (a) — **spécification de `outillage-2`**, aucun test écrit dans cette itération

23 tests nommés pour ≈ 57 mutants. Labels sans apostrophe (règle RTL du dépôt).

> **⚠ Ce tableau est périmé sur trois points — `outillage-2` doit partir de `.claude/raffinage/outillage-it1.revue.md`, qui porte la table de correspondance complète.** Constaté sur la mesure réelle après le lot A :
> - **a4 et a15 sont sans objet** : les `NoCoverage` ne sont pas les paramètres `rng` par défaut mais les littéraux de branches jamais prises — ils tombent avec a1/a2/a11/a13/a14. `outillage-2` passe de 23 à **21 tests**.
> - **a16 vise la mauvaise ligne** : le cas `pe <= 0` n'a aucun mutant survivant ; a16 et a17 portent sur les deux mêmes frontières, désormais l.80 et l.81.
> - **tous les numéros de ligne ont bougé de +1 à +3** — les commentaires de neutralisation ont décalé les trois fichiers.
> - a9 (`combat.ts`, multiplicateur d'arme) est confirmé.

| # | Fichier:ligne | Mutateur | Test nommé | Assertion |
|---|---|---|---|---|
| a1 | `challenge.ts:50` | Conditional + String | `rollTier › la difficulte 2 devient TC2` | `rollTier({ difficulty: 2 }) === 'TC2'` |
| a2 | `challenge.ts:51` | Conditional + String | `rollTier › la difficulte 3 devient TC3` | `rollTier({ difficulty: 3 }) === 'TC3'` |
| a3 | `challenge.ts:86` | Equality | `resolveChallenge › reussite a egalite, echec un cran au-dessus` | jet == carac → `success` vrai ; jet == carac+1 → faux, `margin` négative |
| a4 | `challenge.ts` (2 `NoCoverage`) | — | `randInt et rollDice › le rng par defaut Math.random reste dans les bornes` | `rollDice(2, 6)` sans `rng` ∈ [2,12] sur 200 tirages ; `randInt(3, 3) === 3` |
| a5 | `combat.ts:25` | Arithmetic | `POSTURES › la posture normale soustrait le jet 0-6 au MC` | `rng` non nul : AT strictement < MC |
| a6 | `combat.ts:30` | Arithmetic + ArrowFunction | `POSTURES › la posture precise soustrait le jet 4-10 au MC` | AT ≤ MC−4 ; le corps de la flèche n'est pas `undefined` |
| a7 | `combat.ts:35` | Arithmetic | `POSTURES › la posture defensive ajoute 1D4 au MC` | AT > MC, sans bouclier |
| a8 | `combat.ts:105-106` | Boolean ×4 | `resolveAssault › le bouclier ajoute un second 1D4 en defensive` | AT avec bouclier > AT sans, à `rng` identique ; couvre `!!attacker.shield` et `!!defender.shield` |
| a9 | `combat.ts:73` | Arithmetic | `pfBase › le multiplicateur d arme multiplie, il ne divise pas` | arme à multiplicateur ≠ 1 (`tranchante-2m` 1,3 ou `mains-nues` 0,3) — les deux armes testées valent 1, le mutant est indistinguable |
| a10 | `combat.ts:118` | Arithmetic | `resolveAssault › degats = PF x facteur de posture x facteur d ecart` | un cas posture précise (×2) et un cas coup éraflé (×0,5) |
| a11 | `combat.ts:59` | Conditional + Object + Equality + String | `ecartBand › un ecart nul ou negatif est un coup manque` | `ecartBand(0)` et `ecartBand(-2)` → `{ quality: 'rate', label: 'Manque', factor: 0 }` |
| a12 | `combat.ts:60-63` | String ×~12 | `ecartBand › table complete qualite + libelle des cinq bandes` | écarts 1 à 6 → `quality` **et** `label` assertés (frontières 2 et 4 manquantes) |
| a13 | `combat.ts:108` | Conditional + Object + String | `resolveAssault › AT egaux : egalite, zero degat` | `winner === 'tie'`, `ecart === 0`, `band === 'rate'`, `damage === 0` |
| a14 | `combat.ts:110, 122` | Conditional + Equality + String | `resolveAssault › le defenseur peut gagner l assaut` | MC défenseur > MC attaquant → `winner === 'defender'` |
| a15 | `combat.ts` (7 `NoCoverage`) | — | `combat › les parametres rng par defaut sont executables` | appeler `pfBase` et `resolveAssault` **sans** `rng` ; bornes, pas de valeur |
| a16 | `characteristics.ts:78` | Equality | `enduranceMalus › PE nul ou negatif donne -3` | `pe = 0` et `pe = -1` |
| a17 | `characteristics.ts:79` | Equality | `enduranceMalus › frontiere exacte EN sur 5` | EN = 10, `pe = 2` → −1 (et non −2) ; `pe = 1` → −2 |
| a18 | `xp.ts:27` | Conditional | `deltaBand › delta -1 est facile, delta -3 est insignifiant` | les deux bornes manquantes |
| a19 | `xp.ts:45` | Conditional | `challengeXp › bande facile : 1 en reussite, 0 en echec` | bande jamais atteinte |
| a20 | `xp.ts:48` | Conditional | `challengeXp › la marge 2 ne donne pas le bonus` | `margin: 2` → `baseXp` sans +1 (frontière `>= 3`) |
| a21 | `xp.ts:68-69` | Conditional + String | `combatXp › bandes insignifiant et facile` | `insignifiant` → 0 ; `facile` → 1 |
| a22 | `xp.ts:86-88` | Conditional + Equality ×6 | `combatXp › paliers de cout de caracteristique` | coûts aux niveaux 5, 6, 7, 8, 9 (frontières `<=4`, `<=6`, `<=8` non testées) |
| a23 | `xp.ts:99` | Conditional | `mcUpgradeCost › bonus 0 renvoie null, bonus 1 coute 5` | borne basse jamais testée |

### Bucket (c) — équivalents, à annoter · **lot A**

| Fichier:ligne | Mutant | Annotation exacte |
|---|---|---|
| `combat.ts:110` | `atA > atD` → `>=` | `// Stryker disable next-line ConditionalExpression,EqualityOperator: egalite deja traitee l.108, le mutant >= est equivalent` |

### Vérifications d'outil — **lot B** (sorties collées dans la revue)

| Sonde | Attendu |
|---|---|
| `eslint --stdin --stdin-filename src/features/action-decor/probe.ts` sur `window.localStorage.getItem('x')` | 1 erreur, `MSG_STOCKAGE` |
| idem sur `import { x } from '../../action-pnj/utils/gift'` | 1 erreur, `MSG_CROISE` |
| idem sur `import { useBrain } from '../../../brain'` puis `'../../../player/types'` | **0 erreur** (non-régression) |
| idem sur `const c = '#ff0000'` et `const d = 'rgba(0,0,0,.5)'` | 2 erreurs, `MSG_COULEUR` |
| `npm run lint` sur le dépôt | **0 erreur / 1 warning** (la dette `exhaustive-deps`, cf. désaccord #5 option (b)), aucun chemin `stryker-tmp` dans la sortie |

### Non vérifiable en l'état

- `useEffect` d'état dérivé (KR-013/113) : aucun instrument. Tenu par l'heuristique de revue, règle 4.
- `src/brain/bestiary.ts:2` annonce « 23 canonical monsters » pour 22 lignes → `bug_history.json`, `minor`, hors périmètre.

---

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | orchestrateur vs tech-lead | `tempDirName` avec ou sans point | `RETENU` (orchestrateur) | Mesure : avec `.stryker-tmp`, jest voit 0 test et Stryker sort en erreur. Le tech-lead a accepté sans réserve. `ignorePatterns` du lot B devient porteur. |
| 2 | orchestrateur vs tech-lead | Seuil calculé sur un score gonflé par la table dorée (~190 mutants de données tués d'un coup) | `RETENU` (orchestrateur) | Le tech-lead a requalifié : problème de **dénominateur**, pas de seuil. `bestiary.ts` sort du périmètre muté, les registres restants sont neutralisés par mutateur. Preuve : `xp.ts`, seul fichier sans registre, était seul déjà à 87,72 %. |
| 3 | tech-lead | 23 tests du bucket (a) dans le lot A | `REPORTÉ` → `outillage-2` | 23 > 12 : un lot qui écrit 23 tests ne passe plus la porte isolément. Le § 7 bucket (a) *est* la spécification de `outillage-2`. |
| 4 | tech-lead | Règle ESLint pour le KR-013/113 | `REJETÉ` | L'AST voit une forme, pas une sémantique. 0 violation aujourd'hui, faux positifs futurs légitimes. Remplacée par une heuristique de revue (KR-153). |
| 5 | orchestrateur | 13 erreurs ESLint préexistantes sur `main` | `RETENU` — option (b), décision utilisateur du 2026-08-02 | Les 12 mécaniques sont corrigées dans le lot B. La 13ᵉ (`exhaustive-deps` sur `CharacterCreationScreen.tsx:35`) passe en `warn` par `overrides` ciblé sur ce seul fichier, motif en commentaire + entrée `bug_history.json` `minor`. Pas de `eslint-disable-next-line`, interdit par `CLAUDE.md`. `npm run lint` → 0 erreur / 1 warning tracé. |

---

## 10 — Définition de fini

- [ ] Porte qualité verte, **inchangée** : Prettier → `tsc --noEmit` → ESLint → `jest`
- [ ] `npm run lint` = **0 erreur / 1 warning** (la dette `exhaustive-deps`, tracée en `bug_history.json`) **et** aucun chemin `stryker-tmp` / `reports` dans la sortie
- [ ] Le hook `pre-commit-gate.sh` n'exécute toujours que `tsc --noEmit` + `jest` — aucun ajout de mutation dans la porte
- [ ] Durée de `npx jest` inchangée à ± 10 % (référence : **19,6 s**, 54 suites, 639 tests)
- [ ] `npm run test:mutation` sort en 0, produit `reports/mutation/index.html` et `mutation.json`
- [ ] Dry run < 20 s, run complet < 5 min à `concurrency: 4` (référence : 1 min 37 s sur 5 fichiers)
- [ ] `stryker-tmp/` absent après le run (`cleanTempDir: true` est la seule protection d'ESLint entre les lots)
- [ ] **Zéro `RuntimeError`** sur les 4 fichiers de logique
- [ ] `thresholds.break` = `floor(S2 / 5) × 5`, avec `S0_règles` et `S2` consignés — aucun chiffre non mesuré dans la config
- [ ] Les 4 scores par fichier recopiés dans la revue ; aucun fichier n'a reculé
- [ ] Cliquet (+5 par itération touchant les 4 fichiers, plafond 90, annotation obligatoire au-delà) écrit dans `docs/WORKFLOW.md`
- [ ] Table dorée **et** commentaires de neutralisation livrés ensemble (ou ni l'un ni l'autre)
- [ ] Les 3 règles ESLint prouvées par les 5 sondes du § 7, sorties collées dans la revue
- [ ] Les 2 violations de couleur corrigées, `--overlay-soft` ajouté avec la valeur exacte d'origine (aucun changement visuel)
- [ ] Règle 4 : absence de règle assumée, heuristique inscrite dans `code-knowledge.json` (KR-153) et `docs/WORKFLOW.md`
- [ ] `code-knowledge.json` porte KR-151 (zones d'import), KR-152 (stockage), KR-153 (heuristique état dérivé)
- [ ] Aucune dépendance de **production** ajoutée (`dependencies` strictement `dagre`, `react`, `react-dom`)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Répercussion faite : `CLAUDE.md` (invariants câblés), `templates/plan-iteration.md` (noms de scripts), skill `raffinage-iteration` (instruments « en place »)
- [ ] `package.json` PATCH +1 (0.5.33 → 0.5.34) **après** approbation utilisateur

---

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| Tech Lead | `APPROVE` sous réserve du désaccord #5 | #1 et #2 acceptés après mesure |
| Orchestrateur | porte 1 verte | #5 remonté à l'utilisateur |
