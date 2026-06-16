module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
	moduleNameMapper: {
		'\\.(css)$': '<rootDir>/test/styleMock.cjs',
	},
	testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
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
