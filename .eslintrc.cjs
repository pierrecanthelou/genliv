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
	ignorePatterns: ['dist', 'node_modules', 'design_handoff_gamebook_editor', '.eslintrc.cjs'],
	rules: {
		'react-hooks/exhaustive-deps': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'no-restricted-globals': 'off',
	},
}
