import type { PersistenceService } from './PersistenceService'
import type { EditorViewMode } from './components/EditorTopBar'
import { uiPrefsKey } from './persistenceKeys'

/**
 * Per-book UI preferences — the canvas viewport (pan/zoom), the canvas↔outline
 * view-mode, and dragged node positions. This is PER-DEVICE view state, NOT the
 * synced book document (KR-022): the service is wired over the RAW local store
 * (never the CloudSyncService decorator), so writes never enter the cloud queue.
 */
export interface Viewport {
	x: number
	y: number
	zoom: number
}

export interface Point {
	x: number
	y: number
}

export type LayoutSpacing = 'compact' | 'spacious'

/** Everything we remember for one book's editor view (all optional — absent = default). */
export interface BookUIPrefs {
	viewport?: Viewport
	viewMode?: EditorViewMode
	/** Manually dragged node positions, by node id; a stored position overrides the auto-layout slot. */
	positions?: Record<string, Point>
	/** Node ids collapsed in the outline view (a stale id for a deleted node is harmless). */
	outlineCollapsed?: string[]
	/** Canvas node spacing: 'compact' (default) or 'spacious' (generous gaps). */
	layoutSpacing?: LayoutSpacing
}

/**
 * UIPreferencesService — the single gateway for non-synced, per-device editor
 * view state (KR-011/022/111). Reads are served from an in-memory cache so a
 * snapshot reference is stable between writes (safe for useSyncExternalStore);
 * each write produces a NEW prefs object for the touched book, persists it
 * through the local store, and notifies subscribers.
 */
export interface UIPreferencesService {
	/** The book's current prefs (a stable cached reference until the next write). */
	getBookPrefs(bookId: string): BookUIPrefs
	setViewport(bookId: string, viewport: Viewport): void
	setViewMode(bookId: string, viewMode: EditorViewMode): void
	/** Persist a dragged node's position (overrides its computed layout slot). */
	setNodePosition(bookId: string, nodeId: string, position: Point): void
	/** Clear all dragged-position overrides for a book, restoring the auto-layout. */
	clearNodePositions(bookId: string): void
	/** Persist the set of node ids collapsed in the outline view. */
	setOutlineCollapsed(bookId: string, nodeIds: string[]): void
	/** Persist the canvas spacing mode (compact / spacious). */
	setLayoutSpacing(bookId: string, spacing: LayoutSpacing): void
	/** Subscribe to any prefs change (for useSyncExternalStore). Returns an unsubscribe. */
	subscribe(listener: () => void): () => void
}

/** Stable empty prefs so a never-touched book always yields the SAME reference. */
const EMPTY_PREFS: BookUIPrefs = Object.freeze({})

export function createUIPreferencesService(local: PersistenceService): UIPreferencesService {
	// In-memory cache keyed by bookId, so getBookPrefs returns a stable reference
	// between writes (useSyncExternalStore requires snapshot stability).
	const cache = new Map<string, BookUIPrefs>()
	const listeners = new Set<() => void>()

	function load(bookId: string): BookUIPrefs {
		const cached = cache.get(bookId)
		if (cached !== undefined) return cached
		const stored = local.get<BookUIPrefs>(uiPrefsKey(bookId)) ?? EMPTY_PREFS
		cache.set(bookId, stored)
		return stored
	}

	/** Replace a book's prefs with a NEW object (immutable update), persist, notify. */
	function commit(bookId: string, next: BookUIPrefs): void {
		cache.set(bookId, next)
		local.set(uiPrefsKey(bookId), next)
		for (const listener of [...listeners]) listener()
	}

	return {
		getBookPrefs(bookId) {
			return load(bookId)
		},
		setViewport(bookId, viewport) {
			commit(bookId, { ...load(bookId), viewport })
		},
		setViewMode(bookId, viewMode) {
			commit(bookId, { ...load(bookId), viewMode })
		},
		setNodePosition(bookId, nodeId, position) {
			const current = load(bookId)
			commit(bookId, { ...current, positions: { ...current.positions, [nodeId]: position } })
		},
		clearNodePositions(bookId) {
			const current = load(bookId)
			commit(bookId, { ...current, positions: undefined })
		},
		setOutlineCollapsed(bookId, nodeIds) {
			commit(bookId, { ...load(bookId), outlineCollapsed: nodeIds })
		},
		setLayoutSpacing(bookId, spacing) {
			commit(bookId, { ...load(bookId), layoutSpacing: spacing })
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	}
}
