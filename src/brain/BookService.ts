import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { Book, BookNode, NodeKind, Edge, EdgeKind } from './types'
import { bookKey, BOOK_KEY_PREFIX } from './persistenceKeys'
import { createId } from './utils/id'
import { NODE_KINDS, isNodeKind, isEdgeKind } from './kinds'

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
	 * Permanently remove a book and its whole tree (book-library). Persists
	 * the removal before emitting `book:deleted` (KR-004), so listeners never
	 * observe a half-deleted state. Returns true if a book was removed, false
	 * if no book had that id.
	 */
	deleteBook(id: string): boolean
	/**
	 * Add a free-floating, unattached node of `kind` to a book (KR-020).
	 * It receives a deterministic auto-layout slot so it never piles at
	 * 0,0 (KR-023); attaching it to a parent is done later in
	 * choice-linking. Persists before emitting `node:created`. Returns the
	 * new node, or null if the book does not exist.
	 */
	addNode(bookId: string, kind: NodeKind): BookNode | null
	/**
	 * Patch a node's editable content (KR-020). Structural screens — the
	 * locked `mort` leaf (KR-002) and the `sommaire` root (KR-055) — accept
	 * only `text` changes; their end flags / required action are ignored.
	 * Persists before emitting `node:updated`. Returns the updated node, or
	 * null if the book/node does not exist.
	 */
	updateNode(bookId: string, nodeId: string, patch: NodePatch): BookNode | null
	/**
	 * Create a new child screen and a `choice` edge from `fromNodeId` to it,
	 * then return the new node (choice-linking « + Nouvelle branche »). The
	 * structural `mort` leaf may not have outgoing choices (KR-055/060).
	 * Persists before emitting `node:created` then `edge:created`. Returns
	 * null if the book/parent is missing or the parent is `mort`.
	 */
	addChoiceBranch(bookId: string, fromNodeId: string): { node: BookNode; edge: Edge } | null
	/**
	 * Create an edge between two existing nodes (choice-linking « Relier… »).
	 * Enables cycles/convergence. Rejects edges out of `mort` (KR-055) and a
	 * book/endpoint that does not exist. Persists before emitting
	 * `edge:created`. Returns the edge, or null on rejection.
	 */
	addEdge(bookId: string, from: string, to: string, kind: EdgeKind): Edge | null
	/** Remove an edge by id (never deletes its target node). Emits `edge:deleted`. */
	removeEdge(bookId: string, edgeId: string): boolean
}

/** The author-editable surface of a node (everything else is structural). */
export type NodePatch = Partial<Pick<BookNode, 'text' | 'endVictory' | 'endFailure' | 'actionType' | 'decor'>>

/**
 * Deterministic slot for a position-less / newly added node (KR-023): a
 * tidy diagonal cascade keyed by how many nodes already exist, so books
 * reopen stably and new nodes never overlap at 0,0. The seeded sommaire
 * (0,0) and mort (240,320) anchor the top; new authored nodes cascade
 * down-right from there.
 */
