import { useMemo, useSyncExternalStore } from 'react'
import { useBrain, type AppEventName, type Book } from '../../../brain'

/**
 * Live read of the open book from BookService (the single source of truth),
 * kept current by subscribing to the brain event bus — NOT by mirroring
 * props through useEffect (KR-013). The canvas re-reads the persisted book
 * whenever a node/edge changes anywhere, so it stays a faithful VIEW
 * (KR-020) without holding its own copy.
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
