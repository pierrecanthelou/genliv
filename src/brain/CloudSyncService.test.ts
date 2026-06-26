import { createCloudSyncService, type CloudTransport } from './CloudSyncService'
import { createEventBus } from './EventBus'
import { createLocalStoragePersistence } from './PersistenceService'
import { createLocalStorageTransport } from './LocalStorageTransport'
import { bookKey, bookContentKey, bookImageKey, bookImagesManifestKey } from './persistenceKeys'
import type { SyncStatus, Book } from './types'

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

	it('pendingKeys lists the queued keys and clears them once the push confirms', async () => {
		const { sync } = setup({ push: () => Promise.resolve() })
		sync.set('genliv:book:b1', { updatedAt: '1' })
		sync.set('genliv:book:b2', { updatedAt: '1' })
		expect(sync.pendingKeys().sort()).toEqual(['genliv:book:b1', 'genliv:book:b2'])
		await flush()
		expect(sync.pendingKeys()).toEqual([]) // confirmed → dequeued
	})

	it('pendingKeys stays empty with no transport (local-only, nothing queued)', () => {
		const { sync } = setup()
		sync.set('genliv:book:b1', { updatedAt: '1' })
		expect(sync.pendingKeys()).toEqual([])
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

	it('persists the offline queue and a fresh service reloads the backlog (iter 2)', async () => {
		const transport: CloudTransport = { push: () => Promise.reject(new Error('offline')) }
		const { sync, local } = setup(transport)

		sync.set(bookKey('b1'), { id: 'b1', updatedAt: '2026-01-01' })
		await flush()
		expect(sync.status()).toBe('error')
		expect(sync.pendingCount()).toBe(1) // queued for retry, local write never lost
		expect(local.get(bookKey('b1'))).not.toBeNull()

		// A reload: a fresh service over the same localStorage reloads the persisted queue.
		const local2 = createLocalStoragePersistence()
		const sync2 = createCloudSyncService(local2, createEventBus(), transport, { debounceMs: 0 })
		expect(sync2.pendingCount()).toBe(1)
		await flush() // its startup retry runs (still offline) and re-fails — queue kept
		expect(sync2.pendingCount()).toBe(1)
	})

	it('flushes the queue on retry() once the transport recovers (iter 2)', async () => {
		let online = false
		const transport: CloudTransport = { push: () => (online ? Promise.resolve() : Promise.reject(new Error())) }
		const { sync } = setup(transport)

		sync.set('genliv:k', 1)
		await flush()
		expect(sync.status()).toBe('error')
		expect(sync.pendingCount()).toBe(1)

		online = true // reconnect
		sync.retry()
		await flush()
		expect(sync.status()).toBe('synced')
		expect(sync.pendingCount()).toBe(0) // backlog flushed
	})

	it('keeps a newer write to the same key queued through an in-flight push (iter 2)', async () => {
		let resolvePush: () => void = () => {}
		const transport: CloudTransport = { push: () => new Promise<void>((res) => (resolvePush = res)) }
		const { sync } = setup(transport)

		sync.set('genliv:k', 1)
		await flush() // the push of value 1 is now in-flight (unresolved)
		sync.set('genliv:k', 2) // a newer write to the same key lands DURING the push
		resolvePush() // value 1 is confirmed
		await flush() // success handler dequeues only value 1; value 2 stays queued

		expect(sync.pendingCount()).toBe(1) // the newer write was not lost
	})

	describe('conflict handling (iter 3)', () => {
		const key = bookKey('b1')
		// A transport whose push never resolves (the local edit stays queued/pending)
		// and whose pull returns a NEWER cloud copy — the divergence condition.
		function conflictTransport(): CloudTransport {
			return {
				push: () => new Promise<void>(() => {}),
				pull: async () => ({ updatedAt: '2026-06-01T00:00:00.000Z', title: 'cloud' }),
			}
		}

		it('detects a conflict (local unpushed edits + newer cloud) without overwriting local', async () => {
			const { sync, events } = setup(conflictTransport())
			const conflicts: string[] = []
			events.on('sync:conflict', ({ bookId }) => conflicts.push(bookId))

			sync.set(key, { updatedAt: '2026-05-01T00:00:00.000Z', title: 'local' }) // local edit, now queued
			events.emit('book:opened', { bookId: 'b1' }) // triggers reconcile (pulls the newer cloud)
			await flush()

			expect(sync.conflicts()).toEqual(['b1'])
			expect(conflicts).toEqual(['b1'])
			// Local was NOT silently overwritten.
			expect(sync.get<{ title: string }>(key)?.title).toBe('local')
		})

		it('does NOT conflict when local is clean (no unpushed edits) — safe LWW adopt', async () => {
			const { sync, local, events } = setup(conflictTransport())
			// Local copy is older but has NO queued edit (written underneath, not via set).
			local.set(key, { updatedAt: '2026-05-01T00:00:00.000Z', title: 'local' })
			events.emit('book:opened', { bookId: 'b1' })
			await flush()

			expect(sync.conflicts()).toEqual([])
			expect(sync.get<{ title: string }>(key)?.title).toBe('cloud') // adopted the newer cloud
		})

		it('resolveConflict("cloud") adopts the cloud copy and clears the conflict', async () => {
			const { sync, events } = setup(conflictTransport())
			sync.set(key, { updatedAt: '2026-05-01T00:00:00.000Z', title: 'local' })
			events.emit('book:opened', { bookId: 'b1' })
			await flush()

			sync.resolveConflict('b1', 'cloud')
			expect(sync.conflicts()).toEqual([])
			expect(sync.get<{ title: string }>(key)?.title).toBe('cloud')
		})

		it('resolveConflict("local") keeps local and clears the conflict', async () => {
			const { sync, events } = setup(conflictTransport())
			sync.set(key, { updatedAt: '2026-05-01T00:00:00.000Z', title: 'local' })
			events.emit('book:opened', { bookId: 'b1' })
			await flush()

			sync.resolveConflict('b1', 'local')
			expect(sync.conflicts()).toEqual([])
			expect(sync.get<{ title: string }>(key)?.title).toBe('local') // local kept
		})
	})

	describe('book payload splitting (iter 5)', () => {
		function minBook(id: string, updatedAt = '2026-01-01T00:00:00.000Z'): Book {
			return { id, title: 'Test', nodes: [], edges: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt }
		}

		it('routes a real Book write to split keys (content + manifest), not the legacy bookKey', async () => {
			const pushed: [string, unknown][] = []
			const { sync } = setup({ push: (k, v) => { pushed.push([k, v]); return Promise.resolve() } })

			sync.set(bookKey('b1'), minBook('b1'))
			await flush()

			const keys = pushed.map(([k]) => k)
			expect(keys).toContain(bookContentKey('b1'))
			expect(keys).toContain(bookImagesManifestKey('b1'))
			expect(keys).not.toContain(bookKey('b1'))
		})

		it('pendingKeys includes the split-format keys for a real Book write', () => {
			const { sync } = setup({ push: () => new Promise<void>(() => {}) })

			sync.set(bookKey('b1'), minBook('b1'))

			const pending = sync.pendingKeys()
			expect(pending.some((k) => k.startsWith(bookKey('b1') + ':'))).toBe(true)
			expect(pending).not.toContain(bookKey('b1'))
		})

		it('extracts node illustration and pnj.portrait into separate image keys and strips them from content', async () => {
			const pushed: [string, unknown][] = []
			const { sync } = setup({ push: (k, v) => { pushed.push([k, v]); return Promise.resolve() } })

			const book = {
				...minBook('b1'),
				nodes: [
					{ id: 'n1', kind: 'choix', illustration: 'data:image/png;base64,ILLUS', position: { x: 0, y: 0 } },
					{ id: 'n2', kind: 'pnj', pnj: { name: 'Elrond', portrait: 'data:image/png;base64,PORT' }, position: { x: 0, y: 0 } },
				],
			} as unknown as Book

			sync.set(bookKey('b1'), book)
			await flush()

			const keys = pushed.map(([k]) => k)
			expect(keys).toContain(bookImageKey('b1', 'n1', 'illustration'))
			expect(keys).toContain(bookImageKey('b1', 'n2', 'portrait'))

			const contentEntry = pushed.find(([k]) => k === bookContentKey('b1'))
			expect(contentEntry).toBeDefined()
			const contentStr = JSON.stringify(contentEntry![1])
			expect(contentStr).not.toContain('ILLUS')
			expect(contentStr).not.toContain('PORT')
		})

		it('reconcile reassembles a split-format cloud book with illustration and portrait from image keys', async () => {
			const illusKey = bookImageKey('b1', 'n1', 'illustration')
			const portraitKey = bookImageKey('b1', 'n2', 'portrait')
			const cloudContent = {
				...minBook('b1', '2026-06-01T00:00:00.000Z'),
				nodes: [
					{ id: 'n1', kind: 'choix', position: { x: 0, y: 0 } },
					{ id: 'n2', kind: 'pnj', pnj: { name: 'Elrond' }, position: { x: 0, y: 0 } },
				],
			}

			const transport: CloudTransport = {
				push: () => Promise.resolve(),
				pull: async (k: string) => {
					if (k === bookContentKey('b1')) return cloudContent
					if (k === bookImagesManifestKey('b1')) return [illusKey, portraitKey]
					if (k === illusKey) return 'data:image/png;base64,ILLUS'
					if (k === portraitKey) return 'data:image/png;base64,PORT'
					return null
				},
			}

			const { local, events } = setup(transport)
			local.set(bookKey('b1'), minBook('b1', '2026-01-01T00:00:00.000Z'))

			let updatedId = ''
			events.on('book:updated', ({ bookId }) => { updatedId = bookId })
			events.emit('book:opened', { bookId: 'b1' })
			await flush()

			expect(updatedId).toBe('b1')
			type StoredBook = Book & { nodes: Array<{ illustration?: string; pnj?: { portrait?: string } }> }
			const stored = local.get<StoredBook>(bookKey('b1'))
			expect(stored?.nodes[0]?.illustration).toBe('data:image/png;base64,ILLUS')
			expect(stored?.nodes[1]?.pnj?.portrait).toBe('data:image/png;base64,PORT')
		})

		it('resolveConflict("local") with a real Book queues split keys, not the legacy key', async () => {
			const conflictTransport: CloudTransport = {
				push: () => new Promise<void>(() => {}),
				pull: async () => ({ ...minBook('b1', '2026-06-01T00:00:00.000Z') }),
			}

			const { sync, local, events } = setup(conflictTransport)
			const localBook = minBook('b1', '2026-05-01T00:00:00.000Z')
			local.set(bookKey('b1'), localBook)
			sync.set(bookKey('b1'), localBook) // local edit → split keys queued
			events.emit('book:opened', { bookId: 'b1' }) // reconcile → cloud newer → conflict
			await flush()

			expect(sync.conflicts()).toEqual(['b1'])

			sync.resolveConflict('b1', 'local')

			const pending = sync.pendingKeys()
			expect(pending.some((k) => k.startsWith(bookKey('b1') + ':'))).toBe(true)
			expect(pending).not.toContain(bookKey('b1'))
		})
	})
})
