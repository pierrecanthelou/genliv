import {
	rollCreationPool,
	emptyAssignment,
	isAssignmentComplete,
	baseValue,
	totalValue,
	buildHeroFromCreation,
	CREATION_CAP,
} from './charCreation'
import { CHARACTERISTIC_VALUES } from '../../brain/characteristics'

describe('rollCreationPool', () => {
	it('returns exactly 8 rolls', () => {
		expect(rollCreationPool().rolls).toHaveLength(8)
	})

	it('all rolls are in range 2-8 (2D4)', () => {
		const { rolls } = rollCreationPool()
		for (const v of rolls) {
			expect(v).toBeGreaterThanOrEqual(2)
			expect(v).toBeLessThanOrEqual(8)
		}
	})

	it('bonusPool is in range 1-4 (1D4)', () => {
		const { bonusPool } = rollCreationPool()
		expect(bonusPool).toBeGreaterThanOrEqual(1)
		expect(bonusPool).toBeLessThanOrEqual(4)
	})

	it('accepts an injectable rng', () => {
		// rng returning 0.9 → each D4 face = ceil(0.9*4) = 4; 2D4 = 8
		const rng = () => 0.9
		const { rolls, bonusPool } = rollCreationPool(rng)
		expect(rolls.every((r) => r === 8)).toBe(true)
		expect(bonusPool).toBe(4)
	})
})

describe('emptyAssignment', () => {
	it('has -1 for all rollIndices', () => {
		const a = emptyAssignment()
		for (const c of CHARACTERISTIC_VALUES) {
			expect(a.rollIndices[c]).toBe(-1)
		}
	})

	it('has 0 bonus for all caracs', () => {
		const a = emptyAssignment()
		for (const c of CHARACTERISTIC_VALUES) {
			expect(a.bonus[c]).toBe(0)
		}
	})
})

describe('baseValue', () => {
	it('returns 0 when rollIndex is -1 (unassigned)', () => {
		const pool = rollCreationPool()
		expect(baseValue(pool, -1)).toBe(0)
	})

	it('returns the roll at the given index', () => {
		const pool = { rolls: [3, 5, 7, 4, 2, 6, 3, 4], bonusPool: 2 }
		expect(baseValue(pool, 2)).toBe(7)
		expect(baseValue(pool, 0)).toBe(3)
	})
})

describe('totalValue', () => {
	it('is base + bonus for the characteristic', () => {
		const pool = { rolls: [4, 6, 5, 3, 7, 4, 2, 5], bonusPool: 3 }
		const a = emptyAssignment()
		a.rollIndices['FO'] = 0 // base = 4
		a.bonus['FO'] = 2
		expect(totalValue(pool, a, 'FO')).toBe(6)
	})

	it('returns 0+0 when unassigned', () => {
		const pool = { rolls: [4], bonusPool: 1 }
		const a = emptyAssignment()
		expect(totalValue(pool, a, 'AG')).toBe(0)
	})
})

describe('isAssignmentComplete', () => {
	function makeComplete() {
		const pool = { rolls: [3, 5, 4, 2, 6, 4, 3, 5], bonusPool: 2 }
		const a = emptyAssignment()
		CHARACTERISTIC_VALUES.forEach((c, idx) => {
			a.rollIndices[c] = idx
		})
		// distribute bonus to FO and AG
		a.bonus['FO'] = 1
		a.bonus['AG'] = 1
		return { pool, a }
	}

	it('returns true when all assigned and all bonus distributed', () => {
		const { pool, a } = makeComplete()
		expect(isAssignmentComplete(pool, a)).toBe(true)
	})

	it('returns false when some caracs are unassigned', () => {
		const { pool, a } = makeComplete()
		a.rollIndices['FO'] = -1
		expect(isAssignmentComplete(pool, a)).toBe(false)
	})

	it('returns false when bonus not fully distributed', () => {
		const { pool, a } = makeComplete()
		a.bonus['FO'] = 0 // one bonus point missing
		expect(isAssignmentComplete(pool, a)).toBe(false)
	})

	it('returns false when bonus over-distributed (sanity check)', () => {
		const { pool, a } = makeComplete()
		a.bonus['FO'] = 3 // exceeded pool
		expect(isAssignmentComplete(pool, a)).toBe(false)
	})
})

describe('buildHeroFromCreation', () => {
	function completeScenario() {
		const pool = { rolls: [4, 4, 4, 4, 4, 4, 4, 4], bonusPool: 2 }
		const a = emptyAssignment()
		CHARACTERISTIC_VALUES.forEach((c, idx) => {
			a.rollIndices[c] = idx
		})
		a.bonus['FO'] = 1
		a.bonus['AG'] = 1
		return { pool, a }
	}

	it('sets hero name from argument', () => {
		const { pool, a } = completeScenario()
		expect(buildHeroFromCreation('Gaétan', pool, a).name).toBe('Gaétan')
	})

	it('falls back to Aventurier for blank name', () => {
		const { pool, a } = completeScenario()
		expect(buildHeroFromCreation('', pool, a).name).toBe('Aventurier')
	})

	it('pvMax = FO + AG + EN', () => {
		const { pool, a } = completeScenario()
		const hero = buildHeroFromCreation('Test', pool, a)
		// FO=5 (4+1), AG=5 (4+1), EN=4
		expect(hero.pvMax).toBe(hero.caracs['FO'] + hero.caracs['AG'] + hero.caracs['EN'])
		expect(hero.pv).toBe(hero.pvMax)
	})

	it('peMax = EN', () => {
		const { pool, a } = completeScenario()
		const hero = buildHeroFromCreation('Test', pool, a)
		expect(hero.peMax).toBe(hero.caracs['EN'])
		expect(hero.pe).toBe(hero.peMax)
	})

	it('mcBonus starts at 0, xp starts at 0', () => {
		const { pool, a } = completeScenario()
		const hero = buildHeroFromCreation('Test', pool, a)
		expect(hero.mcBonus).toBe(0)
		expect(hero.xp).toBe(0)
	})

	it('CREATION_CAP is 10', () => {
		expect(CREATION_CAP).toBe(10)
	})
})
