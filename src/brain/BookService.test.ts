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
		})

		expect(updated?.text).toBe('Au seuil.')
		expect(updated?.endFailure).toBeUndefined()
		expect(updated?.actionType).toBeUndefined()
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
		const mort = book.nodes.find((n) => n.kind === 'mort')!
		let payload: { from: string; to: string; kind: string } | null = null
		events.on('edge:created', (p) => {
			payload = { from: p.from, to: p.to, kind: p.kind }
		})

		const edge = service.addEdge(book.id, sommaire.id, mort.id, 'relink')

		expect(edge).not.toBeNull()
		expect(payload).toEqual({ from: sommaire.id, to: mort.id, kind: 'relink' })
		const stored = service.getBook(book.id)!
		expect(stored.nodes).toHaveLength(2) // no node created
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
})
