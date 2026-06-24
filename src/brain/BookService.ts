import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { Book, BookNode, NodeKind, Edge, EdgeKind, ChoicePrereq, ChoiceCountdown } from './types'
import { bookKey, BOOK_KEY_PREFIX } from './persistenceKeys'
import { createId } from './utils/id'
import { isNodeKind, isEdgeKind, isStructural, canHaveOutgoing, canBeTarget } from './kinds'
import { getNode, getEdge } from './utils/book'
import { isScenarioExport } from './utils/scenarioExport'

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
	 * Rename a book (book-library). The title is stored trimmed; a blank title is
	 * rejected (a book always keeps a name). Persists before emitting
	 * `book:updated` (KR-004). Returns the updated book, or null if the book is
	 * missing or the trimmed title is empty.
	 */
	renameBook(id: string, title: string): Book | null
	/**
	 * Duplicate a book and its whole tree (book-library): a deep copy with a
	 * fresh book id, fresh node/edge ids (edge endpoints remapped to the new node
	 * ids), a « (copie) » title, and new timestamps. References stay by stable id
	 * (KR-003), now pointing at the copy's own ids. Persists before emitting
	 * `book:created` (KR-004), so the library list shows it. Returns the new book,
	 * or null if the source is missing/unreadable.
	 */
	duplicateBook(id: string): Book | null
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
	/**
	 * Patch an edge's author-editable surface — the player-facing choice label
	 * (choice-linking « libellé du choix »). The label rides the edge, the book's
	 * structure, so it goes through the SSOT like every other edge mutation
	 * (KR-060/020). An empty-string label clears it. Persists before emitting
	 * `edge:updated`. Returns the updated edge, or null if the book/edge is gone.
	 */
	updateEdge(bookId: string, edgeId: string, patch: EdgePatch): Edge | null
	/** Remove an edge by id (never deletes its target node). Emits `edge:deleted`. */
	removeEdge(bookId: string, edgeId: string): boolean
	/**
	 * Import a book from a ScenarioExport (book-export feature, KR-143). Validates
	 * the format marker and node/edge kinds, then persists it with a fresh book id
	 * and new timestamps. Internal node/edge ids are preserved (they are
	 * book-local, no cross-book collision risk). Returns null if the payload fails
	 * validation (unknown format, bad kind, or missing required structure).
	 * Emits `book:created` after persisting (KR-004).
	 */
	importBook(data: unknown): Book | null
}

/** The author-editable surface of a node (everything else is structural). */
export type NodePatch = Partial<
	Pick<BookNode, 'text' | 'endVictory' | 'endFailure' | 'actionType' | 'decor' | 'pnj' | 'monster' | 'trap' | 'illustration'>
>

/**
 * The author-editable surface of an edge: the choice button's label, and the
 * hidden-prerequisite rule. `prereq: null` CLEARS the rule (removes the toggle);
 * an object sets it; omitting the key leaves it untouched.
 */
