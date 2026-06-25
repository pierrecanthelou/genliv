import { createCloudSettings } from './CloudSettingsService'
import { createLocalStoragePersistence } from './PersistenceService'
import { CLOUDSYNC_WORKER_URL_KEY, CLOUDSYNC_KEY_KEY } from './persistenceKeys'

describe('CloudSettingsService', () => {
	beforeEach(() => window.localStorage.clear())

	function setup() {
		const local = createLocalStoragePersistence()
		const cs = createCloudSettings(local)
		return { local, cs }
	}

	it('getWorkerUrl returns null when not set', () => {
		const { cs } = setup()
		expect(cs.getWorkerUrl()).toBeNull()
	})

	it('getSyncKey returns null when not set', () => {
		const { cs } = setup()
		expect(cs.getSyncKey()).toBeNull()
	})

	it('isConfigured is false when neither credential is set', () => {
		const { cs } = setup()
		expect(cs.isConfigured()).toBe(false)
	})

	it('isConfigured is false when only URL is set', () => {
		const { cs } = setup()
		cs.setWorkerUrl('https://genliv.example.workers.dev')
		expect(cs.isConfigured()).toBe(false)
	})

	it('isConfigured is true when both URL and key are set', () => {
		const { cs } = setup()
		cs.setWorkerUrl('https://genliv.example.workers.dev')
		cs.setSyncKey('my-secret-key')
		expect(cs.isConfigured()).toBe(true)
	})

	it('setWorkerUrl persists and getWorkerUrl reads it back', () => {
		const { cs } = setup()
		cs.setWorkerUrl('https://genliv.example.workers.dev')
		expect(cs.getWorkerUrl()).toBe('https://genliv.example.workers.dev')
	})

	it('setSyncKey persists and getSyncKey reads it back', () => {
		const { cs } = setup()
		cs.setSyncKey('abc-secret-123')
		expect(cs.getSyncKey()).toBe('abc-secret-123')
	})

	it('setWorkerUrl(null) removes the stored URL', () => {
		const { cs } = setup()
		cs.setWorkerUrl('https://genliv.example.workers.dev')
		cs.setWorkerUrl(null)
		expect(cs.getWorkerUrl()).toBeNull()
	})

	it('setSyncKey(null) removes the stored key', () => {
		const { cs } = setup()
		cs.setSyncKey('some-key')
		cs.setSyncKey(null)
		expect(cs.getSyncKey()).toBeNull()
	})

	it('stores credentials under the correct localStorage keys', () => {
		const { local, cs } = setup()
		cs.setWorkerUrl('https://genliv.example.workers.dev')
		cs.setSyncKey('my-key')
		expect(local.get(CLOUDSYNC_WORKER_URL_KEY)).toBe('https://genliv.example.workers.dev')
		expect(local.get(CLOUDSYNC_KEY_KEY)).toBe('my-key')
	})

	it('credentials survive a service recreation (persistence round-trip)', () => {
		const { cs } = setup()
		cs.setWorkerUrl('https://example.workers.dev')
		cs.setSyncKey('persistent-key')

		const local2 = createLocalStoragePersistence()
		const cs2 = createCloudSettings(local2)
		expect(cs2.getWorkerUrl()).toBe('https://example.workers.dev')
		expect(cs2.getSyncKey()).toBe('persistent-key')
	})
})
