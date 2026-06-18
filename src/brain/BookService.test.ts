import { createBookService } from './BookService'
import { createEventBus, type AppEventName } from './EventBus'
import { createLocalStoragePersistence } from './PersistenceService'
import { bookKey } from './persistenceKeys'
import type { Book } from './types'

function setup() {
	const persistence = createLocalStoragePersistence()
	const events = createEventBus()
	const service = createBookService(persistence, events)
	return { persistence, events, service }
}

describe('BookService.createBook', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('seeds exactly two nodes: one sommaire and one mort, and zero edges', () => {
		const { service } = setup()
		const book = service.createBook('La Caverne')

		expect(book.nodes).toHaveLength(2)
		expect(book.edges).toHaveLength(0)
		expect(book.nodes.filter((n) => n.kind === 'sommaire')).toHaveLength(1)
		expect(book.nodes.filter((n) => n.kind === 'mort')).toHaveLength(1)
	})

	it('seeds the sommaire as an empty text zone (the root)', () => {
		const { service } = setup()
		const book = service.createBook('Titre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')
		expect(sommaire?.text).toBe('')
	})

	it('seeds the mort node locked and isolated (no edges reference it)', () => {
		const { service } = setup()
		const book = service.createBook('Titre')
		const mort = book.nodes.find((n) => n.kind === 'mort')
		expect(mort?.locked).toBe(true)
		expect(book.edges).toHaveLength(0)
	})

	it('trims the title and assigns a unique, collision-free id distinct from the title', () => {
		const { service } = setup()
		const a = service.createBook('  Mon Livre  ')
		const b = service.createBook('Mon Livre')
		expect(a.title).toBe('Mon Livre')
		expect(a.id).not.toBe(b.id)
		expect(a.id).not.toContain('Mon Livre')
	})

	it('persists the book under its id key and is retrievable via getBook/listBooks', () => {
		const { service, persistence } = setup()
		const book = service.createBook('Persisté')
		expect(persistence.get<Book>(bookKey(book.id))).not.toBeNull()
		expect(service.getBook(book.id)?.title).toBe('Persisté')
		expect(service.listBooks().map((b) => b.id)).toContain(book.id)
	})

	it('emits book:created after the book is persisted', () => {
		const { service, events } = setup()
		let persistedTitleAtEmit: string | null = null
		events.on('book:created', ({ bookId }) => {
			persistedTitleAtEmit = service.getBook(bookId)?.title ?? null
		})
		service.createBook('Atomic')
		expect(persistedTitleAtEmit).toBe('Atomic')
	})

	it('emits book:created then book:opened in order across create + open', () => {
		const { service, events } = setup()
		const order: AppEventName[] = []
		events.on('book:created', () => order.push('book:created'))
		events.on('book:opened', () => order.push('book:opened'))
		const book = service.createBook('Ordered')
		service.openBook(book.id)
		expect(order).toEqual(['book:created', 'book:opened'])
	})
})

