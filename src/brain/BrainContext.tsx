import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
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
	type LayoutSpacing,
	type OutlineDisplayMode,
} from './UIPreferencesService'
import { createMonsterLibraryService, type MonsterLibraryService, type SavedMonster } from './MonsterLibraryService'
import { createCloudSettings, type CloudSettingsService } from './CloudSettingsService'
import { BESTIARY } from './bestiary'
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
	/** Cross-book library of reusable monsters (« la librairie du générateur »). */
	monsterLibrary: MonsterLibraryService
	/** Cloudflare KV worker credentials — raw local, never synced (KR-114). */
	cloudSettings: CloudSettingsService
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
	// Cross-book reusable-monster library — persisted via the raw local store (not synced).
	const monsterLibrary = createMonsterLibraryService(local)
	// Seed the canonical bestiary (§ 4) once, so every author starts with the full
	// list available to « Choisir dans la librairie » (idempotent, deletion-safe).
	monsterLibrary.seedDefaults(BESTIARY)
	// Worker credentials — raw local, never synced (KR-114).
	const cloudSettings = createCloudSettings(local)
	return {
		events,
		persistence: sync,
		sync,
		router,
		books,
		selection,
		actions,
		slots,
		uiPreferences,
		monsterLibrary,
		cloudSettings,
	}
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
		() => {
			// Match both the legacy key (`genliv:book:{id}`) and any split-format keys
			// (`genliv:book:{id}:content`, `genliv:book:{id}:img:…`, etc.) — all share
			// the same bookKey prefix followed by either end-of-string or a colon.
			const base = bookKey(bookId)
			return sync.pendingKeys().some((k) => k === base || k.startsWith(`${base}:`))
		},
	)
}

/** The non-synced UI preferences service (pan/zoom, view-mode, dragged positions, KR-022). */
export function useUIPreferences(): UIPreferencesService {
	return useBrain().uiPreferences
}

/** Whether a book is in sync CONFLICT (both sides diverged) — drives the resolution dialog (iter 3). */
export function useSyncConflict(bookId: string | null): boolean {
	const { sync, events } = useBrain()
	return useSyncExternalStore(
		(onChange) => events.on('sync:conflict', onChange),
		() => bookId !== null && sync.conflicts().includes(bookId),
	)
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

/** Stable empty array so the no-collapse snapshot keeps the SAME reference. */
const EMPTY_COLLAPSED: readonly string[] = Object.freeze([])

/**
 * Reactive read of the outline's collapsed node ids as a Set (external store,
 * KR-013). The stored array snapshot is stable between writes (cache-backed), so
 * the derived Set is memoised on it — no per-render new Set that would loop.
 */
export function useBookOutlineCollapsed(bookId: string): ReadonlySet<string> {
	const { uiPreferences } = useBrain()
	const ids = useSyncExternalStore(
		uiPreferences.subscribe,
		() => uiPreferences.getBookPrefs(bookId).outlineCollapsed ?? EMPTY_COLLAPSED,
	)
	return useMemo(() => new Set(ids), [ids])
}

/** Reactive read of a book's canvas spacing mode (external store, KR-013). */
export function useBookLayoutSpacing(bookId: string): LayoutSpacing {
	const { uiPreferences } = useBrain()
	return useSyncExternalStore(
		uiPreferences.subscribe,
		() => uiPreferences.getBookPrefs(bookId).layoutSpacing ?? 'compact',
	)
}

/** Reactive read of a book's outline display mode (list / columns) (external store, KR-013). */
export function useBookOutlineDisplayMode(bookId: string): OutlineDisplayMode {
	const { uiPreferences } = useBrain()
	return useSyncExternalStore(
		uiPreferences.subscribe,
		() => uiPreferences.getBookPrefs(bookId).outlineDisplayMode ?? 'list',
	)
}

/** The cross-book reusable-monster library service. */
export function useMonsterLibrary(): SavedMonster[] {
	const { monsterLibrary } = useBrain()
	return useSyncExternalStore(monsterLibrary.subscribe, monsterLibrary.list)
}

export type { UIPreferencesService, BookUIPrefs, Point, OutlineDisplayMode }
