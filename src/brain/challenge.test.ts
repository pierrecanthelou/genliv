/**
 * Bornes de mutation pour challenge.ts (tranche B2 outillage-2, lot B).
 *
 * Valeurs sourcees docs/REGLES-DU-JEU.md sauf mention contraire (KR-130) :
 * - rollTier (challenge.ts:42-47) mappe une `difficulty` numerique heritee
 *   vers un tier. Aucune section de REGLES-DU-JEU.md ne porte ce mapping :
 *   c'est une valeur d'implementation de migration (KR-021/116), sourcee sur
 *   le JSDoc du fichier, pas sur une regle de jeu.
 * - resolveChallenge : REGLES-DU-JEU.md § 2, "resultat de des inferieur ou
 *   egal a la caracteristique testee".
 */
import { rollTier, resolveChallenge } from './challenge'

const fixed = (v: number) => () => v

describe('challenge (paragraphe 2)', () => {
	it('rollTier : la difficulte 2 devient TC2', () => {
		expect(rollTier({ difficulty: 2 })).toBe('TC2')
	})

	it('rollTier : la difficulte 3 devient TC3', () => {
		expect(rollTier({ difficulty: 3 })).toBe('TC3')
	})

	it('resolveChallenge : reussite a egalite avec la caracteristique', () => {
		// TC1 = 1D6, rng au maximum -> roll = 6 (frontiere roll === caracteristique)
		const atEquality = resolveChallenge('TC1', 6, fixed(0.999))
		expect(atEquality.success).toBe(true)
		expect(atEquality.margin).toBe(0)

		// meme roll (6), caracteristique un cran en dessous -> echec, marge negative
		const oneAbove = resolveChallenge('TC1', 5, fixed(0.999))
		expect(oneAbove.success).toBe(false)
		expect(oneAbove.margin).toBe(-1)
	})
})
