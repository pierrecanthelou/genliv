import { createCloudSyncService, type CloudTransport } from './CloudSyncService'
import { createEventBus } from './EventBus'
import { createLocalStoragePersistence } from './PersistenceService'
import { createLocalStorageTransport } from './LocalStorageTransport'
import { bookKey } from './persistenceKeys'
import type { SyncStatus } from './types'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function setup(transport?: CloudTransport) {
	const events = createEventBus()
	const local = createLocalStoragePersistence()
	const statuses: SyncStatus[] = []
	events.on('sync:status', ({ status }) => statuses.push(status))
	// debounceMs 0 → the batched flush fires on the next macrotask (await flush()).
	const sync = createCloudSyncService(local, events, transport, { debounceMs: 0 })
	return { sync, statuses, local, events }
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
		const { sync, statuses } = setup({ push: () => Promise.resolve() })
		expect(sync.status()).toBe('idle')

		sync.set('k', 1)
		expect(sync.status()).toBe('syncing') // syncing is set synchronously on write

		await flush()
		expect(sync.status()).toBe('synced')
		expect(statuses).toEqual(['syncing', 'synced'])
	})

	it('debounces + batches rapid writes into one push cycle (last value per key wins)', async () => {
		const pushed: [string, unknown][] = []
		const { sync, statuses } = setup({
			push: (k, v) => {
				pushed.push([k, v])
				return Promise.resolve()
			},
		})

		sync.set('a', 1)
		sync.set('b', 2)
		sync.set('a', 3) // coalesces with the first 'a'
		expect(statuses).toEqual(['syncing']) // one syncing for the whole burst

		await flush()
		expect(pushed).toEqual([
			['a', 3],
			['b', 2],
		])
		expect(statuses).toEqual(['syncing', 'synced']) // one synced
	})

	it('reports « error » when the cloud push fails (the local write still succeeded)', async () => {
		const { sync } = setup({ push: () => Promise.reject(new Error('offline')) })
		sync.set('k', 1)
		await flush()
		expect(sync.status()).toBe('error')
		expect(sync.get('k')).toBe(1) // local-first: the write is never lost
	})

	it('reconciles on book:opened: adopts a newer cloud version (LWW) and notifies', async () => {
		const transport = createLocalStorageTransport()
		const { local, events } = setup(transport)
		const key = bookKey('b1')
		local.set(key, { id: 'b1', updatedAt: '2026-01-01T00:00:00.000Z', title: 'old' })
		await transport.push(key, { id: 'b1', updatedAt: '2026-06-01T00:00:00.000Z', title: 'new' }) // cloud is newer
		let updatedId = ''
		events.on('book:updated', ({ bookId }) => {
			updatedId = bookId
		})

		events.emit('book:opened', { bookId: 'b1' })
		await flush()

		expect((local.get(key) as { title: string }).title).toBe('new') // adopted the cloud copy
		expect(updatedId).toBe('b1') // views notified to re-read
	})

	it('reconciles on book:opened: pushes a newer local version up', async () => {
		const transport = createLocalStorageTransport()
		const { local, events } = setup(transport)
		const key = bookKey('b2')
		local.set(key, { id: 'b2', updatedAt: '2026-06-01T00:00:00.000Z', title: 'local-new' })
		await transport.push(key, { id: 'b2', updatedAt: '2026-01-01T00:00:00.000Z', title: 'cloud-old' })

		events.emit('book:opened', { bookId: 'b2' })
		await flush() // pull resolves → local newer → schedule push
		await flush() // batched push resolves

		const cloud = (await transport.pull!(key)) as { title: string }
		expect(cloud.title).toBe('local-new') // local pushed up
	})
})
