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

/**
 * LE DOMAINE `'jet'` (n° 11 `moteur-arbitre`, lot `contrat`, it2) — PREMIER
 * CONSOMMATEUR RÉEL : `issueDuJet` (`brain/dossier/arbitre.ts`), l'indice d'usage
 * étant `horloge.tour`, jamais un compteur de jets (critère 3 du plan it2).
 */
describe('domaine jet — issueDuJet, un jet au plus par pas', () => {
	const JET: DomaineAlea = 'jet'

	it('creerRng(g, jet, tour) est pur et rejouable : meme cle -> meme suite', () => {
		const premiere = tirer(creerRng(GRAINE, JET, 7), 4)
		const seconde = tirer(creerRng(GRAINE, JET, 7), 4)

		expect(seconde).toEqual(premiere)
		expect(new Set(premiere).size).toBeGreaterThan(1)
	})

	it('deux tours distincts rendent des suites differentes, sur une graine epinglee', () => {
		const tour7 = tirer(creerRng(GRAINE, JET, 7), 4)
		const tour8 = tirer(creerRng(GRAINE, JET, 8), 4)

		expect(tour7).not.toEqual(tour8)
	})

	it('le domaine jet est INDEPENDANT du domaine heros, meme graine et meme indice', () => {
		// Le motif même de DomaineAlea : deux domaines distincts ne doivent jamais
		// produire la même suite, même sur la clé d'usage identique — sans quoi
		// hacherDomaine ne séparerait rien.
		const commeJet = tirer(creerRng(GRAINE, JET, 0), 5)
		const commeHeros = tirer(creerRng(GRAINE, DOMAINE, 0), 5)

		expect(commeJet).not.toEqual(commeHeros)
	})

	it('0 <= x < 1 sur le domaine jet', () => {
		for (const valeur of tirer(creerRng(GRAINE, JET, 3), 50)) {
			expect(valeur).toBeGreaterThanOrEqual(0)
			expect(valeur).toBeLessThan(1)
		}
	})
})

/**
 * LE DOMAINE `'combat'` (n° 13 `moteur-combat`, lot `contrat`, it1) — LE FLUX UNIQUE
 * du rejeu d'un combat : `creerRng(graine, 'combat', horloge.tour)`, consommé du
 * premier round au dernier. UN combat entier est UN pas d'horloge (KR-295), donc UNE
 * clé d'usage, et la promesse de rejeu (KR-292) tient à ce que cette clé rende
 * TOUJOURS la même suite — c'est la propriété que ce bloc épingle, sur les trois axes
 * où elle peut casser : la répétition, la séparation d'avec les deux autres domaines,
 * et la séparation d'un pas à l'autre.
 */
describe('domaine combat — le flux unique du rejeu, un combat = un pas', () => {
	const COMBAT: DomaineAlea = 'combat'
	/** Les rounds d'un long combat : bien au-delà de ce qu'un combat consomme réellement. */
	const TIRAGES_DE_COMBAT = 60

	it('creerRng(g, combat, tour) est pur et rejouable : meme cle -> meme suite, jusqu au dernier round', () => {
		const premiere = tirer(creerRng(GRAINE, COMBAT, 7), TIRAGES_DE_COMBAT)
		const seconde = tirer(creerRng(GRAINE, COMBAT, 7), TIRAGES_DE_COMBAT)

		expect(seconde).toEqual(premiere)
		// La suite n'est pas constante : sans cela, l'égalité ci-dessus serait vraie d'un
		// générateur cassé qui rendrait toujours la même valeur.
		expect(new Set(premiere).size).toBeGreaterThan(TIRAGES_DE_COMBAT / 2)
	})

	it('un flux REJOUE a mi-parcours donne la meme suite : le rejeu ne depend pas du nombre de rounds deja joues', () => {
		// C'est ce que fait le rejeu à chaque posture ajoutée : il recrée le flux et
		// reconsomme DEPUIS LE DÉBUT. Un combat de 3 rounds est donc un PRÉFIXE du même
		// combat à 5 rounds.
		const court = tirer(creerRng(GRAINE, COMBAT, 4), 10)
		const long = tirer(creerRng(GRAINE, COMBAT, 4), 25)

		expect(long.slice(0, 10)).toEqual(court)
	})

	it('le domaine combat est INDEPENDANT de jet ET de heros, meme graine et meme indice', () => {
		// Le motif même de DomaineAlea. UN COMBAT ET UN JET DU MÊME PAS ne partagent
		// aucun tirage : rejouer l'un ne déplace jamais l'autre. Les TROIS paires sont
		// comparées, jamais une seule — `hacherDomaine` ne séparerait rien si 'combat'
		// collisionnait avec l'un d'eux.
		const commeCombat = tirer(creerRng(GRAINE, COMBAT, 0), 5)
		const commeJet = tirer(creerRng(GRAINE, 'jet', 0), 5)
		const commeHeros = tirer(creerRng(GRAINE, 'heros', 0), 5)

		expect(commeCombat).not.toEqual(commeJet)
		expect(commeCombat).not.toEqual(commeHeros)
		// Et sur le tour 7, celui des autres témoins : la séparation vaut pour toute clé.
		expect(tirer(creerRng(GRAINE, COMBAT, 7), 5)).not.toEqual(tirer(creerRng(GRAINE, 'jet', 7), 5))
	})

	it('deux pas distincts rendent des suites differentes — deux combats ne se rejouent jamais pareil', () => {
		const tour7 = tirer(creerRng(GRAINE, COMBAT, 7), 8)
		const tour8 = tirer(creerRng(GRAINE, COMBAT, 8), 8)

		expect(tour7).not.toEqual(tour8)
	})

	it('deux graines distinctes rendent des suites differentes, meme tour', () => {
		expect(tirer(creerRng(1, COMBAT, 7), 5)).not.toEqual(tirer(creerRng(2, COMBAT, 7), 5))
	})

	it('0 <= x < 1 sur le domaine combat, y compris aux graines bornes 0 et 2**32-1', () => {
		for (const graine of [0, GRAINE, 2 ** 32 - 1]) {
			for (const valeur of tirer(creerRng(graine, COMBAT, 3), TIRAGES_DE_COMBAT)) {
				expect(valeur).toBeGreaterThanOrEqual(0)
				expect(valeur).toBeLessThan(1)
			}
		}
	})
})
