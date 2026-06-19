import { createUIPreferencesService } from './UIPreferencesService'
import { createLocalStoragePersistence } from './PersistenceService'
import { createBrain } from './BrainContext'
import type { CloudTransport } from './CloudSyncService'
import { uiPrefsKey, BOOK_KEY_PREFIX, CLOUDSYNC_QUEUE_KEY } from './persistenceKeys'

describe('UIPreferencesService', () => {
	beforeEach(() => window.localStorage.clear())

	it('stores and reads back per-book viewport, view-mode, and node positions', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setViewport('b1', { x: 10, y: 20, zoom: 1.5 })
		prefs.setViewMode('b1', 'outline')
		prefs.setNodePosition('b1', 'n1', { x: 100, y: 200 })

		const stored = prefs.getBookPrefs('b1')
		expect(stored.viewport).toEqual({ x: 10, y: 20, zoom: 1.5 })
		expect(stored.viewMode).toBe('outline')
		expect(stored.positions).toEqual({ n1: { x: 100, y: 200 } })
	})

	it('keeps prefs per book independent', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setViewMode('b1', 'outline')
		prefs.setViewMode('b2', 'canvas')
		expect(prefs.getBookPrefs('b1').viewMode).toBe('outline')
		expect(prefs.getBookPrefs('b2').viewMode).toBe('canvas')
	})

	it('returns a STABLE snapshot reference between writes (safe for useSyncExternalStore)', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		const first = prefs.getBookPrefs('b1')
		expect(prefs.getBookPrefs('b1')).toBe(first) // same reference, no write
		prefs.setViewMode('b1', 'outline')
		expect(prefs.getBookPrefs('b1')).not.toBe(first) // a new object after a write
	})

	it('merges a second node position without dropping the first', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setNodePosition('b1', 'n1', { x: 1, y: 1 })
		prefs.setNodePosition('b1', 'n2', { x: 2, y: 2 })
		expect(prefs.getBookPrefs('b1').positions).toEqual({ n1: { x: 1, y: 1 }, n2: { x: 2, y: 2 } })
	})

	it('notifies subscribers on a change and stops after unsubscribe', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		const listener = jest.fn()
		const unsubscribe = prefs.subscribe(listener)
		prefs.setViewMode('b1', 'outline')
		expect(listener).toHaveBeenCalledTimes(1)
		unsubscribe()
		prefs.setViewMode('b1', 'canvas')
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('survives a reload: a fresh service over the same store reads the persisted prefs', () => {
		const store = createLocalStoragePersistence()
		createUIPreferencesService(store).setViewport('b1', { x: 5, y: 6, zoom: 0.8 })
		// A brand-new service (cold cache) re-reads from the underlying store.
		expect(createUIPreferencesService(store).getBookPrefs('b1').viewport).toEqual({ x: 5, y: 6, zoom: 0.8 })
	})

	it('persists under the ui: namespace, never a book key (stays out of listBooks)', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setViewMode('b1', 'outline')
		expect(window.localStorage.getItem(uiPrefsKey('b1'))).not.toBeNull()
		// The key must NOT match the book-list prefix, so listBooks() ignores it.
		expect(uiPrefsKey('b1').startsWith(BOOK_KEY_PREFIX)).toBe(false)
	})

	it('is NEVER cloud-synced: prefs writes do not enter the cloud queue (KR-022/093)', () => {
		// A transport whose push never resolves would surface any leaked write as a
		// stuck pending count — UI prefs must bypass the sync decorator entirely.
		const transport: CloudTransport = { push: () => new Promise<void>(() => {}) }
		const brain = createBrain({ transport })
		brain.uiPreferences.setViewport('b1', { x: 1, y: 2, zoom: 1.5 })
		brain.uiPreferences.setViewMode('b1', 'outline')
		brain.uiPreferences.setNodePosition('b1', 'n1', { x: 9, y: 9 })

		// Nothing queued, nothing pushed: the writes went straight to the local store.
		expect(brain.sync.pendingCount()).toBe(0)
		expect(window.localStorage.getItem(CLOUDSYNC_QUEUE_KEY)).toBeNull()
	})
})
