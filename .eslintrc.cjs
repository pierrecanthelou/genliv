const fs = require('node:fs')
const path = require('node:path')

// ── Messages (French, per CLAUDE.md) — declared once, reused by every rule below. ──
const MSG_STOCKAGE =
	"Stockage brut interdit dans une feature : passe par PersistenceService (document livre) ou useUIPreferences() (état d'interface), avec une clé déclarée dans brain/persistenceKeys.ts (KR-011/111)."

const MSG_CROISE =
	"Import inter-features interdit : une feature ne parle au reste que par brain/ (services, événements, registres). Déplace l'utilitaire partagé dans brain/utils/ (KR-110), le composant partagé dans brain/components/ (KR-109), ou passe par un contrat brain/."

const MSG_BRAIN_VERS_FEATURE =
	"brain/ ne doit jamais importer une feature : brain/ est agnostique des features, les features dépendent de brain/, jamais l'inverse (KR-110, inversion de dépendance)."

const MSG_PLAYER_VERS_FEATURE =
	"Le runtime joueur ne doit jamais importer une feature : `src/player/**` est EXTRACTIBLE (docs/EXIGENCE-APERCU-DU-JEU.md) et doit pouvoir partir vers une autre application sans emporter l'éditeur. Un seul import de feature rend cette extraction impossible. Passe par un contrat brain/."

const MSG_COULEUR =
	"Couleur en dur interdite : rends uniquement depuis un token du design system (var(--nom)). Cherche le nom exact dans src/styles/tokens/ ; s'il manque, ajoute le token, ne code pas la valeur."

/**
 * Les features, DÉRIVÉES DU DISQUE — jamais une liste recopiée à la main.
 *
 * Convergence avec projetx / chrono-sabine (`plan-global.md` § 3, ligne « Lint
 * cross-feature bidirectionnel ») : le tableau `FEATURE_DIRS` codé en dur qui
 * vivait ici était la seule pièce de l'isolation que rien ne tenait à jour. Il
 * a fallu un test dédié (`featureDirs.test.ts`) pour rattraper sa dérive, parce
 * qu'une feature créée sans être ajoutée à la liste était SILENCIEUSEMENT
 * exemptée des deux règles d'isolation — ni erreur, ni avertissement.
 *
 * En lisant `src/features/` au chargement de la config, la classe de panne
 * disparaît par construction : il n'y a plus de liste à tenir à jour, donc plus
 * de dérive possible entre la liste et le disque. Le test qui gardait la liste
 * est remplacé par `lintIsolation.test.ts`, qui prouve que les règles MORDENT
 * (un import croisé synthétique est bien refusé) au lieu de vérifier qu'un
 * littéral est à jour.
 *
 * `readdirSync` est lu UNE fois, au chargement de la config par ESLint — pas par
 * fichier lint&eacute;. Un dossier de feature ajouté pendant que le watch tourne exige
 * un redémarrage d'ESLint : c'est le même coût qu'éditer ce fichier, en moins.
 */
const RACINE_FEATURES = path.join(__dirname, 'src', 'features')
const FEATURE_DIRS = fs
	.readdirSync(RACINE_FEATURES, { withFileTypes: true })
	.filter((entree) => entree.isDirectory())
	.map((entree) => entree.name)
	.sort()

/** Les globs minimatch qui désignent un import vers l'une des features nommées. */
function motifsDImport(features) {
	return features.flatMap((f) => [`**/${f}`, `**/${f}/**`])
}

