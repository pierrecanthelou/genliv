import { createLocalStorageTransport } from './LocalStorageTransport'

describe('LocalStorageTransport (the local « cloud »)', () => {
	beforeEach(() => window.localStorage.clear())

	it('push then pull round-trips a value', async () => {
		const t = createLocalStorageTransport()
		await t.push('genliv:book:b1', { title: 'La Caverne' })
		expect(await t.pull!('genliv:book:b1')).toEqual({ title: 'La Caverne' })
	})

	it('pull returns null for an unknown key', async () => {
		const t = createLocalStorageTransport()
		expect(await t.pull!('genliv:book:missing')).toBeNull()
	})

	it('stores under a separate namespace, never colliding with the app keys', async () => {
		const t = createLocalStorageTransport()
		await t.push('genliv:book:b1', { title: 'X' })
		// The app's own key space (genliv:) is untouched by the fake cloud.
		expect(window.localStorage.getItem('genliv:book:b1')).toBeNull()
		expect(window.localStorage.getItem('cloudsync:genliv:book:b1')).not.toBeNull()
	})
})
