import { useMemo, useSyncExternalStore } from 'react'
import { useBrain } from './BrainContext'
import type { AppEventName } from './EventBus'
import type { Book } from './types'

/**
 * Shared brain hooks. Views (tree-canvas, node-editor, outline-view) read the
 * open book live from BookService — the single source of truth — by
 * subscribing to the event bus, NOT by mirroring props through useEffect
 * (KR-013/113). Each view stays a VIEW, holding no private copy (KR-020).
 */
const BOOK_MUTATION_EVENTS: AppEventName[] = [
	'book:opened',
	'node:created',
	'node:updated',
	'node:deleted',
	'edge:created',
	'edge:updated',
	'edge:deleted',
]

/** List membership changes only when a book is created or deleted. */
const BOOK_LIST_EVENTS: AppEventName[] = ['book:created', 'book:deleted']

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
