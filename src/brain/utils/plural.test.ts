import { plural } from './plural'

describe('plural (French)', () => {
	it('uses the singular for 0 and 1', () => {
		expect(plural(0, 'écran')).toBe('écran')
		expect(plural(1, 'écran')).toBe('écran')
	})

	it('uses the plural (default + s) for 2 or more', () => {
		expect(plural(2, 'écran')).toBe('écrans')
		expect(plural(7, 'nœud')).toBe('nœuds')
	})

	it('honours an explicit irregular plural form', () => {
		expect(plural(3, 'cheval', 'chevaux')).toBe('chevaux')
		expect(plural(1, 'cheval', 'chevaux')).toBe('cheval')
	})
})
