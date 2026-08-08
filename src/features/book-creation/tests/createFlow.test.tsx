import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type AppEventName, type CloudTransport } from '../../../brain'
import { CreateBookEntry } from '../components/CreateBookEntry'

/**
 * Mounts the create affordance ON ITS OWN, not via `<App/>`: since bascule-editeur
 * it1 (n° 2 `bibliotheque-dossiers`), App.tsx no longer composes book-creation
 * into the home screen (a Book created there would be invisible in a
 * Dossier-only library). The flow itself — dialog, BookService, event order —
 * is unchanged and still worth its own component-level coverage; it lands on
 * a Dossier route again once book-creation is repointed in itération 2.
 */
function renderEntry() {
	const brain = createBrain()
	const order: AppEventName[] = []
	brain.events.on('book:created', () => order.push('book:created'))
	brain.events.on('book:opened', () => order.push('book:opened'))
	render(
		<BrainProvider brain={brain}>
			<CreateBookEntry />
		</BrainProvider>,
	)
	return { brain, order }
}

describe('book-creation flow', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('creates a book from its own entry point, persisting it and firing events in order', async () => {
		const user = userEvent.setup()
		const { brain, order } = renderEntry()

		await user.click(screen.getByRole('button', { name: /nouveau livre/i }))
		await user.type(screen.getByLabelText(/titre/i), "La Caverne d'Aldûr")
		await user.click(screen.getByRole('button', { name: 'Créer' }))

		// No editor route to land in outside App: assert through BookService directly.
		expect(brain.books.listBooks()).toHaveLength(1)
		expect(brain.books.listBooks()[0].title).toBe("La Caverne d'Aldûr")
		expect(order).toEqual(['book:created', 'book:opened'])
	})

	it('does not create a book when the dialog is cancelled', async () => {
		const user = userEvent.setup()
		const { brain } = renderEntry()

		await user.click(screen.getByRole('button', { name: /nouveau livre/i }))
		await user.type(screen.getByLabelText(/titre/i), 'Abandonné')
		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(brain.books.listBooks()).toHaveLength(0)
	})
})

// Cloud-first create (iteration 3): a new book is written to the local store
// first (so it persists + restores on reload offline) and queued for the
// background cloud push via the CloudSyncService decorator (KR-093/095/011).
describe('book-creation cloud-first persistence', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('persists a created book under PersistenceService so it survives a reload', () => {
		// First "session": create a book.
		const created = createBrain().books.createBook('Persistante')
		// "Reload": a brand-new brain over the same local store re-reads the book.
		const reloaded = createBrain()
		expect(reloaded.books.getBook(created.id)?.title).toBe('Persistante')
		expect(reloaded.books.listBooks().map((b) => b.title)).toContain('Persistante')
	})

	it('queues a freshly created book for the cloud when a transport is configured', () => {
		// A transport whose push never resolves models being offline/unreachable.
		const transport: CloudTransport = {
			push: () => new Promise<void>(() => {}),
			pull: () => Promise.resolve(null),
		}
		// Default debounce window; the synchronous assertions below run before any
		// flush timer fires, so the never-resolving push is never invoked.
		const brain = createBrain({ transport })
		const book = brain.books.createBook('Hors-ligne')
		// Local-first: the write is queued for the background push synchronously,
		// yet the book is already readable locally (never blocked on the cloud).
		expect(brain.sync.pendingCount()).toBeGreaterThanOrEqual(1)
		expect(brain.books.listBooks().map((b) => b.title)).toContain('Hors-ligne')
		expect(brain.books.getBook(book.id)?.title).toBe('Hors-ligne')
	})
})