// Rule 3 — no hardcoded color anywhere under src/ (render only from design tokens).
// Declared ONCE and spread into every override that redeclares `no-restricted-syntax`:
// options on a rule do NOT merge between the root config and an `overrides` block that
// redeclares the same rule — an override wins outright, so failing to spread here would
// silently drop the root-level check for the files that override matches.
const NO_HARDCODED_COLOR = [
	{
		// ANCRÉ DÉBUT-ET-FIN, ET ÇA RESTE VOLONTAIRE : seules les chaînes qui SONT
		// une couleur, jamais une ancre comme '#main'. Ne PAS l'aligner sur la
		// recherche de sous-chaîne des deux motifs ci-dessous — un hexadécimal court
		// est indiscernable d'autre chose (`Section #123`, `#facade-panel`), et une
		// règle qui rougit sur de la prose est désactivée dans le mois. C'est le
		// faux positif épinglé par `lintIsolation.test.ts`, pas un oubli.
		selector: 'Literal[value=/^\\s*#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\s*$/]',
		message: MSG_COULEUR,
	},
	{
		// BUG-027, SECONDE MOITIÉ (revue de PR du 2026-08-13) — la fiche du bug
		// affirmait que « les deux sélecteurs Literal sont ancrés début-et-fin et ne
		// sont pas concernés ». C'était vrai du hex, FAUX de celui-ci : il était
		// ancré au DÉBUT seulement, sans `$` ni recherche de sous-chaîne, donc la
		// cause racine exacte de BUG-027 y vivait à l'identique. Conséquence
		// mesurée : l'idiome dominant du dépôt pour une valeur CSS composite est une
		// chaîne à simples quotes (`borderRight: '1px solid var(--border-subtle)'`,
		// 349 occurrences sur 52 fichiers) — y écrire '1px solid rgba(0,0,0,.2)'
		// passait les trois motifs. Corriger le gabarit sans corriger celui-ci
		// aurait fermé la moitié la moins fréquentée de la classe.
		//
		// Sans risque de faux positif, contrairement au hex : `rgb(` / `hsl(`
		// n'apparaissent pas en prose. Même lookbehind de masquage `var()`.
		selector: 'Literal[value=/(?<!var\\([^()]{0,120})\\b(rgb|rgba|hsl|hsla)\\(/]',
		message: MSG_COULEUR,
	},
	{
		// BUG-027 (corrigé) — la couleur se cherche PARTOUT dans le quasi, plus
		// seulement en tête. L'ancien motif était ancré `^\s*(…)`, si bien que
		// `` `background: #abc123` `` passait le lint alors que `` `#abc123` ``
		// était bien refusé.
		//
		// Le lookbehind BORNÉ `(?<!var\([^()]{0,120})` porte l'équivalent du
		// masquage `var(...)` de projetx (`eslint-local-rules.js`,
		// `no-literal-color-in-style`) : une couleur écrite en REPLI d'un token
		// (`var(--ombre, 0 6px rgba(0,0,0,.18))`) n'est pas une couleur en dur,
		// c'est une valeur de secours. Le masquage de projetx compte les
		// parenthèses (il faut une fonction de règle pour cela) ; ici un
		// lookbehind borné suffit et se lit dans le sélecteur, parce que le dépôt
		// ne porte AUCUN repli `var(--x, …)` ni AUCUN `color-mix()` (mesuré le
		// 2026-08-13 : 0 occurrence). Le jour où un repli est écrit, ce garde
		// tient tant que le repli fait moins de 120 caractères ; au-delà, c'est
		// une règle de plugin qu'il faut, pas un sélecteur plus long.
		//
		// Le nombre de chiffres hexadécimaux est fermé (3, 4, 6 ou 8) avec un
		// garde de fin `(?![0-9a-fA-F])` pour ne pas mordre sur un identifiant
		// plus long qui commencerait par un `#`.
		selector:
			'TemplateElement[value.raw=/(?<!var\\([^()]{0,120})(#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])|\\b(rgb|rgba|hsl|hsla)\\()/]',
		message: MSG_COULEUR,
	},
]

