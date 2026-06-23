import { rollHeroCaracs, defaultHeroCaracs, rollHero, defaultHero } from './heroGen'
import { CHARACTERISTIC_VALUES } from '../../brain/characteristics'

describe('rollHeroCaracs', () => {
	it('returns a value for every characteristic', () => {
		const seq = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
		let i = 0
		const rng = (): number => seq[i++ % seq.length]
		const caracs = rollHeroCaracs(rng)
		for (const c of CHARACTERISTIC_VALUES) {
			expect(typeof caracs[c]).toBe('number')
		}
	})

	it('produces values in the 2D4 range [2, 8] for all 8 characteristics', () => {
		let i = 0
		const alternating = (): number => (i++ % 2 === 0 ? 0 : 1)
		const min = rollHeroCaracs(alternating)
		const max = rollHeroCaracs(() => 0.99)
		for (const c of CHARACTERISTIC_VALUES) {
			expect(min[c]).toBeGreaterThanOrEqual(2)
			expect(max[c]).toBeLessThanOrEqual(8)
		}
	})
})

describe('defaultHeroCaracs', () => {
	it('returns 4 for every characteristic', () => {
		const caracs = defaultHeroCaracs()
		for (const c of CHARACTERISTIC_VALUES) {
			expect(caracs[c]).toBe(4)
		}
	})
})

describe('rollHero', () => {
	it('has pvMax = FO + AG + EN', () => {
		const rng = (): number => 0.5
		const hero = rollHero('Test', rng)
		expect(hero.pvMax).toBe(hero.caracs.FO + hero.caracs.AG + hero.caracs.EN)
	})

	it('starts at full PV and PE', () => {
		const hero = rollHero('Test')
		expect(hero.pv).toBe(hero.pvMax)
		expect(hero.pe).toBe(hero.peMax)
	})

	it('has peMax = EN', () => {
		const hero = rollHero('Test')
		expect(hero.peMax).toBe(hero.caracs.EN)
	})

	it('starts with 0 XP and 0 mcBonus', () => {
		const hero = rollHero('Test')
		expect(hero.xp).toBe(0)
		expect(hero.mcBonus).toBe(0)
	})
})

describe('defaultHero', () => {
	it('uses the default name when none is provided', () => {
		expect(defaultHero().name).toBe('Aventurier')
	})

	it('has pvMax = 4 + 4 + 4 = 12 with all caracs at 4', () => {
		expect(defaultHero().pvMax).toBe(12)
	})
})
