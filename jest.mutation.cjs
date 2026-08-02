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
