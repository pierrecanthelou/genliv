import { giftOf, blankGift, clampGiftValue, GIFT_EFFECTS } from '../utils/gift'
import type { PnjConfig } from '../../../brain'

describe('giftOf (PNJ gift migration)', () => {
	it('returns a PnjGift unchanged when already in the new shape', () => {
		const pnj: PnjConfig = {
			name: 'Ermite',
			dialogue: '',
			gift: { object: { id: 'o1', name: 'Amulette', description: '' }, effect: 'attaque', value: 2 },
		}
		expect(giftOf(pnj)).toEqual({
			object: { id: 'o1', name: 'Amulette', description: '' },
			effect: 'attaque',
			value: 2,
		})
	})

	it('migrates the walking-skeleton bare GameObject gift to a « scénario » plot object', () => {
		// Old persisted shape: gift was a bare GameObject.
		const pnj = {
			name: 'Ermite',
			dialogue: '',
			gift: { id: 'o1', name: 'Amulette', description: '' },
		} as unknown as PnjConfig
		expect(giftOf(pnj)).toEqual({
			object: { id: 'o1', name: 'Amulette', description: '' },
			effect: 'scenario',
			value: 0,
		})
	})

	it('returns undefined when there is no gift', () => {
		expect(giftOf({ name: '', dialogue: '' })).toBeUndefined()
	})
})

describe('blankGift / clampGiftValue', () => {
	it('mints a fresh object id and defaults to +1 PV', () => {
		const a = blankGift()
		const b = blankGift()
		expect(a.object.id).not.toBe(b.object.id) // collision-free (KR-003)
		expect(a.effect).toBe('pv')
		expect(a.value).toBe(1)
	})

	it('clamps the stat bonus into bounds and rounds', () => {
		expect(clampGiftValue(0)).toBe(1)
		expect(clampGiftValue(999)).toBe(99)
		expect(clampGiftValue(3.7)).toBe(4)
		expect(clampGiftValue(NaN)).toBe(1)
	})
})

describe('GIFT_EFFECTS registry (KR-117)', () => {
	it('marks only the plot object as value-less', () => {
		expect(GIFT_EFFECTS.scenario.hasValue).toBe(false)
		expect(GIFT_EFFECTS.pv.hasValue).toBe(true)
		expect(GIFT_EFFECTS.attaque.hasValue).toBe(true)
		expect(GIFT_EFFECTS.defense.hasValue).toBe(true)
	})
})
