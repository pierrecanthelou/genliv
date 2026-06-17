import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { createEventBus, type EventBus } from './EventBus'
import { createLocalStoragePersistence, type PersistenceService } from './PersistenceService'
import { createRouter, type Route, type Router } from './Router'
import { createBookService, type BookService } from './BookService'
import { createSelectionService, type SelectionService } from './SelectionService'
import { createActionRegistry, type ActionRegistry } from './ActionRegistry'
import { createSlotRegistry, type SlotRegistry } from './SlotRegistry'
import { createCloudSyncService, type CloudSyncService, type CloudTransport } from './CloudSyncService'
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
}

export interface CreateBrainOptions {
	persistence?: PersistenceService
	/** Cloud transport; omitted = local-only (status stays `offline`). */
	transport?: CloudTransport
	initialRoute?: Route
}

export function createBrain(options: CreateBrainOptions = {}): Brain {
	const events = createEventBus()
	const local = options.persistence ?? createLocalStoragePersistence()
	// Wrap local persistence so every write is local-first + sync-aware (KR-022/011).
	const sync = createCloudSyncService(local, events, options.transport)
	const router = createRouter(options.initialRoute)
	const books = createBookService(sync, events)
	const selection = createSelectionService(events)
	const actions = createActionRegistry()
	const slots = createSlotRegistry()
	return { events, persistence: sync, sync, router, books, selection, actions, slots }
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