export type EdgePatch = Partial<Pick<Edge, 'label'>> & {
	prereq?: ChoicePrereq | null
	countdown?: ChoiceCountdown | null
}

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

		renameBook(id, title) {
			const book = loadBook(id)
			if (book === null) return null
			const trimmed = title.trim()
			// A book always keeps a name — reject a blank rename (KR-070 spirit:
			// never leave the author with an unnameable entry).
			if (trimmed === '') return null
			const next: Book = { ...book, title: trimmed, updatedAt: new Date().toISOString() }
			persist(next)
			events.emit('book:updated', { bookId: id })
			return next
		},

		duplicateBook(id) {
			const source = loadBook(id)
			if (source === null) return null
			// Remap every node id, then rewrite edge endpoints through that map so
			// references stay by stable id (KR-003) — pointing at the COPY's own
			// nodes, never the source's. Edge ids are fresh too. Nodes are
			// DEEP-cloned so the copy never shares a nested
			// position/decor/pnj/monster/trap object reference with the source —
			// an in-place edit of one book must never leak into the other. A JSON
			// round-trip is the exact clone here: the book is JSON-serialised by
			// PersistenceService anyway, so it carries no non-JSON values.
			const idMap = new Map(source.nodes.map((n) => [n.id, createId('node')]))
			const now = new Date().toISOString()
			const copy: Book = {
				id: createId('book'),
				title: `${source.title} (copie)`,
				createdAt: now,
				updatedAt: now,
				nodes: source.nodes.map((n) => {
					const clone = JSON.parse(JSON.stringify(n)) as BookNode
					clone.id = idMap.get(n.id) as string
					return clone
				}),
				edges: source.edges.map((e) => ({
					...e,
					id: createId('edge'),
					from: idMap.get(e.from) as string,
					to: idMap.get(e.to) as string,
				})),
			}
			persist(copy)
			events.emit('book:created', { bookId: copy.id })
			return copy
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
			const current = getNode(book, nodeId)
			if (current === null) return null
			// Structural screens restrict editable fields (KR-055/updated):
			// - Mort (locked): text only.
			// - Sommaire (structural, not locked): text + illustration (the
			//   illustration doubles as the book cover in the library and play header).
			// - All other nodes: full patch.
			const allowed: NodePatch = current.locked === true
				? { text: patch.text }
				: isStructural(current.kind)
					? { text: patch.text, illustration: patch.illustration }
					: patch
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
			const parent = getNode(book, fromNodeId)
			// Mort is structural: no outgoing choices (KR-055/060) — registry
			// predicate, not a kind test (KR-068).
			if (parent === null || !canHaveOutgoing(parent.kind)) return null
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
			const fromNode = getNode(book, from)
			const toNode = getNode(book, to)
			if (fromNode === null || toNode === null) return null
			// Relink allows cycles/convergence by DESIGN, but two degenerate cases
			// are rejected at the SSOT, not just hidden in the picker (KR-061):
			// a self-link (a node pointing at itself) and a duplicate identical edge
			// (same from/to/kind already present). The target node is never created
			// or deleted here — only the edge.
			if (from === to) return null
			if (book.edges.some((e) => e.from === from && e.to === to && e.kind === kind)) return null
			// Mort is structural: no outgoing choices (KR-055/060) — registry predicate.
			if (!canHaveOutgoing(fromNode.kind)) return null
			// Structural screens are never authored choice targets (KR-067): the
			// Sommaire is the root (no incoming choices) and the Mort leaf is reached
			// only automatically at the end of a combat, never via an authored
			// choice/relink. The future automatic combat→Mort link uses a dedicated
			// path, not this manual edge API. The invariant is the canBeTarget
			// predicate, not a kind test (KR-068).
			if (!canBeTarget(toNode.kind)) return null
			const edge: Edge = { id: createId('edge'), from, to, kind }
			const next: Book = { ...book, edges: [...book.edges, edge], updatedAt: new Date().toISOString() }
			persist(next)
			events.emit('edge:created', { bookId, edgeId: edge.id, from, to, kind })
			return edge
		},

		updateEdge(bookId, edgeId, patch) {
			const book = loadBook(bookId)
			if (book === null) return null
			const current = getEdge(book, edgeId)
			if (current === null) return null
			const updated: Edge = { ...current }
			// `label === undefined` leaves the field untouched. A blank label means
			// "no custom label": drop it so every consumer falls back to the kind's
			// canvas label (an empty edge.label must never render as a blank button).
			if (patch.label !== undefined) {
				if (patch.label.trim() === '') delete updated.label
				else updated.label = patch.label
			}
			// Hidden-prerequisite rule: `null` clears it (toggle off), an object sets
			// it, omitting the key leaves it untouched (KR-062). The referenced object
			// id is validated at the VIEW (dangling surfaced), not here — the SSOT just
			// stores the author's intent.
			if (patch.prereq !== undefined) {
				if (patch.prereq === null) delete updated.prereq
				else updated.prereq = patch.prereq
			}
			// Countdown rule: `null` clears it (toggle off), an object sets it, omitting
			// the key leaves it untouched (KR-063). The fallback target's validity is
			// checked at the VIEW (dangling surfaced), not here.
			if (patch.countdown !== undefined) {
				if (patch.countdown === null) delete updated.countdown
				else updated.countdown = patch.countdown
			}
			const next: Book = {
				...book,
				edges: book.edges.map((e) => (e.id === edgeId ? updated : e)),
				updatedAt: new Date().toISOString(),
			}
			persist(next)
			events.emit('edge:updated', { bookId, edgeId })
			return updated
		},

		removeEdge(bookId, edgeId) {
			const book = loadBook(bookId)
			if (book === null) return false
			if (getEdge(book, edgeId) === null) return false
			const next: Book = {
				...book,
				edges: book.edges.filter((e) => e.id !== edgeId),
				updatedAt: new Date().toISOString(),
			}
			persist(next)
			events.emit('edge:deleted', { bookId, edgeId })
			return true
		},

		importBook(data) {
			if (!isScenarioExport(data)) return null
			if (!hasOnlyKnownKinds(data.book)) return null
			const now = new Date().toISOString()
			const book: Book = { ...data.book, id: createId('book'), createdAt: now, updatedAt: now }
			persist(book)
			events.emit('book:created', { bookId: book.id })
			return book
		},
	}
}