describe('BookService unknown-kind boundary (KR-116)', () => {
	beforeEach(() => {
		window.localStorage.clear()
		jest.spyOn(console, 'warn').mockImplementation(() => {})
	})
	afterEach(() => {
		jest.restoreAllMocks()
	})

	/** Persist a book straight to storage with a corrupted node kind. */
	function seedCorruptBook(persistence: ReturnType<typeof createLocalStoragePersistence>, id: string): void {
		const now = new Date().toISOString()
		persistence.set(bookKey(id), {
			id,
			title: 'Corrompu',
			createdAt: now,
			updatedAt: now,
			nodes: [{ id: 'n1', kind: 'dragon', text: '' }],
			edges: [],
		})
	}

	it('treats a book with an unknown node kind as unreadable (getBook/openBook return null, no throw)', () => {
		const { service, persistence } = setup()
		seedCorruptBook(persistence, 'book_corrupt')

		expect(() => service.getBook('book_corrupt')).not.toThrow()
		expect(service.getBook('book_corrupt')).toBeNull()
		expect(service.openBook('book_corrupt')).toBeNull()
	})

	it('treats a book with an unknown EDGE kind as unreadable too', () => {
		const { service, persistence } = setup()
		const now = new Date().toISOString()
		persistence.set(bookKey('book_edge'), {
			id: 'book_edge',
			title: 'Arête corrompue',
			createdAt: now,
			updatedAt: now,
			nodes: [{ id: 'n1', kind: 'sommaire', text: '' }],
			edges: [{ id: 'e1', from: 'n1', to: 'n1', kind: 'teleport' }],
		})
		expect(service.getBook('book_edge')).toBeNull()
	})

	it('omits a corrupt book from listBooks but keeps valid ones', () => {
		const { service, persistence } = setup()
		const ok = service.createBook('Valide')
		seedCorruptBook(persistence, 'book_corrupt')

		const ids = service.listBooks().map((b) => b.id)
		expect(ids).toContain(ok.id)
		expect(ids).not.toContain('book_corrupt')
	})

	it('refuses to mutate a corrupt book, but still allows deleting it', () => {
		const { service, persistence } = setup()
		seedCorruptBook(persistence, 'book_corrupt')

		expect(service.addNode('book_corrupt', 'choix')).toBeNull()
		// A corrupt book must remain deletable so the user can clean it up.
		expect(service.deleteBook('book_corrupt')).toBe(true)
		expect(persistence.get(bookKey('book_corrupt'))).toBeNull()
	})
})

describe('BookService.deleteBook', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('removes the book from storage and drops it from listBooks', () => {
		const { service } = setup()
		const book = service.createBook('À supprimer')
		expect(service.listBooks().map((b) => b.id)).toContain(book.id)

		expect(service.deleteBook(book.id)).toBe(true)

		expect(service.getBook(book.id)).toBeNull()
		expect(service.listBooks().map((b) => b.id)).not.toContain(book.id)
	})

	it('persists the removal before emitting book:deleted (KR-004)', () => {
		const { service, events } = setup()
		const book = service.createBook('Atomic')
		let existedAtEmit = true
		events.on('book:deleted', ({ bookId }) => {
			existedAtEmit = service.getBook(bookId) !== null
		})

		service.deleteBook(book.id)

		expect(existedAtEmit).toBe(false)
	})

	it('only deletes the targeted book, leaving the others intact', () => {
		const { service } = setup()
		const a = service.createBook('A')
		const b = service.createBook('B')

		service.deleteBook(a.id)

		expect(service.getBook(a.id)).toBeNull()
		expect(service.getBook(b.id)?.title).toBe('B')
	})

	it('returns false and emits nothing for an unknown book', () => {
		const { service, events } = setup()
		let fired = false
		events.on('book:deleted', () => {
			fired = true
		})
		expect(service.deleteBook('book_missing')).toBe(false)
		expect(fired).toBe(false)
	})
})

describe('BookService.addNode', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('appends a free-floating node of the requested kind, never auto-linked', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const node = service.addNode(book.id, 'choix')

		expect(node).not.toBeNull()
		expect(node?.kind).toBe('choix')
		const stored = service.getBook(book.id)
		expect(stored?.nodes).toHaveLength(3)
		// Free-floating: no edge references the new node.
		expect(stored?.edges).toHaveLength(0)
	})

	it('gives the new node a deterministic position, never piling at 0,0', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const a = service.addNode(book.id, 'choix')
		const b = service.addNode(book.id, 'pnj')

		expect(a?.position).toBeDefined()
		expect(b?.position).toBeDefined()
		expect(a?.position).not.toEqual({ x: 0, y: 0 })
		expect(a?.position).not.toEqual(b?.position)
	})

	it('persists before emitting node:created (carrying the kind)', () => {
		const { service, events } = setup()
		const book = service.createBook('Arbre')
		let lengthAtEmit = -1
		let kindAtEmit: string | null = null
		events.on('node:created', ({ bookId, nodeId, kind }) => {
			kindAtEmit = kind
			const persisted = service.getBook(bookId)
			lengthAtEmit = persisted?.nodes.length ?? -1
			expect(persisted?.nodes.some((n) => n.id === nodeId)).toBe(true)
		})
		service.addNode(book.id, 'monstre')
		expect(kindAtEmit).toBe('monstre')
		expect(lengthAtEmit).toBe(3)
	})

	it('returns null and emits nothing for an unknown book', () => {
		const { service, events } = setup()
		let fired = false
		events.on('node:created', () => {
			fired = true
		})
		expect(service.addNode('book_missing', 'choix')).toBeNull()
		expect(fired).toBe(false)
	})
})

