/**
 * Bornes de mutation pour characteristics.ts (tranche B2 outillage-2, lot B).
 *
 * Valeurs sourcees docs/REGLES-DU-JEU.md § 1, "Malus d'epuisement" (KR-130) :
 * PE < EN/5 -> -2, PE < EN/3 -> -1, sinon 0. Les deux `it` ci-dessous
 * appellent les frontieres EXACTES (PE === EN/5, PE === EN/3) : a l'interieur
 * d'un palier, `<` et `<=` coincident et ne prouvent rien.
 */
import { enduranceMalus } from './characteristics'

describe('characteristics (paragraphe 1)', () => {
	it('enduranceMalus : frontiere exacte EN sur 5', () => {
		// EN 10 -> EN/5 = 2 ; pe === 2 doit rendre -1, pas -2
		expect(enduranceMalus(2, 10)).toBe(-1)
	})

	it('enduranceMalus : frontiere exacte EN sur 3', () => {
		// EN 15 -> EN/3 = 5 ; pe === 5 doit rendre 0, pas -1
		expect(enduranceMalus(5, 15)).toBe(0)
	})
})
