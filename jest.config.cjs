module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
	moduleNameMapper: {
		'\\.(css)$': '<rootDir>/test/styleMock.cjs',
	},
	// `worker/**` entre dans la découverte à l'itération 1 de `dossier-copilote` :
	// `worker/index.ts` n'avait AUCUN test au 2026-09-17 et ce `testMatch`, ancré sur
	// `src/**`, ne pouvait pas en voir un (KR-233). La route `POST /ia/:role` arrive
	// dans le MÊME lot que son appelant ET avec son test — celui-ci tourne sous la
	// pragma `@jest-environment node`, qui expose `Request`/`Response`/`fetch`
	// nativement, là où `testEnvironment: 'jsdom'` ci-dessus ne les donne pas.
	testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}', '<rootDir>/worker/**/*.test.ts'],
	// `worker/**` N'ENTRE PAS dans la couverture, et c'est délibéré : l'unique
	// fichier de production du worker s'appelle `index.ts`, donc il tombe sous
	// `coveragePathIgnorePatterns: 'index.ts$'` ci-dessous (l'exclusion des barils
	// de ré-export). Ajouter le glob ici donnerait l'APPARENCE d'une mesure sans
	// en produire une — pire qu'un silence assumé. L'assurance du worker est
	// portée par ses deux suites dédiées (`worker/index.test.ts`, 7 branches, et
	// `worker/frontiere.test.ts`), pas par un chiffre. À rouvrir le jour où le
	// worker gagne un second fichier de production, qui, lui, serait mesurable.
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/main.tsx'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		// index.ts barrel re-export files have no logic to test
		'index.ts$',
	],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: { jsx: 'react-jsx' },
			},
		],
	},
}
