import { alea, creerRng, type DomaineAlea } from './alea'

/**
 * `alea` / `creerRng` — LE CONTRAT DE L'ALÉA KEYÉ (§ 4, § 7 du plan d'itération 1
 * de `moteur-arbitre`).
 *
 * QUATRE PROPRIÉTÉS, ET ELLES NE SE PROUVENT PAS DE LA MÊME FAÇON :
 *  · le REJEU — la même clé rend toujours la même valeur ;
 *  · l'INDÉPENDANCE DES CLÉS — l'ordre d'appel entre deux usages ne change
 *    AUCUNE des deux suites ;
 *  · la SÉPARATION DES CLÉS — deux clés distinctes rendent des suites
 *    distinctes, sur une graine épinglée (mesurée, pas supposée) ;
 *  · les BORNES — `0 ≤ x < 1`, y compris aux deux extrémités de l'espace des
 *    graines (`0` et `2**32 − 1`).
 */

const DOMAINE: DomaineAlea = 'heros'
const GRAINE = 424242

/** `rollCreationPool` consomme exactement 17 tirages (8 × 2D4 + 1 × 1D4, § 7). */
const TIRAGES_ROLL_CREATION_POOL = 17

function tirer(rng: () => number, n: number): number[] {
	return Array.from({ length: n }, () => rng())
}

describe('alea — la fonction pure', () => {
	it('meme cle (graine, domaine, indice) -> toujours la meme valeur, ordre d appel sans effet', () => {
		const premier = alea(GRAINE, DOMAINE, 3)
		// Un appel non lié, ENTRE les deux mesures : s'il existait un état caché
		// (compteur de module, horloge), il aurait bougé ici.
		alea(GRAINE, DOMAINE, 9999)
		const second = alea(GRAINE, DOMAINE, 3)

		expect(second).toBe(premier)
	})

	it('deux indices distincts rendent des valeurs differentes, sur une graine epinglee', () => {
		expect(alea(GRAINE, DOMAINE, 0)).not.toBe(alea(GRAINE, DOMAINE, 1))
	})

	it('deux graines distinctes rendent des valeurs differentes, meme domaine et indice', () => {
		expect(alea(1, DOMAINE, 0)).not.toBe(alea(2, DOMAINE, 0))
	})

	it('0 <= x < 1, sur N indices et sur les graines bornes 0 et 2**32-1', () => {
		for (const graine of [0, 2 ** 32 - 1]) {
			for (let indice = 0; indice < 50; indice += 1) {
				const valeur = alea(graine, DOMAINE, indice)
				expect(valeur).toBeGreaterThanOrEqual(0)
				expect(valeur).toBeLessThan(1)
			}
		}
	})
})

describe('creerRng — l adaptateur () => number, consomme par rollCreationPool', () => {
	it('meme cle -> memes 17 premiers tirages (la taille exacte que consomme rollCreationPool)', () => {
		const premiere = tirer(creerRng(GRAINE, DOMAINE, 0), TIRAGES_ROLL_CREATION_POOL)
		const seconde = tirer(creerRng(GRAINE, DOMAINE, 0), TIRAGES_ROLL_CREATION_POOL)

		expect(seconde).toEqual(premiere)
		// Discriminant : une fermeture qui ne tirerait rien (toujours [NaN,…] ou
		// toujours la même constante) satisferait une égalité vide de sens.
		expect(new Set(premiere).size).toBeGreaterThan(1)
	})

	it('independance des cles — l ordre d appel entre les indices 0 et 1 ne change aucune des deux suites', () => {
		const suite0Seule = tirer(creerRng(GRAINE, DOMAINE, 0), 5)
		const suite1Seule = tirer(creerRng(GRAINE, DOMAINE, 1), 5)

		// INTERCALÉ, sur des fermetures FRAÎCHES — jamais les deux closures
		// ci-dessus réutilisées, ce qui ne prouverait que leur propre compteur.
		const rng0 = creerRng(GRAINE, DOMAINE, 0)
		const rng1 = creerRng(GRAINE, DOMAINE, 1)
		const suite0Intercalee: number[] = []
		const suite1Intercalee: number[] = []
		for (let i = 0; i < 5; i += 1) {
			suite1Intercalee.push(rng1())
			suite0Intercalee.push(rng0())
		}

		expect(suite0Intercalee).toEqual(suite0Seule)
		expect(suite1Intercalee).toEqual(suite1Seule)
	})

	it('indices distincts -> suites differentes sur une graine epinglee', () => {
		const suite0 = tirer(creerRng(GRAINE, DOMAINE, 0), 5)
		const suite1 = tirer(creerRng(GRAINE, DOMAINE, 1), 5)

		expect(suite0).not.toEqual(suite1)
	})

	it('deux fermetures independantes de meme cle tirent la meme suite, meme entrelacees avec une troisieme', () => {
		// REJEU, mais au niveau de l ADAPTATEUR cette fois (le test precedent le
		// prouve au niveau de la fonction pure) : deux `creerRng(G,'heros',0)`
		// distincts sont deux compteurs `position` INDEPENDANTS qui partent tous
		// les deux a zero, donc ils tirent la MEME suite.
		const rngA = creerRng(GRAINE, DOMAINE, 0)
		const rngB = creerRng(GRAINE, DOMAINE, 0)
		const bruit = creerRng(GRAINE, DOMAINE, 1)

		const tiresA: number[] = []
		const tiresB: number[] = []
		for (let i = 0; i < 6; i += 1) {
			tiresA.push(rngA())
			bruit()
			tiresB.push(rngB())
		}

		expect(tiresB).toEqual(tiresA)
	})

	it('0 <= x < 1 sur N tirages, et sur les graines bornes 0 et 2**32-1', () => {
		for (const graine of [0, 2 ** 32 - 1]) {
			for (const valeur of tirer(creerRng(graine, DOMAINE, 0), 50)) {
				expect(valeur).toBeGreaterThanOrEqual(0)
				expect(valeur).toBeLessThan(1)
			}
		}
	})
})
