import {
	maxPV,
	healthState,
	enduranceMalus,
} from './characteristics'
import {
	CHALLENGE_TIERS,
	challengeTierValue,
	rollTier,
	resolveChallenge,
} from './challenge'
import { maitriseDesCoups, ecartBand, pfBase, resolveAssault } from './combat'
import { tierOf, deltaBand, challengeXp, combatXp, characteristicUpgradeCost, mcUpgradeCost, canUpgradeMC } from './xp'
import { BESTIARY, BESTIARY_BY_TEMPLATE } from './bestiary'
import { WEAPONS } from './equipment'

/** A fixed RNG (returns `v`) so dice are deterministic in tests. */
const fixed = (v: number) => () => v

describe('game system — characteristics (§ 1)', () => {
	it('PV = FO + AG + EN', () => {
		expect(maxPV({ FO: 4, AG: 3, EN: 5 })).toBe(12)
	})
	it('health thresholds: inconscient at ≤0, mort at ≤ -CA', () => {
		expect(healthState(5, 4)).toBe('ok')
		expect(healthState(0, 4)).toBe('inconscient')
		expect(healthState(-4, 4)).toBe('mort')
	})
	it('endurance malus worsens in the corrected order (EN/3 before EN/5)', () => {
		const EN = 12 // thirds at 4, fifths at 2.4
		expect(enduranceMalus(5, EN)).toBe(0)
		expect(enduranceMalus(3, EN)).toBe(-1) // < EN/3 (4)
		expect(enduranceMalus(2, EN)).toBe(-2) // < EN/5 (2.4)
		expect(enduranceMalus(0, EN)).toBe(-3)
	})
})

describe('game system — challenge tiers (§ 2)', () => {
	it('dice + base XP per tier', () => {
		expect(CHALLENGE_TIERS.TC2.notation).toBe('2D5')
		expect(challengeTierValue('TC4')).toBe(4)
	})
	it('rollTier migrates a legacy numeric difficulty', () => {
		expect(rollTier({ difficulty: 1 })).toBe('TC1')
		expect(rollTier({ difficulty: 7 })).toBe('TC4')
		expect(rollTier({ tier: 'TC3', difficulty: 1 })).toBe('TC3')
	})
	it('resolveChallenge: success when total ≤ stat', () => {
		// 1D6 forced to 1 ≤ 3 → success, margin 2
		expect(resolveChallenge('TC1', 3, fixed(0))).toEqual({ roll: 1, success: true, margin: 2 })
	})
})

describe('game system — combat (§ 3)', () => {
	it('MC = floor((AG + DX + IG) / 3)', () => {
		expect(maitriseDesCoups({ AG: 6, DX: 4, IG: 3 })).toBe(4)
	})
	it('écart bands', () => {
		expect(ecartBand(1).factor).toBe(0.5)
		expect(ecartBand(3).factor).toBe(1)
		expect(ecartBand(5).factor).toBe(1.5)
		expect(ecartBand(6)).toMatchObject({ factor: 2, degradesArmour: true })
	})
	it('PF base preserves decimals; ranged uses 4D2 in place of FO', () => {
		expect(pfBase({ FO: 5, MC: 4, weapon: 'epee-1m' })).toBeCloseTo((5 + 2) * 1)
		// distance forces FO→4D2; each d2 fixed to 2 → 8
		expect(pfBase({ FO: 5, MC: 4, weapon: 'distance' }, fixed(0.99))).toBeCloseTo((8 + 2) * 1)
		expect(WEAPONS['distance'].replacesForceWith4D2).toBe(true)
	})
	it('resolveAssault: higher AT wins; protection reduces final damage', () => {
		// attacker normale: MC 10 − rand(0,6)=0 → AT 10; defender normale: MC 1 − 0 → AT 1
		const r = resolveAssault(
			{ FO: 6, MC: 10, weapon: 'epee-1m', posture: 'normale' },
			{ FO: 1, MC: 1, weapon: 'mains-nues', posture: 'normale', protection: 'cuir' },
			fixed(0),
		)
		expect(r.winner).toBe('attacker')
		expect(r.ecart).toBe(9)
		expect(r.band).toBe('critique')
		// PF = (6 + 5) × 1 (normale) × 2 (critique) = 22, − cuir 1 = 21
		expect(r.damage).toBe(21)
	})
})

describe('game system — XP & progression (§ 5)', () => {
	it('tierOf brackets', () => {
		expect([tierOf(3), tierOf(6), tierOf(9), tierOf(12)]).toEqual([1, 2, 3, 4])
	})
	it('delta bands', () => {
		expect(deltaBand(-2)).toBe('insignifiant')
		expect(deltaBand(0)).toBe('equilibre')
		expect(deltaBand(2)).toBe('depassement')
	})
	it('challenge XP: equilibré base + margin bonus; dépassement ×2', () => {
		expect(challengeXp({ challengeTier: 2, heroTier: 2, success: true, baseXp: 2, margin: 3 })).toBe(3)
		expect(challengeXp({ challengeTier: 3, heroTier: 2, success: true, baseXp: 3, margin: 0 })).toBe(6)
		expect(challengeXp({ challengeTier: 1, heroTier: 4, success: true, baseXp: 1, margin: 5 })).toBe(0)
	})
	it('combat XP: style bonuses, doubled on dépassement', () => {
		expect(combatXp({ monsterTier: 2, heroTier: 2, bestHit: 'critique', perfect: true })).toBe(2 + 2 + 1)
		expect(combatXp({ monsterTier: 3, heroTier: 2, bestHit: 'magistral', perfect: false })).toBe(3 + 2 + 1 * 2)
	})
	it('progression shop costs + caps', () => {
		expect(characteristicUpgradeCost(4)).toBe(1)
		expect(characteristicUpgradeCost(12)).toBe(30)
		expect(characteristicUpgradeCost(13)).toBeNull()
		expect(mcUpgradeCost(5)).toBe(25)
		expect(mcUpgradeCost(6)).toBeNull()
		expect(canUpgradeMC(6)).toBe(true)
		expect(canUpgradeMC(5)).toBe(false)
	})
})

describe('bestiary (§ 4)', () => {
	it('has 23 monsters with full stat blocks', () => {
		expect(BESTIARY).toHaveLength(23)
		const vampire = BESTIARY_BY_TEMPLATE['vampire']
		expect(vampire.tier).toBe(4)
		expect(vampire.stats).toEqual({ FO: 10, AG: 10, DX: 10, EN: 12, IG: 10 })
		expect(vampire.pv).toBe(30)
		expect(vampire.pvVariance).toBe(4)
	})
})
