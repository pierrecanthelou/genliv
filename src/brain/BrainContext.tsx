import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { createEventBus, type EventBus } from './EventBus'
import { createLocalStoragePersistence, type PersistenceService } from './PersistenceService'
import { createRouter, type Route, type Router } from './Router'
import { createBookService, type BookService } from './BookService'
import { createSelectionService, type SelectionService } from './SelectionService'
import { createActionRegistry, type ActionRegistry } from './ActionRegistry'
import { createSlotRegistry, type SlotRegistry } from './SlotRegistry'
import { createCloudSyncService, type CloudSyncService, type CloudTransport } from './CloudSyncService'
import { bookKey } from './persistenceKeys'
import {
	createUIPreferencesService,
	type UIPreferencesService,
	type BookUIPrefs,
	type Point,
} from './UIPreferencesService'
import type { EditorViewMode } from './components/EditorTopBar'
import type { SyncStatus } from './types'

/**
 * Brain — the application core. It wires the services together (Service
 * Locator + Dependency Inversion) and is provided to the React tree once
 * at the root. Features depend on these abstractions, never on each other.
 */
export interface Brain {
	events: EventBus
	/** Local-first, cloud-sync-aware persistence (a PersistenceService + status()). */
	persistence: CloudSyncService
	/** Same instance as `persistence`, typed for its sync surface (status). */
	sync: CloudSyncService
	router: Router
	books: BookService
	selection: SelectionService
	actions: ActionRegistry
	slots: SlotRegistry
	/** Per-device, non-synced editor view state — pan/zoom, view-mode, dragged positions (KR-022). */
	uiPreferences: UIPreferencesService
}

export interface CreateBrainOptions {
	persistence?: PersistenceService
	/** Cloud transport; omitted = local-only (status stays `offline`). */
	transport?: CloudTransport
	/** Debounce window (ms) for batched cloud pushes; forwarded to CloudSyncService. */
	syncDebounceMs?: number
	initialRoute?: Route
}

export function createBrain(options: CreateBrainOptions = {}): Brain {
	const events = createEventBus()
	const local = options.persistence ?? createLocalStoragePersistence()
	// Wrap local persistence so every write is local-first + sync-aware (KR-022/011).
	const sync = createCloudSyncService(local, events, options.transport, { debounceMs: options.syncDebounceMs })
	const router = createRouter(options.initialRoute)
	const books = createBookService(sync, events)
	const selection = createSelectionService(events)
	const actions = createActionRegistry()
	const slots = createSlotRegistry()
	// UI preferences persist through the RAW local store, NOT the sync decorator,
	// so per-device view state (pan/zoom, view-mode, positions) is never cloud-synced (KR-022).
	const uiPreferences = createUIPreferencesService(local)
	return { events, persistence: sync, sync, router, books, selection, actions, slots, uiPreferences }
}

const BrainContext = createContext<Brain | null>(null)

export function BrainProvider({ brain, children }: { brain: Brain; children: ReactNode }): JSX.Element {
	return <BrainContext.Provider value={brain}>{children}</BrainContext.Provider>
}

export function useBrain(): Brain {
	const brain = useContext(BrainContext)
	if (brain === null) {
		throw new Error('useBrain must be used within a BrainProvider')
	}
	return brain
}

/** Subscribe a component to the current route (external-store sync, not derived state). */
export function useRoute(): Route {
	const { router } = useBrain()
	return useSyncExternalStore(router.subscribe, router.current)
}

/** Subscribe to the currently selected node id (single source of truth, KR-024). */
export function useSelectedNode(): string | null {
	const { selection } = useBrain()
	return useSyncExternalStore(selection.subscribe, selection.getSelected)
}

/** Subscribe to the cloud-sync status (external-store sync over the sync:status event). */
export function useSyncStatus(): SyncStatus {
	const { sync, events } = useBrain()
	return useSyncExternalStore((onChange) => events.on('sync:status', onChange), sync.status)
}

/** Subscribe to the count of writes queued offline (« N changements en attente », iter 2). */
export function useSyncPending(): number {
	const { sync, events } = useBrain()
	return useSyncExternalStore((onChange) => events.on('sync:status', onChange), sync.pendingCount)
}

/**
 * Whether a SPECIFIC book has a write still queued to the cloud (its key is in the
 * offline queue) — drives the library's per-book « non synchronisé » chip. Reads
 * the generic pendingKeys() and maps bookKey(id) here, so the feature never
 * touches storage keys and the decorator stays book-agnostic (KR-094). The
 * snapshot is a boolean (value-compared, stable); it re-reads on every
 * sync:status emit, the same cadence as the global indicator (KR-095).
 */
export function useBookPending(bookId: string): boolean {
	const { sync, events } = useBrain()
	return useSyncExternalStore(
		(onChange) => events.on('sync:status', onChange),
		() => sync.pendingKeys().includes(bookKey(bookId)),
	)
}

/** The non-synced UI preferences service (pan/zoom, view-mode, dragged positions, KR-022). */
export function useUIPreferences(): UIPreferencesService {
	return useBrain().uiPreferences
}

/** Stable empty position map so the no-overrides snapshot keeps the SAME reference. */
const EMPTY_POSITIONS: Record<string, Point> = Object.freeze({})

/** Reactive read of a book's persisted canvas↔outline view-mode (external store, KR-013). */
export function useBookViewMode(bookId: string): EditorViewMode {
	const { uiPreferences } = useBrain()
	return useSyncExternalStore(uiPreferences.subscribe, () => uiPreferences.getBookPrefs(bookId).viewMode ?? 'canvas')
}

/** Reactive read of a book's dragged node-position overrides (external store, KR-013). */
export function useBookNodePositions(bookId: string): Record<string, Point> {
	const { uiPreferences } = useBrain()
	return useSyncExternalStore(
		uiPreferences.subscribe,
		() => uiPreferences.getBookPrefs(bookId).positions ?? EMPTY_POSITIONS,
	)
}

export type { UIPreferencesService, BookUIPrefs, Point }
