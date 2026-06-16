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
	'edge:deleted',
]

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
