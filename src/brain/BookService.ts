import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { Book, BookNode, NodeKind } from './types'
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
	/**
	 * Add a free-floating, unattached node of `kind` to a book (KR-020).
	 * It receives a deterministic auto-layout slot so it never piles at
	 * 0,0 (KR-023); attaching it to a parent is done later in
	 * choice-linking. Persists before emitting `node:created`. Returns the
	 * new node, or null if the book does not exist.
	 */
	addNode(bookId: string, kind: NodeKind): BookNode | null
	/**
	 * Patch a node's editable content (KR-020). A locked node (the `mort`
	 * leaf) accepts only `text` changes — its end flags / action are ignored
	 * (KR-002). Persists before emitting `node:updated`. Returns the updated
	 * node, or null if the book/node does not exist.
	 */
	updateNode(bookId: string, nodeId: string, patch: NodePatch): BookNode | null
}

/** The author-editable surface of a node (everything else is structural). */
export type NodePatch = Partial<Pick<BookNode, 'text' | 'endVictory' | 'endFailure' | 'actionType'>>

/**
 * Deterministic slot for a position-less / newly added node (KR-023): a
 * tidy diagonal cascade keyed by how many nodes already exist, so books
 * reopen stably and new nodes never overlap at 0,0. The seeded sommaire
 * (0,0) and mort (240,320) anchor the top; new authored nodes cascade
 * down-right from there.
 */
const LAYOUT_STEP_X = 200
const LAYOUT_STEP_Y = 150
const LAYOUT_COLS = 3
export function autoSlot(index: number): { x: number; y: number } {
	return {
		x: 40 + (index % LAYOUT_COLS) * LAYOUT_STEP_X,
		y: 40 + Math.floor(index / LAYOUT_COLS) * LAYOUT_STEP_Y,
	}
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

		addNode(bookId, kind) {
			const book = persistence.get<Book>(bookKey(bookId))
			if (book === null) return null
			const node: BookNode = {
				id: createId('node'),
				kind,
				text: '',
				position: autoSlot(book.nodes.length),
			}
			const next: Book = {
				...book,
				nodes: [...book.nodes, node],
				updatedAt: new Date().toISOString(),
			}
			// Persist atomically before emitting, so listeners observe it (KR-004).
			persist(next)
			events.emit('node:created', { bookId: next.id, nodeId: node.id, kind })
			return node
		},

		updateNode(bookId, nodeId, patch) {
			const book = persistence.get<Book>(bookKey(bookId))
			if (book === null) return null
			const current = book.nodes.find((n) => n.id === nodeId)
			if (current === undefined) return null
			// Locked nodes (mort) only accept text edits (KR-002).
			const allowed: NodePatch = current.locked === true ? { text: patch.text } : patch
			const updated: BookNode = { ...current }
			for (const key of Object.keys(allowed) as (keyof NodePatch)[]) {
				if (allowed[key] !== undefined) {
					Object.assign(updated, { [key]: allowed[key] })
				}
			}
			const next: Book = {
				...book,
				nodes: book.nodes.map((n) => (n.id === nodeId ? updated : n)),
				updatedAt: new Date().toISOString(),
			}
			persist(next)
			events.emit('node:updated', { bookId, nodeId })
			return updated
		},
	}
}
