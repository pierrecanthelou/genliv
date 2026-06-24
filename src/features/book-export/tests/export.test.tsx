import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { ExportGameButton } from '../index'

function renderButton(
	bookId: string,
	brain = createBrain(),
	onResult?: Parameters<typeof ExportGameButton>[0]['onResult'],
) {
	render(
		<BrainProvider brain={brain}>
			<ExportGameButton bookId={bookId} onResult={onResult} />
		</BrainProvider>,
	)
	return brain
}

describe('book-export — ExportGameButton', () => {
	let createObjectURL: jest.Mock
	let revokeObjectURL: jest.Mock
	const realCreate = URL.createObjectURL
	const realRevoke = URL.revokeObjectURL

	beforeEach(() => {
		window.localStorage.clear()
		createObjectURL = jest.fn(() => 'blob:fake')
		revokeObjectURL = jest.fn()
		URL.createObjectURL = createObjectURL
		URL.revokeObjectURL = revokeObjectURL
		jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
	})

	afterEach(() => {
		URL.createObjectURL = realCreate
		URL.revokeObjectURL = realRevoke
		jest.restoreAllMocks()
	})

	it('downloads a play file and shows a success status for a clean book', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		renderButton(book.id, brain)
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: /exporter le jeu/i }))

		// A blob was created + the anchor clicked (the file was triggered).
		expect(createObjectURL).toHaveBeenCalledTimes(1)
		expect(screen.getByRole('status')).toHaveTextContent(/export réussi/i)
	})

	it('emits book:exported with the warning count', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		// A choice whose hidden prereq points at a deleted object → one dangling ref.
		const created = brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.books.updateEdge(book.id, created.edge.id, { prereq: { objectId: 'ghost' } })
		const seen: { bookId: string; warnings: number }[] = []
		brain.events.on('book:exported', (p) => seen.push(p))
		renderButton(book.id, brain)
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: /exporter le jeu/i }))

		expect(seen).toEqual([{ bookId: book.id, warnings: 1 }])
		expect(screen.getByRole('status')).toHaveTextContent(/1 avertissement/i)
	})

	it('calls onResult with an empty array for a clean export', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const received: unknown[] = []
		renderButton(book.id, brain, (w) => received.push(w))
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: /exporter le jeu/i }))

		expect(received).toHaveLength(1)
		expect(received[0]).toEqual([])
	})

	it('calls onResult with the warning list and keeps the status visible for dirty exports', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		const created = brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.books.updateEdge(book.id, created.edge.id, { prereq: { objectId: 'ghost' } })
		const received: unknown[] = []
		renderButton(book.id, brain, (w) => received.push(w))
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: /exporter le jeu/i }))

		// onResult receives the full warning list (one dangling prereq).
		expect(received).toHaveLength(1)
		expect(Array.isArray(received[0])).toBe(true)
		expect((received[0] as unknown[]).length).toBe(1)
		// Warning status remains visible (no auto-hide timer for warnings).
		expect(screen.getByRole('status')).toHaveTextContent(/1 avertissement/i)
	})

	it('does nothing when the book cannot be read', async () => {
		renderButton('missing-book')
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: /exporter le jeu/i }))

		expect(createObjectURL).not.toHaveBeenCalled()
		expect(screen.queryByRole('status')).not.toBeInTheDocument()
	})
})
