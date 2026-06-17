import { createCloudSyncService, type CloudTransport } from './CloudSyncService'
import { createEventBus } from './EventBus'
import { createLocalStoragePersistence } from './PersistenceService'
import type { SyncStatus } from './types'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function setup(transport?: CloudTransport) {
	const events = createEventBus()
	const local = createLocalStoragePersistence()
	const statuses: SyncStatus[] = []
	events.on('sync:status', ({ status }) => statuses.push(status))
	const sync = createCloudSyncService(local, events, transport)
	return { sync, statuses, local }
}

describe('CloudSyncService', () => {
	beforeEach(() => window.localStorage.clear())

	it('is local-first: reads/writes hit local synchronously and delegate get/keys/remove', () => {
		const { sync, local } = setup()
		sync.set('genliv:k', 42)
		expect(sync.get('genliv:k')).toBe(42) // readable immediately
		expect(local.get('genliv:k')).toBe(42) // written through to local
		expect(sync.keys('genliv:')).toEqual(['genliv:k'])
		sync.remove('genliv:k')
		expect(sync.get('genliv:k')).toBeNull()
	})

	it('with no transport stays « offline » (local-only) and emits nothing on writes', () => {
		const { sync, statuses } = setup()
		expect(sync.status()).toBe('offline')
		sync.set('k', 1)
		expect(sync.status()).toBe('offline')
		expect(statuses).toEqual([]) // offline → offline is not a change, no noise
	})

	it('with a transport goes idle → syncing → synced and broadcasts each change', async () => {
		let resolvePush = (): void => {}
		const transport: CloudTransport = { push: () => new Promise((r) => (resolvePush = r)) }
		const { sync, statuses } = setup(transport)
		expect(sync.status()).toBe('idle')

		sync.set('k', 1)
		expect(sync.status()).toBe('syncing')

		resolvePush()
		await flush()
		expect(sync.status()).toBe('synced')
		expect(statuses).toEqual(['syncing', 'synced'])
	})

	it('reports « error » when the cloud push fails (the local write still succeeded)', async () => {
		const transport: CloudTransport = { push: () => Promise.reject(new Error('offline')) }
		const { sync } = setup(transport)
		sync.set('k', 1)
		await flush()
		expect(sync.status()).toBe('error')
		expect(sync.get('k')).toBe(1) // local-first: the write is never lost
	})
})
