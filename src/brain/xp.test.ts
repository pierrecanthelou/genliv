/**
 * Bornes de mutation pour xp.ts (tranche B2 outillage-2, lot B).
 *
 * Valeurs sourcees docs/REGLES-DU-JEU.md § 5, "Gagner de l'XP - formule du
 * Delta (deltaT)" et "Depenser son XP (boutique de progression)" (KR-130).
 */
import { deltaBand, challengeXp, combatXp, characteristicUpgradeCost, mcUpgradeCost } from './xp'

describe('xp (paragraphe 5)', () => {
	it('deltaBand : le delta -1 est la bande facile', () => {
		expect(deltaBand(-1)).toBe('facile')
	})

	it('challengeXp : bande facile, reussite rapporte 1', () => {
		// deltaT = 2 - 3 = -1 -> bande facile. baseXp != 1 et marge >= 3 pour
		// separer du case 'equilibre' si son corps est vide : 1 contre 4.
		expect(challengeXp({ challengeTier: 2, heroTier: 3, success: true, baseXp: 3, margin: 5 })).toBe(1)
	})

	it('challengeXp : la marge 2 ne donne pas le bonus', () => {
		// deltaT = 3 - 3 = 0 -> bande equilibre. marge 2 < 3 : pas de +1.
		expect(challengeXp({ challengeTier: 3, heroTier: 3, success: true, baseXp: 3, margin: 2 })).toBe(3)
	})

	it('combatXp : bandes insignifiant et facile', () => {
		// deltaT = 1 - 3 = -2 -> insignifiant -> 0
		expect(combatXp({ monsterTier: 1, heroTier: 3, bestHit: 'franc', perfect: false })).toBe(0)
		// deltaT = 2 - 3 = -1 -> facile -> 1
		expect(combatXp({ monsterTier: 2, heroTier: 3, bestHit: 'franc', perfect: false })).toBe(1)
	})

	it('characteristicUpgradeCost : les trois frontieres de palier', () => {
		// jamais une valeur interieure au palier, ou < et <= coincident
		expect(characteristicUpgradeCost(6)).toBe(3)
		expect(characteristicUpgradeCost(8)).toBe(7)
		expect(characteristicUpgradeCost(10)).toBe(15)
	})

	it('mcUpgradeCost : le bonus 0 rend null', () => {
		expect(mcUpgradeCost(0)).toBeNull()
	})
})
