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
