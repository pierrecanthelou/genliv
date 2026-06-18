import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type AppEventName, type CloudTransport } from '../../../brain'
import { App } from '../../../App'

function renderApp() {
	const brain = createBrain()
	const order: AppEventName[] = []
	brain.events.on('book:created', () => order.push('book:created'))
	brain.events.on('book:opened', () => order.push('book:opened'))
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, order }
}

describe('book-creation flow', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('creates a book from the home screen and navigates to its editor', async () => {
		const user = userEvent.setup()
		const { brain, order } = renderApp()

		await user.click(screen.getByRole('button', { name: /nouveau livre/i }))
		await user.type(screen.getByLabelText(/titre/i), "La Caverne d'Aldûr")
		await user.click(screen.getByRole('button', { name: 'Créer' }))

		// Landed in the editor: the new book title is shown as the heading.
		expect(screen.getByRole('heading', { name: "La Caverne d'Aldûr" })).toBeInTheDocument()
		// Editor shows the seeded Sommaire placeholder (empty-state rule).
		expect(screen.getByText(/écrivez ici le texte d'introduction/i)).toBeInTheDocument()

		// Exactly one book persisted, events fired in order.
		expect(brain.books.listBooks()).toHaveLength(1)
		expect(order).toEqual(['book:created', 'book:opened'])
	})

	it('does not create a book when the dialog is cancelled', async () => {
		const user = userEvent.setup()
		const { brain } = renderApp()

		await user.click(screen.getByRole('button', { name: /nouveau livre/i }))
		await user.type(screen.getByLabelText(/titre/i), 'Abandonné')
		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(brain.books.listBooks()).toHaveLength(0)
		expect(screen.getByRole('heading', { name: /mes livres-jeux/i })).toBeInTheDocument()
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
