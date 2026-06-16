import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { createEventBus, type EventBus } from './EventBus'
import { createLocalStoragePersistence, type PersistenceService } from './PersistenceService'
import { createRouter, type Route, type Router } from './Router'
import { createBookService, type BookService } from './BookService'
import { createSelectionService, type SelectionService } from './SelectionService'
import { createActionRegistry, type ActionRegistry } from './ActionRegistry'
import { createSlotRegistry, type SlotRegistry } from './SlotRegistry'

/**
 * Brain — the application core. It wires the services together (Service
 * Locator + Dependency Inversion) and is provided to the React tree once
 * at the root. Features depend on these abstractions, never on each other.
 */
export interface Brain {
	events: EventBus
	persistence: PersistenceService
	router: Router
	books: BookService
	selection: SelectionService
	actions: ActionRegistry
	slots: SlotRegistry
}

export interface CreateBrainOptions {
	persistence?: PersistenceService
	initialRoute?: Route
}

export function createBrain(options: CreateBrainOptions = {}): Brain {
	const events = createEventBus()
	const persistence = options.persistence ?? createLocalStoragePersistence()
	const router = createRouter(options.initialRoute)
	const books = createBookService(persistence, events)
	const selection = createSelectionService(events)
	const actions = createActionRegistry()
	const slots = createSlotRegistry()
	return { events, persistence, router, books, selection, actions, slots }
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
