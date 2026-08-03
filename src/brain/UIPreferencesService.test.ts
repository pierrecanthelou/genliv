import { createUIPreferencesService } from './UIPreferencesService'
import { createLocalStoragePersistence } from './PersistenceService'
import { createBrain } from './BrainContext'
import type { CloudTransport } from './CloudSyncService'
import { uiPrefsKey, BOOK_KEY_PREFIX, CLOUDSYNC_QUEUE_KEY } from './persistenceKeys'

describe('UIPreferencesService', () => {
	beforeEach(() => window.localStorage.clear())

	it('stores and reads back per-book viewport, spacing, and node positions', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setViewport('b1', { x: 10, y: 20, zoom: 1.5 })
		prefs.setLayoutSpacing('b1', 'spacious')
		prefs.setNodePosition('b1', 'n1', { x: 100, y: 200 })

		const stored = prefs.getBookPrefs('b1')
		expect(stored.viewport).toEqual({ x: 10, y: 20, zoom: 1.5 })
		expect(stored.layoutSpacing).toBe('spacious')
		expect(stored.positions).toEqual({ n1: { x: 100, y: 200 } })
	})

	it('keeps prefs per book independent', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setLayoutSpacing('b1', 'spacious')
		prefs.setLayoutSpacing('b2', 'compact')
		expect(prefs.getBookPrefs('b1').layoutSpacing).toBe('spacious')
		expect(prefs.getBookPrefs('b2').layoutSpacing).toBe('compact')
	})

	it('returns a STABLE snapshot reference between writes (safe for useSyncExternalStore)', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		const first = prefs.getBookPrefs('b1')
		expect(prefs.getBookPrefs('b1')).toBe(first) // same reference, no write
		prefs.setLayoutSpacing('b1', 'spacious')
		expect(prefs.getBookPrefs('b1')).not.toBe(first) // a new object after a write
	})

	it('merges a second node position without dropping the first', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setNodePosition('b1', 'n1', { x: 1, y: 1 })
		prefs.setNodePosition('b1', 'n2', { x: 2, y: 2 })
		expect(prefs.getBookPrefs('b1').positions).toEqual({ n1: { x: 1, y: 1 }, n2: { x: 2, y: 2 } })
	})

	it('clearNodePositions removes all dragged overrides for a book (auto-layout reset)', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setNodePosition('b1', 'n1', { x: 1, y: 1 })
		prefs.setNodePosition('b1', 'n2', { x: 2, y: 2 })
		prefs.clearNodePositions('b1')
		expect(prefs.getBookPrefs('b1').positions).toBeUndefined()
		// Other prefs for the same book are preserved.
		prefs.setLayoutSpacing('b1', 'spacious')
		prefs.setNodePosition('b1', 'n3', { x: 3, y: 3 })
		prefs.clearNodePositions('b1')
		expect(prefs.getBookPrefs('b1').layoutSpacing).toBe('spacious')
		expect(prefs.getBookPrefs('b1').positions).toBeUndefined()
	})

	it('notifies subscribers on a change and stops after unsubscribe', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		const listener = jest.fn()
		const unsubscribe = prefs.subscribe(listener)
		prefs.setLayoutSpacing('b1', 'spacious')
		expect(listener).toHaveBeenCalledTimes(1)
		unsubscribe()
		prefs.setLayoutSpacing('b1', 'compact')
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
		prefs.setLayoutSpacing('b1', 'spacious')
		expect(window.localStorage.getItem(uiPrefsKey('b1'))).not.toBeNull()
		// The key must NOT match the book-list prefix, so listBooks() ignores it.
		expect(uiPrefsKey('b1').startsWith(BOOK_KEY_PREFIX)).toBe(false)
	})

	it('setLayoutSpacing persists the spacing, notifies subscribers, and preserves other prefs', () => {
		const prefs = createUIPreferencesService(createLocalStoragePersistence())
		prefs.setViewport('b1', { x: 3, y: 4, zoom: 1 })
		const listener = jest.fn()
		prefs.subscribe(listener)

		prefs.setLayoutSpacing('b1', 'spacious')

		expect(prefs.getBookPrefs('b1').layoutSpacing).toBe('spacious')
		// Other prefs for the same book are preserved.
		expect(prefs.getBookPrefs('b1').viewport).toEqual({ x: 3, y: 4, zoom: 1 })
		expect(listener).toHaveBeenCalledTimes(1)

		// Toggle back to compact.
		prefs.setLayoutSpacing('b1', 'compact')
		expect(prefs.getBookPrefs('b1').layoutSpacing).toBe('compact')
	})

	it('is NEVER cloud-synced: prefs writes do not enter the cloud queue (KR-022/093)', () => {
		// A transport whose push never resolves would surface any leaked write as a
		// stuck pending count — UI prefs must bypass the sync decorator entirely.
		const transport: CloudTransport = { push: () => new Promise<void>(() => {}) }
		const brain = createBrain({ transport })
		brain.uiPreferences.setViewport('b1', { x: 1, y: 2, zoom: 1.5 })
		brain.uiPreferences.setLayoutSpacing('b1', 'spacious')
		brain.uiPreferences.setNodePosition('b1', 'n1', { x: 9, y: 9 })

		// Nothing queued, nothing pushed: the writes went straight to the local store.
		expect(brain.sync.pendingCount()).toBe(0)
		expect(window.localStorage.getItem(CLOUDSYNC_QUEUE_KEY)).toBeNull()
	})
})