describe('BookService.updateNode', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('patches text + end flags and persists before emitting node:updated', () => {
		const { service, events } = setup()
		const book = service.createBook('Arbre')
		const target = service.addNode(book.id, 'choix')!
		let textAtEmit: string | null = null
		events.on('node:updated', ({ bookId, nodeId }) => {
			textAtEmit = service.getBook(bookId)?.nodes.find((n) => n.id === nodeId)?.text ?? null
		})

		const updated = service.updateNode(book.id, target.id, { text: 'Une porte close.', endVictory: true })

		expect(updated?.text).toBe('Une porte close.')
		expect(updated?.endVictory).toBe(true)
		expect(textAtEmit).toBe('Une porte close.')
		// Survives reload (persisted).
		expect(service.getBook(book.id)?.nodes.find((n) => n.id === target.id)?.endVictory).toBe(true)
	})

	it('only accepts text edits on the locked Mort node, ignoring end flags (KR-002)', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const mort = book.nodes.find((n) => n.kind === 'mort')!

		const updated = service.updateNode(book.id, mort.id, { text: 'Vous périssez.', endVictory: true })

		expect(updated?.text).toBe('Vous périssez.')
		expect(updated?.endVictory).toBeUndefined()
	})

	it('only accepts text edits on the Sommaire root, ignoring action/end flags (KR-055)', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!

		const updated = service.updateNode(book.id, sommaire.id, {
			text: 'Au seuil.',
			endFailure: true,
			actionType: 'monstre',
			decor: { interaction: 'prendre' },
			pnj: { name: 'X', dialogue: 'Y' },
			monster: { name: 'M', pv: 10, attack: 1, defense: 1, outcomes: { reussite: '', echec: '' } },
			trap: { description: 'T', outcomes: { reussite: '', echec: '' }, fatal: true },
		})

		expect(updated?.text).toBe('Au seuil.')
		expect(updated?.endFailure).toBeUndefined()
		expect(updated?.actionType).toBeUndefined()
		// Action config never lands on a structural screen (KR-090).
		expect(updated?.decor).toBeUndefined()
		expect(updated?.pnj).toBeUndefined()
		expect(updated?.monster).toBeUndefined()
		expect(updated?.trap).toBeUndefined()
	})

	it('returns null for an unknown book or node', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		expect(service.updateNode('book_missing', 'x', { text: 'a' })).toBeNull()
		expect(service.updateNode(book.id, 'node_missing', { text: 'a' })).toBeNull()
	})
})

