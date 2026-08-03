import { useMemo, useSyncExternalStore } from 'react'
import { useBrain } from './BrainContext'
import type { AppEventName } from './EventBus'
import type { Book } from './types'
import { checkBookHealth, type StructuralWarning } from './utils/bookHealth'

/**
 * Shared brain hooks. Views (tree-canvas, and the dossier sections to come) read
 * the open book live from BookService — the single source of truth — by
 * subscribing to the event bus, NOT by mirroring props through useEffect
 * (KR-013/113). Each view stays a VIEW, holding no private copy (KR-020).
 */
// These are CURATED SUBSETS of AppEvents — which events should make a book VIEW
// re-read — not a duplication of the bus: the `AppEventName[]` type rejects any
// name that is not a real event, so the literals can't drift from EventBus.
const BOOK_MUTATION_EVENTS: AppEventName[] = [
	'book:opened',
	'book:updated',
	'node:created',
	'node:updated',
	'node:deleted',
	'edge:created',
	'edge:updated',
	'edge:deleted',
]

/** List membership/content changes on create, delete, or a rename (book:updated). */
const BOOK_LIST_EVENTS: AppEventName[] = ['book:created', 'book:updated', 'book:deleted']

export function useOpenBook(bookId: string | null): Book | null {
	const { books, events } = useBrain()

	const store = useMemo(() => {
		let snapshot: Book | null = bookId !== null ? books.getBook(bookId) : null
		return {
			subscribe(onChange: () => void): () => void {
				const offs = BOOK_MUTATION_EVENTS.map((name) =>
					events.on(name, () => {
						snapshot = bookId !== null ? books.getBook(bookId) : null
						onChange()
					}),
				)
				return () => offs.forEach((off) => off())
			},
			getSnapshot: (): Book | null => snapshot,
		}
	}, [books, events, bookId])

	return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

/**
 * Live structural health check of an open book (KR-145). Runs `checkBookHealth`
 * on every book mutation (same events as `useOpenBook`) and returns warnings
 * immediately, without the author having to trigger an export. Dead-ends and
 * dangling edge targets appear as soon as they are created and disappear the
 * moment they are resolved.
 */
export function useBookHealth(bookId: string | null): StructuralWarning[] {
	const book = useOpenBook(bookId)
	return useMemo(() => {
		if (book === null) return []
		return checkBookHealth(book)
	}, [book])
}

/**
 * Live list of all persisted books (book-library). A VIEW over BookService:
 * the snapshot is cached and only recomputed on book:created / book:deleted,
 * so useSyncExternalStore gets a stable reference between those events (no
 * re-render loop) and the list stays a pure read of the SSOT (KR-020).
 */
export function useBooks(): Book[] {
	const { books, events } = useBrain()

	const store = useMemo(() => {
		let snapshot: Book[] = books.listBooks()
		return {
			subscribe(onChange: () => void): () => void {
				const offs = BOOK_LIST_EVENTS.map((name) =>
					events.on(name, () => {
						snapshot = books.listBooks()
						onChange()
					}),
				)
				return () => offs.forEach((off) => off())
			},
			getSnapshot: (): Book[] => snapshot,
		}
	}, [books, events])

	return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
