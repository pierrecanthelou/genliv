// ── Messages (French, per CLAUDE.md) — declared once, reused by every rule below. ──
const MSG_STOCKAGE =
	"Stockage brut interdit dans une feature : passe par PersistenceService (document livre) ou useUIPreferences() (état d'interface), avec une clé déclarée dans brain/persistenceKeys.ts (KR-011/111)."

const MSG_CROISE =
	"Import inter-features interdit : une feature ne parle au reste que par brain/ (services, événements, registres). Déplace l'utilitaire partagé dans brain/utils/ (KR-110), le composant partagé dans brain/components/ (KR-109), ou passe par un contrat brain/."

const MSG_COULEUR =
	"Couleur en dur interdite : rends uniquement depuis un token du design system (var(--nom)). Cherche le nom exact dans src/styles/tokens/ ; s'il manque, ajoute le token, ne code pas la valeur."

// Every feature folder under src/features/ — kept as a flat list (not globbed from
// disk) so a new feature must be added here deliberately.
const FEATURE_DIRS = ['book-creation', 'book-library', 'cloud-sync', 'play-mode', 'tree-canvas']

// KNOWN LIMIT (documented, not fixed): a file inside feature X that imports itself
// via a climbing relative path ('../../X/…') would be flagged as a false positive.
// Zero occurrences today; the fix at that call site is a short relative import.
const FEATURE_IMPORT_PATTERNS = FEATURE_DIRS.flatMap((f) => [`**/${f}`, `**/${f}/**`])

// Rule 3 — no hardcoded color anywhere under src/ (render only from design tokens).
// Declared ONCE and spread into both the root `no-restricted-syntax` array and the
// features override's array below: options on a rule do NOT merge between the root
// config and an `overrides` block that redeclares the same rule — an override wins
// outright, so failing to spread here would silently drop the root-level check for
// every file under src/features/**.
const NO_HARDCODED_COLOR = [
	{
		// Anchored start-to-end on purpose: only strings that ARE a color, never an
		// anchor like '#main'.
		selector: 'Literal[value=/^\\s*#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\s*$/]',
		message: MSG_COULEUR,
	},
	{
		selector: 'Literal[value=/^\\s*(rgb|rgba|hsl|hsla)\\(/]',
		message: MSG_COULEUR,
	},
	{
		selector: 'TemplateElement[value.raw=/^\\s*(#[0-9a-fA-F]{3}|rgba?\\(|hsla?\\()/]',
		message: MSG_COULEUR,
	},
]

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
		// and features/ alike; the features override below re-spreads the same array
		// alongside the cross-feature-import ImportExpression selector.
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
		{
			// Rule 2 — no cross-feature import (a test has no more right to import a
			// sibling feature than source does, so no `excludedFiles` here) + rule 3
			// re-spread (options don't merge with the root array, see NO_HARDCODED_COLOR
			// comment above). `no-restricted-imports` uses minimatch globs rather than an
			// AST selector so no `/` needs escaping and both `import` and `export … from`
			// are covered natively; the dynamic `import()` case (invisible to
			// `no-restricted-imports` in ESLint 8) is covered by the ImportExpression
			// selector below, which also needs no slash-escaping.
			files: ['src/features/**/*.ts', 'src/features/**/*.tsx'],
			rules: {
				'no-restricted-imports': [
					'error',
					{
						patterns: [{ group: FEATURE_IMPORT_PATTERNS, message: MSG_CROISE }],
					},
				],
				'no-restricted-syntax': [
					'error',
					...NO_HARDCODED_COLOR,
					{
						selector: `ImportExpression[source.value=/(${FEATURE_DIRS.join('|')})/]`,
						message: MSG_CROISE,
					},
				],
			},
		},
	],
}