describe('BookService edges (choice-linking)', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('addChoiceBranch creates a child + a choice edge and emits node:created then edge:created', () => {
		const { service, events } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const order: AppEventName[] = []
		events.on('node:created', () => order.push('node:created'))
		events.on('edge:created', () => order.push('edge:created'))

		const created = service.addChoiceBranch(book.id, sommaire.id)

		expect(created).not.toBeNull()
		expect(created!.edge).toMatchObject({ from: sommaire.id, to: created!.node.id, kind: 'choice' })
		const stored = service.getBook(book.id)!
		expect(stored.nodes).toHaveLength(3)
		expect(stored.edges).toHaveLength(1)
		expect(order).toEqual(['node:created', 'edge:created'])
	})

	it('refuses an outgoing branch from the structural Mort node (KR-055/060)', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const mort = book.nodes.find((n) => n.kind === 'mort')!
		expect(service.addChoiceBranch(book.id, mort.id)).toBeNull()
		expect(service.getBook(book.id)!.edges).toHaveLength(0)
	})

	it('addEdge relinks to an existing node (enabling cycles) without creating a node', () => {
		const { service, events } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		// Relink targets must be non-structural (KR-067), so seed a real screen.
		const target = service.addNode(book.id, 'choix')!
		let payload: { from: string; to: string; kind: string } | null = null
		events.on('edge:created', (p) => {
			payload = { from: p.from, to: p.to, kind: p.kind }
		})

		const edge = service.addEdge(book.id, sommaire.id, target.id, 'relink')

		expect(edge).not.toBeNull()
		expect(payload).toEqual({ from: sommaire.id, to: target.id, kind: 'relink' })
		const stored = service.getBook(book.id)!
		expect(stored.nodes).toHaveLength(3) // the seeded target, none created by relink
		expect(stored.edges).toHaveLength(1)
	})

	it('addEdge rejects unknown endpoints and edges out of Mort', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const mort = book.nodes.find((n) => n.kind === 'mort')!
		expect(service.addEdge(book.id, sommaire.id, 'ghost', 'relink')).toBeNull()
		expect(service.addEdge(book.id, mort.id, sommaire.id, 'relink')).toBeNull()
	})

	it('addEdge rejects edges INTO the structural Sommaire or Mort screens (KR-067)', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const mort = book.nodes.find((n) => n.kind === 'mort')!
		const child = service.addChoiceBranch(book.id, sommaire.id)!.node

		// Mort is reached only automatically in combat; Sommaire is the root.
		expect(service.addEdge(book.id, child.id, mort.id, 'relink')).toBeNull()
		expect(service.addEdge(book.id, child.id, sommaire.id, 'relink')).toBeNull()
		// Only the original choice edge survives — no relink into a structural screen.
		expect(service.getBook(book.id)!.edges).toHaveLength(1)
	})

	it('addEdge rejects a self-link and a duplicate identical edge (KR-061)', () => {
		const { service, events } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const target = service.addNode(book.id, 'choix')!

		// Self-link is degenerate: a node may not relink to itself.
		expect(service.addEdge(book.id, target.id, target.id, 'relink')).toBeNull()

		// First relink succeeds; an identical second one (same from/to/kind) is rejected.
		expect(service.addEdge(book.id, sommaire.id, target.id, 'relink')).not.toBeNull()
		let created = 0
		events.on('edge:created', () => {
			created += 1
		})
		expect(service.addEdge(book.id, sommaire.id, target.id, 'relink')).toBeNull()
		expect(created).toBe(0) // no event for the rejected duplicate
		// Only the one accepted relink survives.
		expect(service.getBook(book.id)!.edges.filter((e) => e.kind === 'relink')).toHaveLength(1)
	})

	it('addEdge allows a second edge to the same target when the kind differs (not identical)', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const target = service.addNode(book.id, 'choix')!
		expect(service.addEdge(book.id, sommaire.id, target.id, 'relink')).not.toBeNull()
		// A flee edge to the same target is a different kind — not a duplicate.
		expect(service.addEdge(book.id, sommaire.id, target.id, 'flee')).not.toBeNull()
		expect(service.getBook(book.id)!.edges).toHaveLength(2)
	})

	it('removeEdge deletes only the edge (never the target node) and emits edge:deleted', () => {
		const { service, events } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const { edge, node } = service.addChoiceBranch(book.id, sommaire.id)!
		let deleted = false
		events.on('edge:deleted', () => {
			deleted = true
		})

		expect(service.removeEdge(book.id, edge.id)).toBe(true)
		expect(deleted).toBe(true)
		const stored = service.getBook(book.id)!
		expect(stored.edges).toHaveLength(0)
		expect(stored.nodes.some((n) => n.id === node.id)).toBe(true) // target node survives
		expect(service.removeEdge(book.id, 'edge_missing')).toBe(false)
	})

	it('updateEdge sets the choice label, persists it, and emits edge:updated', () => {
		const { service, events } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const { edge } = service.addChoiceBranch(book.id, sommaire.id)!
		let updatedId: string | null = null
		events.on('edge:updated', (p) => {
			updatedId = p.edgeId
		})

		const updated = service.updateEdge(book.id, edge.id, { label: 'Ouvrir la porte' })
		expect(updated?.label).toBe('Ouvrir la porte')
		expect(updatedId).toBe(edge.id)
		expect(service.getBook(book.id)!.edges.find((e) => e.id === edge.id)!.label).toBe('Ouvrir la porte')
	})

	it('updateEdge drops the label when set blank, so consumers fall back to the kind label', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		const sommaire = book.nodes.find((n) => n.kind === 'sommaire')!
		const { edge } = service.addChoiceBranch(book.id, sommaire.id)!
		service.updateEdge(book.id, edge.id, { label: 'Fuir' })

		const cleared = service.updateEdge(book.id, edge.id, { label: '   ' })
		expect(cleared?.label).toBeUndefined()
		expect(service.getBook(book.id)!.edges.find((e) => e.id === edge.id)!.label).toBeUndefined()
	})

	it('updateEdge returns null for a missing book or edge', () => {
		const { service } = setup()
		const book = service.createBook('Arbre')
		expect(service.updateEdge('book_missing', 'edge_x', { label: 'x' })).toBeNull()
		expect(service.updateEdge(book.id, 'edge_missing', { label: 'x' })).toBeNull()
	})
})

