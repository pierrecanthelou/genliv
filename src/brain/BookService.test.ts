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
