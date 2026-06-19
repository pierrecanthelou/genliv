import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type CloudTransport } from '../../../brain'
import { ConflictDialog } from '../components/ConflictDialog'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

/** A transport that never confirms the push (local stays queued) and whose cloud copy is
 *  a NEWER, valid book document (so adopting it loads cleanly via getBook). */
function conflictTransport(): CloudTransport {
	return {
		push: () => new Promise<void>(() => {}),
		pull: async () => ({
			id: 'cloud-book',
			title: 'cloud',
			createdAt: '2999-01-01T00:00:00.000Z',
			updatedAt: '2999-01-01T00:00:00.000Z',
			nodes: [
				{ id: 'n1', kind: 'sommaire', text: '' },
				{ id: 'n2', kind: 'mort', text: '', locked: true },
			],
			edges: [],
		}),
	}
}

/** Create a book, open its editor, and drive it into a sync conflict. */
async function setupConflict() {
	const brain = createBrain({ transport: conflictTransport() })
	const book = brain.books.createBook('Mon livre') // writes local + queues the push (pending)
	brain.router.navigate({ name: 'editor', bookId: book.id })
	render(
		<BrainProvider brain={brain}>
			<ConflictDialog />
		</BrainProvider>,
	)
	// Opening the book reconciles against the (newer) cloud → conflict.
	await act(async () => {
		brain.events.emit('book:opened', { bookId: book.id })
		await flush()
	})
	return { brain, book }
}

describe('cloud-sync — ConflictDialog', () => {
	beforeEach(() => window.localStorage.clear())

	it('shows no dialog when there is no conflict', () => {
		const brain = createBrain()
		const book = brain.books.createBook('Sans conflit')
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<ConflictDialog />
			</BrainProvider>,
		)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('surfaces a conflict for the open book and keeps local on « Garder ma version »', async () => {
		const { brain } = await setupConflict()
		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(brain.sync.conflicts()).toHaveLength(1)

		await userEvent.click(screen.getByRole('button', { name: /garder ma version/i }))

		expect(brain.sync.conflicts()).toEqual([])
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('adopts the cloud version on « Prendre la version du cloud »', async () => {
		const { brain, book } = await setupConflict()

		await userEvent.click(screen.getByRole('button', { name: /version du cloud/i }))

		expect(brain.sync.conflicts()).toEqual([])
		expect(brain.books.getBook(book.id)?.title).toBe('cloud') // adopted the cloud copy
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})
})