describe('BookService.renameBook / duplicateBook (book-library)', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('renameBook stores the trimmed title, persists it, and emits book:updated', () => {
		const { service, events } = setup()
		const book = service.createBook('Brouillon')
		let updatedId: string | null = null
		events.on('book:updated', (p) => {
			updatedId = p.bookId
		})

		const renamed = service.renameBook(book.id, '  La Caverne  ')
		expect(renamed?.title).toBe('La Caverne')
		expect(updatedId).toBe(book.id)
		expect(service.getBook(book.id)!.title).toBe('La Caverne')
	})

	it('renameBook rejects a blank title and a missing book', () => {
		const { service } = setup()
		const book = service.createBook('La Caverne')
		expect(service.renameBook(book.id, '   ')).toBeNull()
		expect(service.getBook(book.id)!.title).toBe('La Caverne') // unchanged
		expect(service.renameBook('book_missing', 'x')).toBeNull()
	})

	it('duplicateBook deep-copies the tree with fresh ids, remapped edges, and a (copie) title', () => {
		const { service, events } = setup()
		const source = service.createBook('La Caverne')
		const sommaire = source.nodes.find((n) => n.kind === 'sommaire')!
		service.addChoiceBranch(source.id, sommaire.id) // gives the source a node + an edge to remap
		let createdId: string | null = null
		events.on('book:created', (p) => {
			createdId = p.bookId
		})

		const copy = service.duplicateBook(source.id)!
		expect(createdId).toBe(copy.id)
		expect(copy.id).not.toBe(source.id)
		expect(copy.title).toBe('La Caverne (copie)')
		expect(copy.nodes).toHaveLength(source.nodes.length + 1)
		expect(copy.edges).toHaveLength(1)

		// Fresh node ids, and the copied edge points at the COPY's nodes (KR-003).
		const sourceIds = new Set(service.getBook(source.id)!.nodes.map((n) => n.id))
		expect(copy.nodes.every((n) => !sourceIds.has(n.id))).toBe(true)
		const copyIds = new Set(copy.nodes.map((n) => n.id))
		expect(copyIds.has(copy.edges[0].from)).toBe(true)
		expect(copyIds.has(copy.edges[0].to)).toBe(true)

		// Both books persist independently.
		expect(
			service
				.listBooks()
				.map((b) => b.id)
				.sort(),
		).toEqual([source.id, copy.id].sort())
	})

	it('duplicateBook deep-clones nested node sub-objects (no shared references with the source)', () => {
		const { service } = setup()
		const source = service.createBook('La Caverne')
		const child = service.addChoiceBranch(source.id, source.nodes.find((n) => n.kind === 'sommaire')!.id)!.node
		service.updateNode(source.id, child.id, { decor: { interaction: 'fouiller' } })

		const copy = service.duplicateBook(source.id)!
		const sourceChild = service.getBook(source.id)!.nodes.find((n) => n.decor !== undefined)!
		const copyChild = copy.nodes.find((n) => n.decor !== undefined)!
		// Same value, but distinct object references — an in-place edit can't leak across books.
		expect(copyChild.decor).toEqual(sourceChild.decor)
		expect(copyChild.decor).not.toBe(sourceChild.decor)
		expect(copyChild.position).not.toBe(sourceChild.position)
	})

	it('duplicateBook returns null for a missing book', () => {
		const { service } = setup()
		expect(service.duplicateBook('book_missing')).toBeNull()
	})
})