const LAYOUT_ORIGIN = 40
const LAYOUT_STEP_X = 200
const LAYOUT_STEP_Y = 150
const LAYOUT_COLS = 3
export function autoSlot(index: number): { x: number; y: number } {
	return {
		x: LAYOUT_ORIGIN + (index % LAYOUT_COLS) * LAYOUT_STEP_X,
		y: LAYOUT_ORIGIN + Math.floor(index / LAYOUT_COLS) * LAYOUT_STEP_Y,
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

/**
 * A persisted book is trusted only after its node/edge kinds are validated
 * against the registry (KR-116): PersistenceService.get does an unchecked
 * JSON.parse cast, so a corrupted store or a schema drift could carry a kind
 * outside the registry, which would crash any NODE_KINDS[kind] lookup. A book
 * with an unknown kind is treated as unreadable, not silently coerced.
 */
function hasOnlyKnownKinds(book: Book): boolean {
	return book.nodes.every((n) => isNodeKind(n.kind)) && book.edges.every((e) => isEdgeKind(e.kind))
}

export function createBookService(persistence: PersistenceService, events: EventBus): BookService {
	function persist(book: Book): void {
		persistence.set(bookKey(book.id), book)
	}

	/** Read a persisted book, returning null (with a surfaced warning) if it is
	 *  absent or carries an unknown node/edge kind (KR-116). All reads and
	 *  mutations go through here so an unknown kind never reaches a lookup. */
	function loadBook(id: string): Book | null {
		const book = persistence.get<Book>(bookKey(id))
		if (book === null) return null
		if (!hasOnlyKnownKinds(book)) {
			console.warn(`[BookService] book "${id}" has an unknown node/edge kind; treating it as unreadable.`)
			return null
		}
		return book
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
			return loadBook(id)
		},

		listBooks() {
			return persistence
				.keys(BOOK_KEY_PREFIX)
				.map((key) => persistence.get<Book>(key))
				.filter((book): book is Book => book !== null)
				.filter((book) => {
					// Skip (and surface) any book with an unknown kind — never crash the list (KR-116).
					if (hasOnlyKnownKinds(book)) return true
					console.warn(`[BookService] book "${book.id}" has an unknown node/edge kind; omitted from the library.`)
					return false
				})
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		},

		openBook(id) {
			const book = loadBook(id)
			if (book === null) return null
			events.emit('book:opened', { bookId: book.id })
			return book
		},

		deleteBook(id) {
			// Use the raw read (not loadBook): a corrupt book must still be deletable.
			if (persistence.get<Book>(bookKey(id)) === null) return false
			// Persist the removal atomically before emitting, so listeners
			// (the library view) re-read a store without the book (KR-004).
			persistence.remove(bookKey(id))
			events.emit('book:deleted', { bookId: id })
			return true
		},

		addNode(bookId, kind) {
			const book = loadBook(bookId)
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
			const book = loadBook(bookId)
			if (book === null) return null
			const current = book.nodes.find((n) => n.id === nodeId)
			if (current === undefined) return null
			// Structural screens accept only text edits: the locked Mort leaf
			// (KR-002) and the Sommaire root have no end flags / required action
			// (KR-055). The structural fact is read from the kind registry, not
			// tested against kind values (KR-068).
			const textOnly = current.locked === true || NODE_KINDS[current.kind].structural
			const allowed: NodePatch = textOnly ? { text: patch.text } : patch
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

		addChoiceBranch(bookId, fromNodeId) {
			const book = loadBook(bookId)
			if (book === null) return null
			const parent = book.nodes.find((n) => n.id === fromNodeId)
			// Mort is structural: no outgoing choices (KR-055/060) — read from the
			// kind registry (canHaveOutgoing), not a kind test (KR-068).
			if (parent === undefined || !NODE_KINDS[parent.kind].canHaveOutgoing) return null
			const node: BookNode = {
				id: createId('node'),
				kind: 'choix',
				text: '',
				position: autoSlot(book.nodes.length),
			}
			const edge: Edge = { id: createId('edge'), from: fromNodeId, to: node.id, kind: 'choice' }
			const next: Book = {
				...book,
				nodes: [...book.nodes, node],
				edges: [...book.edges, edge],
				updatedAt: new Date().toISOString(),
			}
			persist(next)
			events.emit('node:created', { bookId, nodeId: node.id, kind: node.kind })
			events.emit('edge:created', { bookId, edgeId: edge.id, from: edge.from, to: edge.to, kind: edge.kind })
			return { node, edge }
		},

		addEdge(bookId, from, to, kind) {
			const book = loadBook(bookId)
			if (book === null) return null
			const fromNode = book.nodes.find((n) => n.id === from)
			const toNode = book.nodes.find((n) => n.id === to)
			if (fromNode === undefined || toNode === undefined) return null
			// Mort is structural: no outgoing choices (KR-055/060). Read from the
			// kind registry (canHaveOutgoing), not a kind test (KR-068).
			if (!NODE_KINDS[fromNode.kind].canHaveOutgoing) return null
			// Structural screens are never authored choice targets (KR-067): the
			// Sommaire is the root (no incoming choices) and the Mort leaf is
			// reached only automatically at the end of a combat, never via an
			// authored choice/relink. The future automatic combat→Mort link will
			// use a dedicated path, not this manual edge API. The invariant is the
			// registry's `canBeTarget` flag, not a kind test (KR-068).
			if (!NODE_KINDS[toNode.kind].canBeTarget) return null
			const edge: Edge = { id: createId('edge'), from, to, kind }
			const next: Book = { ...book, edges: [...book.edges, edge], updatedAt: new Date().toISOString() }
			persist(next)
			events.emit('edge:created', { bookId, edgeId: edge.id, from, to, kind })
			return edge
		},

		removeEdge(bookId, edgeId) {
			const book = loadBook(bookId)
			if (book === null) return false
			if (!book.edges.some((e) => e.id === edgeId)) return false
			const next: Book = {
				...book,
				edges: book.edges.filter((e) => e.id !== edgeId),
				updatedAt: new Date().toISOString(),
			}
			persist(next)
			events.emit('edge:deleted', { bookId, edgeId })
			return true
		},
	}
}
