import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { Book, BookNode } from './types'
import { bookKey, BOOK_KEY_PREFIX } from './persistenceKeys'
import { createId } from './utils/id'

/**
 * BookService — the API nœud. Single source of truth for the book tree
 * (nodes + edges). Canvas / outline / preview are views over this; none
 * holds a private copy (KR-020). All mutations persist before any event
 * fires, so listeners always observe a persisted book (KR-004).
 */
export interface BookService {
	createBook(title: string): Book
	getBook(id: string): Book | null
	listBooks(): Book[]
	openBook(id: string): Book | null
}

/**
 * Build the two seeded nodes for a brand-new book (KR-001): exactly a
 * `sommaire` root with an empty text zone, and an isolated, locked `mort`
 * leaf with zero edges. Never auto-link the mort node (KR-002).
 */
function seedNodes(): BookNode[] {
	return [
		{
			id: createId('node'),
			kind: 'sommaire',
			text: '',
			position: { x: 0, y: 0 },
		},
		{
			id: createId('node'),
			kind: 'mort',
			text: '',
			locked: true,
			position: { x: 240, y: 320 },
		},
	]
}

export function createBookService(persistence: PersistenceService, events: EventBus): BookService {
	function persist(book: Book): void {
		persistence.set(bookKey(book.id), book)
	}

	return {
		createBook(title) {
			const now = new Date().toISOString()
			const book: Book = {
				id: createId('book'),
				title: title.trim(),
				createdAt: now,
				updatedAt: now,
				nodes: seedNodes(),
				edges: [],
			}
			// Persist atomically before emitting, so listeners observe it (KR-004).
			persist(book)
			events.emit('book:created', { bookId: book.id })
			return book
		},

		getBook(id) {
			return persistence.get<Book>(bookKey(id))
		},

		listBooks() {
			return persistence
				.keys(BOOK_KEY_PREFIX)
				.map((key) => persistence.get<Book>(key))
				.filter((book): book is Book => book !== null)
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		},

		openBook(id) {
			const book = persistence.get<Book>(bookKey(id))
			if (book === null) return null
			events.emit('book:opened', { bookId: book.id })
			return book
		},
	}
}