/**
 * Un bloc `overrides` PAR FEATURE, plutôt qu'un seul bloc sur `src/features/**`.
 *
 * Ce que ça achète, en plus de la dérivation : la feature X n'interdit que les
 * AUTRES features, donc le faux positif documenté par l'ancien commentaire
 * (« un fichier de la feature X qui s'importe lui-même par un chemin relatif
 * grimpant `../../X/…` serait signalé ») DISPARAÎT au lieu d'être toléré.
 *
 * Les noms de dossier alimentent une alternative de regex pour le sélecteur
 * `ImportExpression` : ils ne contiennent aujourd'hui que `[a-z-]`, et un nom
 * portant un métacaractère casserait le sélecteur — d'où l'échappement.
 */
function echapperRegex(texte) {
	return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const OVERRIDES_PAR_FEATURE = FEATURE_DIRS.map((feature) => {
	const autres = FEATURE_DIRS.filter((f) => f !== feature)
	return {
		files: [`src/features/${feature}/**/*.ts`, `src/features/${feature}/**/*.tsx`],
		rules: {
			// Rule 2 — no cross-feature import (a test has no more right to import a
			// sibling feature than source does, so no `excludedFiles` here).
			// `no-restricted-imports` uses minimatch globs rather than an AST selector so
			// no `/` needs escaping and both `import` and `export … from` are covered
			// natively; the dynamic `import()` case (invisible to `no-restricted-imports`
			// in ESLint 8) is covered by the ImportExpression selector below.
			'no-restricted-imports':
				autres.length === 0
					? 'off'
					: ['error', { patterns: [{ group: motifsDImport(autres), message: MSG_CROISE }] }],
			// Rule 3 re-spread (options don't merge with the root array, see the
			// NO_HARDCODED_COLOR comment above).
			'no-restricted-syntax': [
				'error',
				...NO_HARDCODED_COLOR,
				...(autres.length === 0
					? []
					: [
							{
								// ANCRÉ SUR LES BORNES DE SEGMENT, pour avoir la MÊME sémantique
								// que le `no-restricted-imports` voisin, qui utilise minimatch et
								// est exact au segment. Une recherche de sous-chaîne libre
								// ferait revenir, pour la seule forme dynamique, le faux positif
								// d'auto-import que ce découpage supprime : avec une future
								// `dossier-canon-2`, `import('../../dossier-canon-2/index')`
								// écrit DEPUIS `dossier-canon-2` contient la sous-chaîne
								// `dossier-canon`, qui est dans ses `autres`.
								selector: `ImportExpression[source.value=/(^|[./])(${autres.map(echapperRegex).join('|')})(\\/|$)/]`,
								message: MSG_CROISE,
							},
						]),
			],
		},
	}
})

module.exports = {
	root: true,
	env: { browser: true, es2020: true, node: true, jest: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react/jsx-runtime',
		'plugin:react-hooks/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
	settings: { react: { version: 'detect' } },
	plugins: ['@typescript-eslint', 'react', 'react-hooks'],
	ignorePatterns: [
		'dist',
		'node_modules',
		'design_handoff_gamebook_editor',
		'.eslintrc.cjs',
		'stryker-tmp',
		'.stryker-tmp',
		'reports',
	],
	rules: {
		'react-hooks/exhaustive-deps': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'no-restricted-globals': 'off',
		// Rule 3 (no hardcoded color) applies everywhere under src/ — brain/, player/,
		// and features/ alike; every override below re-spreads the same array.
		'no-restricted-syntax': ['error', ...NO_HARDCODED_COLOR],
	},
	overrides: [
		{
			// DETTE — BUG-025 : `assignedIndices` (l.35) doit passer en useMemo pour
			// stabiliser les dépendances du useCallback l.46. Changement de comportement
			// potentiel dans le runtime joueur : hors périmètre d'un lot de configuration.
			// À repasser en 'error' dès que la correction est faite.
			files: ['src/player/components/CharacterCreationScreen.tsx'],
			rules: { 'react-hooks/exhaustive-deps': 'warn' },
		},
		{
			// Rule 1 — no raw storage global inside a feature (KR-011/111). Tests are
			// excluded: a test legitimately resets the real store via
			// window.localStorage.clear(). `no-restricted-globals` alone does not see
			// `window.localStorage` (it's a MemberExpression, not a bare identifier) —
			// `no-restricted-properties` is required in addition.
			files: ['src/features/**/*.ts', 'src/features/**/*.tsx'],
			excludedFiles: ['src/features/*/tests/**', 'src/features/**/*.test.ts', 'src/features/**/*.test.tsx'],
			rules: {
				'no-restricted-globals': [
					'error',
					{ name: 'localStorage', message: MSG_STOCKAGE },
					{ name: 'sessionStorage', message: MSG_STOCKAGE },
				],
				'no-restricted-properties': [
					'error',
					{ object: 'window', property: 'localStorage', message: MSG_STOCKAGE },
					{ object: 'window', property: 'sessionStorage', message: MSG_STOCKAGE },
					{ object: 'globalThis', property: 'localStorage', message: MSG_STOCKAGE },
				],
			},
		},
		// Rule 2 — un bloc par feature, dérivé du disque (voir OVERRIDES_PAR_FEATURE).
		...OVERRIDES_PAR_FEATURE,
		{
			// Rule 2 bis — L'AUTRE SENS, qui n'était tenu par AUCUNE règle jusqu'ici :
			// `brain/` ne doit jamais importer une feature. CLAUDE.md le dit
			// (« Feature-agnostic — never imports from features/ ») et rien ne le
			// vérifiait ; c'est la moitié manquante de l'isolation, portée depuis
			// chrono-sabine via `plan-global.md` § 3.
			//
			// Zéro violation au moment où la règle est posée (mesuré le 2026-08-13 :
			// aucun `from '…features/…'` sous `src/brain/`), donc elle arrive verte —
			// elle interdit une régression, elle ne rattrape pas une dette.
			//
			// `src/player/**` a son propre bloc ci-dessous : ÊTRE le runtime extractible
			// est une raison PLUS FORTE de le lui interdire, pas une raison de l'en
			// exempter (revue de PR du 2026-08-13 — l'argument était inversé ici).
			files: ['src/brain/**/*.ts', 'src/brain/**/*.tsx'],
			rules: {
				'no-restricted-imports': [
					'error',
					{
						patterns: [
							{ group: ['**/features/*', '**/features/*/**'], message: MSG_BRAIN_VERS_FEATURE },
						],
					},
				],
				'no-restricted-syntax': [
					'error',
					...NO_HARDCODED_COLOR,
					{
						selector: 'ImportExpression[source.value=/features\\//]',
						message: MSG_BRAIN_VERS_FEATURE,
					},
				],
			},
		},
		{
			// Rule 2 ter — la MOITIÉ RESTANTE, ouverte par la revue de PR du
			// 2026-08-13 : `src/player/**` ne doit pas davantage importer une feature.
			// L'exigence n'est pas l'inversion de dépendance (le runtime n'est pas
			// `brain/`) mais la PORTABILITÉ : `docs/EXIGENCE-APERCU-DU-JEU.md` fait du
			// runtime joueur un module extractible vers une autre application, et un
			// seul import de feature emporte l'éditeur avec lui.
			//
			// Zéro violation au moment où la règle est posée (mesuré le 2026-08-13) :
			// elle interdit une régression, elle ne rattrape pas une dette.
			files: ['src/player/**/*.ts', 'src/player/**/*.tsx'],
			rules: {
				'no-restricted-imports': [
					'error',
					{
						patterns: [
							{ group: ['**/features/*', '**/features/*/**'], message: MSG_PLAYER_VERS_FEATURE },
						],
					},
				],
				'no-restricted-syntax': [
					'error',
					...NO_HARDCODED_COLOR,
					{
						selector: 'ImportExpression[source.value=/features\\//]',
						message: MSG_PLAYER_VERS_FEATURE,
					},
				],
			},
		},
	],
}
